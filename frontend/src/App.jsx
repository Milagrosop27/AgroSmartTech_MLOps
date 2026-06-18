import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import Record from './views/record.jsx';

// FIREBASE
import { auth } from './config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Login from './views/login.jsx';

import Overview from './views/overview.jsx';
import Analitica from './views/analitica.jsx';
import Guardian from './views/guardian.jsx';
import Alerts from './views/alerts.jsx';
import Simulador from './views/simulador.jsx';

import MainLayout from './layouts/MainLayout';
import AppContext from './context/AppContext';
import { getDashboard, getZonas } from './services/api';

function App() {
  const [usuario, setUsuario] = useState(null);
  const [cargandoAuth, setCargandoAuth] = useState(true);
  const [riesgo, setRiesgo] = useState("Esperando...");
  const [fertilizante, setFertilizante] = useState("Esperando...");
  const [notificacion, setNotificacion] = useState({ mostrar: false, mensaje: '', tipo: '' });

  const [historialAlertas, setHistorialAlertas] = useState(() => {
    const guardado = localStorage.getItem('agro_history_v1');
    return guardado ? JSON.parse(guardado) : [];
  });

  const [datosSensores, setDatosSensores] = useState({ temp: 0, hum: 0, ph: 0, ndvi: 0 });
  const [historialGrafico, setHistorialGrafico] = useState([]);
  const [parcelas, setParcelas] = useState([]);
  const [origenDatos, setOrigenDatos] = useState("cargando");
  const [hectareaSeleccionada, setHectareaSeleccionada] = useState(null);
  const [zonas, setZonas] = useState({ hectareas: [], sectores_por_hectarea: {} });

  useEffect(() => {
    const desubscribir = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      setCargandoAuth(false);
    });
    return () => desubscribir();
  }, []);

  useEffect(() => {
    localStorage.setItem('agro_history_v1', JSON.stringify(historialAlertas));
  }, [historialAlertas]);

  useEffect(() => {
    if (!usuario) return;
    const cargarZonas = async () => {
      try {
        const { data } = await getZonas();
        if (data?.hectareas?.length > 0) setZonas(data);
      } catch (err) {
        console.warn("No se pudo cargar el catalogo de zonas:", err);
      }
    };
    cargarZonas();
  }, [usuario]);

  useEffect(() => {
    if (!usuario) return;

    const aplicarRegistros = (registros) => {
      if (!Array.isArray(registros) || registros.length === 0) return false;
      setParcelas(registros);
      setHistorialGrafico(registros);
      const ultimoRegistro = registros[registros.length - 1];
      setRiesgo(ultimoRegistro.crop_disease_status || ultimoRegistro.diagnostico || "Sin diagnostico");
      setFertilizante(ultimoRegistro.recomendacion || "Sin sugerencia");
      setDatosSensores({
        temp:  Number(ultimoRegistro.temperature_C    || 0),
        hum:   Number(ultimoRegistro['humidity_%']    || 0),
        ph:    Number(ultimoRegistro.soil_pH          || 0),
        ndvi:  Number(ultimoRegistro.NDVI_index       || 0),
      });
      localStorage.setItem('agro_last_record', JSON.stringify(ultimoRegistro));
      return true;
    };

    const consultarDatos = async () => {
      try {
        const { data: datos } = await getDashboard({ hectarea: hectareaSeleccionada });
        if (Array.isArray(datos) && datos.length > 0) {
          aplicarRegistros(datos);
          setOrigenDatos("api");
        } else {
          setParcelas([]);
          setHistorialGrafico([]);
          setOrigenDatos("vacio");
        }
      } catch {
        if (!hectareaSeleccionada) {
          const cache = localStorage.getItem('agro_last_record');
          if (cache) {
            try {
              aplicarRegistros([JSON.parse(cache)]);
              setOrigenDatos("cache");
            } catch {
              setOrigenDatos("error");
            }
          } else {
            setOrigenDatos("error");
          }
        } else {
          setOrigenDatos("error");
        }
      }
    };

    consultarDatos();
  }, [usuario, hectareaSeleccionada]);

  // === POLLING DE CONFIRMACIONES WHATSAPP ===
  useEffect(() => {
    if (!usuario) return;

    const intervalo = setInterval(async () => {
      const hayPendientes = historialAlertas.some(a => a.estado === 'PENDING');
      if (!hayPendientes) return;

      try {
        const response = await fetch(
          'https://agrosmart-api-940420015515.us-central1.run.app/api/confirmaciones'
        );
        const data = await response.json();

        if (data.confirmadas && data.confirmadas.length > 0) {
          setHistorialAlertas(actual =>
            actual.map((alerta, index) => {
              if (
                alerta.estado === 'PENDING' &&
                index === actual.findIndex(a => a.estado === 'PENDING')
              ) {
                return { ...alerta, estado: 'SUCCESS' };
              }
              return alerta;
            })
          );
          mostrarNotificacion('✅ Acción confirmada por el agricultor.');
        }
      } catch (error) {
        console.error('Error en polling de confirmaciones:', error);
      }
    }, 5000);

    return () => clearInterval(intervalo);
  }, [usuario, historialAlertas]);

  const mostrarNotificacion = (mensaje, tipo = 'success') => {
    setNotificacion({ mostrar: true, mensaje, tipo });
    setTimeout(() => setNotificacion({ mostrar: false, mensaje: '', tipo: '' }), 4000);
  };

  const manejarAprobacionAlerta = async (registroEspecifico, telefonoDestino) => {
    try {
      if (!registroEspecifico || !telefonoDestino) return;

      const payload = {
        telefono: telefonoDestino,
        riesgo:    registroEspecifico.crop_disease_status || riesgo,
        fertilizante,
        farm_id:   registroEspecifico.farm_id   || "FARM_001",
        cultivo:   registroEspecifico.crop_type  || "Maiz",
        ndvi:      (registroEspecifico.NDVI_index    || datosSensores.ndvi).toString(),
        humedad:   (registroEspecifico['humidity_%'] || datosSensores.hum).toString(),
        accion:    fertilizante,
      };

      const response = await fetch(
        'https://agrosmart-api-940420015515.us-central1.run.app/enviar-alerta-wa',
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
      );
      const resultado = await response.json();

      if (resultado.status === "success") {
        mostrarNotificacion(`Alerta enviada al agricultor del ${registroEspecifico.farm_id}.`);

        const idUnico = Date.now();
        const nuevaAlerta = {
          id: idUnico,
          fecha: new Date().toLocaleString(),
          lote: registroEspecifico.farm_id || "Lote Desconocido",
          diagnostico: registroEspecifico.crop_disease_status || riesgo,
          recomendacion: fertilizante,
          estado: 'PENDING',
          telefono: telefonoDestino, // ✅ guardamos el teléfono para reenvío
        };
        setHistorialAlertas(prev => [nuevaAlerta, ...prev]);

        setTimeout(() => {
          setHistorialAlertas(actual =>
            actual.map(a =>
              a.id === idUnico && a.estado === 'PENDING' ? { ...a, estado: 'TIMEOUT' } : a
            )
          );
        }, 60000);

      } else {
        mostrarNotificacion("Error al comunicarse con WhatsApp", "error");
      }
    } catch (error) {
      console.error("Error enviando alerta:", error);
      mostrarNotificacion("Error de conexion", "error");
    }
  };

  const confirmarAlerta = (id) => {
    setHistorialAlertas(prev =>
      prev.map(a => a.id === id ? { ...a, estado: 'SUCCESS' } : a)
    );
  };

  const contextValue = {
    riesgo, setRiesgo, fertilizante, setFertilizante,
    datosSensores, setDatosSensores,
    historialGrafico, setHistorialGrafico,
    parcelas, setParcelas,
    origenDatos, setOrigenDatos,
    historialAlertas, setHistorialAlertas,
    manejarAprobacionAlerta, confirmarAlerta,
  };

  if (cargandoAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-xl font-medium text-green-700 animate-pulse">
          Validando credenciales...
        </div>
      </div>
    );
  }

  if (!usuario) return <Login />;

  return (
    <Router>
      <AppContext.Provider value={contextValue}>
        {notificacion.mostrar && (
          <div className="fixed bottom-10 right-10 z-[9999] transition-all duration-500 ease-in-out">
            <div className={`px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 text-white font-medium
              ${notificacion.tipo === 'success' ? 'bg-[#25D366]' : 'bg-red-500'}`}>
              {notificacion.tipo === 'success'
                ? <CheckCircle size={24} />
                : <AlertTriangle size={24} />}
              <span className="text-sm">{notificacion.mensaje}</span>
            </div>
          </div>
        )}

        <Routes>
          <Route path="/" element={<MainLayout origenDatos={origenDatos} />}>
            <Route
              index
              element={
                <Overview
                  parcelas={parcelas}
                  manejarAprobacionAlerta={manejarAprobacionAlerta}
                  zonas={zonas}
                  hectareaSeleccionada={hectareaSeleccionada}
                  setHectareaSeleccionada={setHectareaSeleccionada}
                />
              }
            />
            <Route path="analitica" element={<Analitica parcelas={parcelas} zonas={zonas} hectareaSeleccionada={hectareaSeleccionada} setHectareaSeleccionada={setHectareaSeleccionada} />} />
            <Route path="guardian" element={<Guardian riesgo={riesgo} fertilizante={fertilizante} datosSensores={datosSensores} />} />
            <Route path="alertas" element={<Alerts historialAlertas={historialAlertas} manejarAprobacionAlerta={manejarAprobacionAlerta} confirmarAlerta={confirmarAlerta} />} />
            <Route path="record" element={<Record historialAlertas={historialAlertas} />} />
            <Route path="simulador" element={<Simulador />} />
            <Route path="*" element={<div className="p-10 text-center"><h2 className="text-3xl font-bold text-red-500 mb-4">Ruta no encontrada</h2></div>} />
          </Route>
        </Routes>
      </AppContext.Provider>
    </Router>
  );
}

export default App;