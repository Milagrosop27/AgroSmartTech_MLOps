import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Overview from './views/overview.jsx';
import Guardian from './views/guardian.jsx';
import Alerts from './views/alerts.jsx';

import MainLayout from './layouts/MainLayout';
import AppContext from './context/AppContext';

function App() {
  const [riesgo, setRiesgo] = useState("Esperando...");
  const [fertilizante, setFertilizante] = useState("Esperando...");
  const [historialAlertas, setHistorialAlertas] = useState(() => {
    const guardado = localStorage.getItem('agro_history_v1');
    return guardado ? JSON.parse(guardado) : [];
  });
  const [datosSensores, setDatosSensores] = useState({
    temp: 0,
    hum: 0,
    ph: 0,
    ndvi: 0,
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
      } catch (error) {
        console.error("Error leyendo caché:", error);
        return false;
      }
    };

    const consultarUnaVez = async () => {
      try {
        const response = await fetch('https://agrosmart-api-940420015515.us-central1.run.app/datos-dashboard');
        const datos = await response.json();

        if (Array.isArray(datos) && datos.length > 0) {
          const ultimo = datos[datos.length - 1];
          const ok = aplicarRegistro(ultimo);
          if (ok) setOrigenDatos("api");
        } else {
          const ok = cargarDesdeCache();
          if (!ok) setOrigenDatos("vacío");
        }
      } catch (error) {
        console.error("Error conectando con la API:", error);
        const ok = cargarDesdeCache();
        if (!ok) setOrigenDatos("vacío");
      }
    };

    const cacheOk = cargarDesdeCache();
    if (!cacheOk) consultarUnaVez();
  }, []);

  const manejarAprobacionAlerta = () => {
    const mensaje = `🌱 *AgroSmart* - Diagnóstico: ${riesgo}. Acción: Aplicar ${fertilizante}.`;
    const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(urlWhatsApp, '_blank');

    const nuevaAlerta = {
      id: Date.now(),
      fecha: new Date().toLocaleString(),
      lote: "Lote 4 - Sector Norte",
      diagnostico: riesgo,
      recomendacion: "Enviado a Campo",
      estado: "Enviado a Campo"
    };

    setHistorialAlertas([nuevaAlerta, ...historialAlertas]);
  };

  const contextValue = {
    riesgo,
    setRiesgo,
    fertilizante,
    setFertilizante,
    datosSensores,
    setDatosSensores,
    historialGrafico,
    setHistorialGrafico,
    parcelas,
    setParcelas,
    origenDatos,
    setOrigenDatos,
    historialAlertas,
    setHistorialAlertas,
    manejarAprobacionAlerta,
  };

  return (
    <Router>
      <AppContext.Provider value={contextValue}>
        <Routes>
          <Route path="/" element={<MainLayout origenDatos={origenDatos} />}>
            <Route
              index
              element={
                <Overview
                  riesgo={riesgo}
                  fertilizante={fertilizante}
                  datosSensores={datosSensores}
                  historialGrafico={historialGrafico}
                  parcelas={parcelas}
                  manejarAprobacionAlerta={manejarAprobacionAlerta}
                />
              }
            />
            <Route
              path="guardian"
              element={<Guardian riesgo={riesgo} fertilizante={fertilizante} datosSensores={datosSensores} />}
            />
            <Route
              path="alertas"
              element={<Alerts historialAlertas={historialAlertas || []} />}
            />
            <Route
              path="*"
              element={
                <div className="p-10 text-center">
                  <h2 className="text-3xl font-bold text-red-500 mb-4">¡Ruta no encontrada!</h2>
                  <p className="text-gray-600">Revisa que el NavLink del menú coincida exactamente con el path de la ruta.</p>
                </div>
              }
            />
          </Route>
        </Routes>
      </AppContext.Provider>
    </Router>
  );
}

export default App;