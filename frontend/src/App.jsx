// src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import Record from './views/record.jsx';

// IMPORTACIONES DE FIREBASE (¡NO TOCAR!)
import { auth } from './config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Login from './views/login.jsx';

import Overview from './views/overview.jsx';
import Guardian from './views/guardian.jsx';
import Alerts from './views/alerts.jsx';

import MainLayout from './layouts/MainLayout';
import AppContext from './context/AppContext';

function App() {
  // === ESTADOS DE AUTENTICACIÓN ===
  const [usuario, setUsuario] = useState(null);
  const [cargandoAuth, setCargandoAuth] = useState(true);

  // === ESTADOS ORIGINALES DE AGROSMART ===
  const [riesgo, setRiesgo] = useState("Esperando...");
  const [fertilizante, setFertilizante] = useState("Esperando...");
  const [notificacion, setNotificacion] = useState({ mostrar: false, mensaje: '', tipo: '' });

  const [historialAlertas, setHistorialAlertas] = useState(() => {
    const guardado = localStorage.getItem('agro_history_v1');
    return guardado ? JSON.parse(guardado) : [];
  });

  const [datosSensores, setDatosSensores] = useState({
    temp: 0, hum: 0, ph: 0, ndvi: 0,
  });
  const [historialGrafico, setHistorialGrafico] = useState([]);
  const [parcelas, setParcelas] = useState([]);
  const [origenDatos, setOrigenDatos] = useState("cargando");

  // === OBSERVADOR DE SESIÓN DE FIREBASE ===
  useEffect(() => {
    const desubscribir = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      setCargandoAuth(false);
    });
    return () => desubscribir();
  }, []);

  // === LÓGICA ORIGINAL DE AGROSMART ===
  useEffect(() => {
    localStorage.setItem('agro_history_v1', JSON.stringify(historialAlertas));
  }, [historialAlertas]);

  useEffect(() => {
    const aplicarRegistro = (registro) => {
      if (!registro) return false;
      setParcelas([registro]);
      setHistorialGrafico([registro]);
      setRiesgo(registro.crop_disease_status || registro.diagnostico || "Sin diagnóstico");
      setFertilizante(registro.recomendacion || registro.recommendation || "Sin sugerencia");
      setDatosSensores({
        temp: Number(registro.temperature_C || registro.temp || 0),
        hum: Number(registro['humidity_%'] || registro.hum || 0),
        ph: Number(registro.soil_pH || registro.ph || 0),
        ndvi: Number(registro.NDVI_index || registro.ndvi || 0),
      });
      localStorage.setItem('agro_last_record', JSON.stringify(registro));
      return true;
    };

    const cargarDesdeCache = () => {
      const cache = localStorage.getItem('agro_last_record');
      if (!cache) return false;
      try {
        const registro = JSON.parse(cache);
        const ok = aplicarRegistro(registro);
        if (ok) setOrigenDatos("cache");
        return ok;
      } catch (error) { return false; }
    };

    const consultarUnaVez = async () => {
      // Solo consultamos la API si hay un usuario logueado
      if (!usuario) return;

      try {
        const response = await fetch('https://agrosmart-api-940420015515.us-central1.run.app/datos-dashboard');
        const datos = await response.json();
        if (Array.isArray(datos) && datos.length > 0) {
          const ok = aplicarRegistro(datos[datos.length - 1]);
          if (ok) setOrigenDatos("api");
        } else {
          if (!cargarDesdeCache()) setOrigenDatos("vacío");
        }
      } catch (error) {
        if (!cargarDesdeCache()) setOrigenDatos("vacío");
      }
    };

    const cacheOk = cargarDesdeCache();
    if (!cacheOk) consultarUnaVez();
  }, [usuario]); // Agregamos 'usuario' a las dependencias para que consulte al loguearse

  const mostrarNotificacion = (mensaje, tipo = 'success') => {
    setNotificacion({ mostrar: true, mensaje, tipo });
    setTimeout(() => {
      setNotificacion({ mostrar: false, mensaje: '', tipo: '' });
    }, 4000);
  };

  const manejarAprobacionAlerta = async (registroEspecifico) => {
    try {
      if (!registroEspecifico) return;

      const payload = {
        telefono: "51906967430",
        riesgo: registroEspecifico.crop_disease_status || riesgo,
        fertilizante: fertilizante,
        farm_id: registroEspecifico.farm_id || "FARM_001",
        cultivo: registroEspecifico.crop_type || "Maíz",
        ndvi: (registroEspecifico.NDVI_index || datosSensores.ndvi).toString(),
        humedad: (registroEspecifico['humidity_%'] || datosSensores.hum).toString(),
        accion: fertilizante
      };

      const response = await fetch('https://agrosmart-api-940420015515.us-central1.run.app/enviar-alerta-wa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resultado = await response.json();

      if (resultado.status === "success") {
        mostrarNotificacion(`¡Alerta enviada correctamente al agricultor del ${registroEspecifico.farm_id}!`);

        const idUnico = Date.now();
        const nuevaAlerta = {
          id: idUnico,
          fecha: new Date().toLocaleString(),
          lote: registroEspecifico.farm_id || "Lote Desconocido",
          diagnostico: registroEspecifico.crop_disease_status || riesgo,
          recomendacion: fertilizante,
          estado: 'PENDING'
        };

        setHistorialAlertas(prev => [nuevaAlerta, ...prev]);

        setTimeout(() => {
          setHistorialAlertas(historialActual =>
            historialActual.map(alerta =>
              (alerta.id === idUnico && alerta.estado === 'PENDING')
                ? { ...alerta, estado: 'TIMEOUT' }
                : alerta
            )
          );
        }, 60000);

      } else {
        mostrarNotificacion("Error al comunicarse con WhatsApp", "error");
      }
    } catch (error) {
      console.error("Error enviando alerta:", error);
      mostrarNotificacion("Error de conexión", "error");
    }
  };

  const confirmarAlerta = (id) => {
    setHistorialAlertas(prev =>
      prev.map(alerta => alerta.id === id ? { ...alerta, estado: 'SUCCESS' } : alerta)
    );
  };

  const contextValue = {
    riesgo, setRiesgo, fertilizante, setFertilizante, datosSensores, setDatosSensores,
    historialGrafico, setHistorialGrafico, parcelas, setParcelas, origenDatos, setOrigenDatos,
    historialAlertas, setHistorialAlertas, manejarAprobacionAlerta, confirmarAlerta
  };

  // === RENDERIZADO CONDICIONAL DE SEGURIDAD ===

  if (cargandoAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-xl font-medium text-green-700 animate-pulse">
          Validando credenciales...
        </div>
      </div>
    );
  }

  if (!usuario) {
    return <Login />;
  }

  return (
    <Router>
      <AppContext.Provider value={contextValue}>
        {notificacion.mostrar && (
          <div className="fixed bottom-10 right-10 z-[9999] transition-all duration-500 ease-in-out">
            <div className={`px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 text-white font-medium ${notificacion.tipo === 'success' ? 'bg-[#25D366]' : 'bg-red-500'}`}>
              {notificacion.tipo === 'success' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
              <span className="text-sm shadow-sm">{notificacion.mensaje}</span>
            </div>
          </div>
        )}

        <Routes>
          <Route path="/" element={<MainLayout origenDatos={origenDatos} />}>
            <Route index element={<Overview parcelas={parcelas} manejarAprobacionAlerta={manejarAprobacionAlerta} />} />
            <Route path="guardian" element={<Guardian riesgo={riesgo} fertilizante={fertilizante} datosSensores={datosSensores} />} />
            <Route path="alertas" element={<Alerts historialAlertas={historialAlertas} manejarAprobacionAlerta={manejarAprobacionAlerta} confirmarAlerta={confirmarAlerta} />} />
            <Route path="record" element={<Record historialAlertas={historialAlertas} />} />
            <Route path="*" element={<div className="p-10 text-center"><h2 className="text-3xl font-bold text-red-500 mb-4">Ruta no encontrada</h2></div>} />
          </Route>
        </Routes>
      </AppContext.Provider>
    </Router>
  );
}

export default App;