import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CheckCircle, AlertTriangle } from 'lucide-react'; // <-- Importamos iconos para el mensajito

import Overview from './views/overview.jsx';
import Guardian from './views/guardian.jsx';
import Alerts from './views/alerts.jsx';

import MainLayout from './layouts/MainLayout';
import AppContext from './context/AppContext';

function App() {
  const [riesgo, setRiesgo] = useState("Esperando...");
  const [fertilizante, setFertilizante] = useState("Esperando...");
  // ESTADO NUEVO: Para el mensajito flotante (Toast)
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
  }, []);

  // Función para mostrar el mensajito flotante
  const mostrarNotificacion = (mensaje, tipo = 'success') => {
    setNotificacion({ mostrar: true, mensaje, tipo });
    // Se oculta solito después de 4 segundos
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
        // MOSTRAMOS EL MENSajITO BONITO EN PANTALLA
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

        // Cronómetro oculto de 60s
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

  return (
    <Router>
      <AppContext.Provider value={contextValue}>

        {/* === AQUI DIBUJAMOS EL MENSAJITO FLOTANTE (TOAST) === */}
        {notificacion.mostrar && (
          <div className="fixed bottom-10 right-10 z-[9999] transition-all duration-500 ease-in-out">
            <div className={`px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 text-white font-medium ${notificacion.tipo === 'success' ? 'bg-[#25D366]' : 'bg-red-500'}`}>
              {notificacion.tipo === 'success' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
              <span className="text-sm shadow-sm">{notificacion.mensaje}</span>
            </div>
          </div>
        )}
        {/* ==================================================== */}

        <Routes>
          <Route path="/" element={<MainLayout origenDatos={origenDatos} />}>
            <Route index element={<Overview parcelas={parcelas} manejarAprobacionAlerta={manejarAprobacionAlerta} />} />
            <Route path="guardian" element={<Guardian riesgo={riesgo} fertilizante={fertilizante} datosSensores={datosSensores} />} />
            <Route path="alertas" element={<Alerts historialAlertas={historialAlertas} manejarAprobacionAlerta={manejarAprobacionAlerta} confirmarAlerta={confirmarAlerta} />} />
            <Route path="*" element={<div className="p-10 text-center"><h2 className="text-3xl font-bold text-red-500 mb-4">Ruta no encontrada</h2></div>} />
          </Route>
        </Routes>
      </AppContext.Provider>
    </Router>
  );
}

export default App;