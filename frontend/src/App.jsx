import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CheckCircle, AlertTriangle } from 'lucide-react';

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
  const [origenDatos, setOrigenDatos] = useState("api");
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  // === 1. OBSERVADOR DE SESIÓN DE FIREBASE ===
  useEffect(() => {
    const desubscribir = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      setCargandoAuth(false);
    });
    return () => desubscribir();
  }, []);

  // Guarda historial de alertas
  useEffect(() => {
    localStorage.setItem('agro_history_v1', JSON.stringify(historialAlertas));
  }, [historialAlertas]);

  // === 2. FUNCIÓN PARA PINTAR DATOS EN PANTALLA ===
  const aplicarDatos = (arregloDatos) => {
    if (!arregloDatos || arregloDatos.length === 0) return false;

    // IMPORTANTE: Para que la gráfica avance, necesitamos una copia nueva [...arreglo]
    setParcelas([...arregloDatos]);
    setHistorialGrafico([...arregloDatos]);

    const ultimoRegistro = arregloDatos[arregloDatos.length - 1];

    setRiesgo(ultimoRegistro.crop_disease_status || ultimoRegistro.diagnostico || "Sin diagnóstico");
    setFertilizante(ultimoRegistro.recomendacion || ultimoRegistro.recommendation || "Sin sugerencia");
    setDatosSensores({
      temp: Number(ultimoRegistro.temperature_C || ultimoRegistro.temp || 0),
      hum: Number(ultimoRegistro['humidity_%'] || ultimoRegistro.hum || 0),
      ph: Number(ultimoRegistro.soil_pH || ultimoRegistro.ph || 0),
      ndvi: Number(ultimoRegistro.NDVI_index || ultimoRegistro.ndvi || 0),
    });

    localStorage.setItem('agro_last_records', JSON.stringify(arregloDatos));
    return true;
  };

  // === MOCK INTELIGENTE: 125 PARCELAS + HUMEDAD DINÁMICA ===
  useEffect(() => {
    if (!usuario) return;

    let historialSimulado = [];

    const generarLoteDatosFalsos = () => {
      const ahora = new Date();
      const nuevosDatos = [];

      // Total de parcelas fijas: 125
      for (let i = 0; i < 20; i++) {
        const tiempoConOffset = new Date(ahora.getTime() - (19 - i) * 1000);
        const horaFormateada = tiempoConOffset.toLocaleTimeString('es-PE', { hour12: false });

        const rnd = Math.random();
        let estado, recomendacion, temp, hum, lluvia, ndvi;

        if (rnd > 0.7) { // CASO GRAVE
          estado = "Severe";
          recomendacion = "Pausar Riego Inmediatamente (Riesgo Hongos)";
          temp = (25 + Math.random() * 5).toFixed(2);
          // Humedad muy alta para forzar el riesgo de hongos
          hum = (75 + Math.random() * 20).toFixed(2);
          lluvia = (15 + Math.random() * 15).toFixed(2);
          ndvi = (0.2 + Math.random() * 0.2).toFixed(2);
        } else if (rnd > 0.3) { // CASO MODERADO
          estado = "Moderate";
          recomendacion = "Aplicar fertilizante orgánico preventivo";
          temp = (20 + Math.random() * 5).toFixed(2);
          // Humedad media
          hum = (55 + Math.random() * 15).toFixed(2);
          lluvia = (0 + Math.random() * 5).toFixed(2);
          ndvi = (0.5 + Math.random() * 0.2).toFixed(2);
        } else { // CASO SALUDABLE
          estado = "Sano";
          recomendacion = "Condiciones óptimas. Sin acción requerida.";
          temp = (18 + Math.random() * 4).toFixed(2);
          // Humedad óptima y baja
          hum = (35 + Math.random() * 15).toFixed(2);
          lluvia = 0;
          ndvi = (0.8 + Math.random() * 0.15).toFixed(2);
        }

        nuevosDatos.push({
          fecha: horaFormateada,
          temp: temp,
          hum: hum,
          ph: (6.5 + Math.random() * 0.5).toFixed(2),
          ndvi: ndvi,
          rainfall_mm: lluvia,
          diagnostico: estado,
          recomendacion: recomendacion,
          // Aquí aseguramos que el ID siempre esté en el rango de 1 a 125
          farm_id: `FARM_${Math.floor(Math.random() * 125) + 1}`,
          crop_type: Math.random() > 0.5 ? "Soybean" : "Maize"
        });
      }

      historialSimulado = [...historialSimulado.slice(-40), ...nuevosDatos];
      aplicarDatos(historialSimulado);
      setUltimaActualizacion(new Date());
      setOrigenDatos("api");
    };

    generarLoteDatosFalsos();
    const reloj = setInterval(generarLoteDatosFalsos, 60000); // 1 minuto
    return () => clearInterval(reloj);
  }, [usuario]);

  // === 4. FUNCIONES DE ALERTAS (WHATSAPP SIGUE FUNCIONANDO REAL) ===
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

  // === PROVEEDOR DE CONTEXTO ===
  const contextValue = {
    riesgo, setRiesgo, fertilizante, setFertilizante, datosSensores, setDatosSensores,
    historialGrafico, setHistorialGrafico, parcelas, setParcelas, origenDatos, setOrigenDatos,
    historialAlertas, setHistorialAlertas, manejarAprobacionAlerta, confirmarAlerta, ultimaActualizacion
  };

  // === RENDERIZADO CONDICIONAL DE SESIÓN ===
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

  // === RENDERIZADO PRINCIPAL ===
  return (
    <Router>
      <AppContext.Provider value={contextValue}>
        {/* Toast Notification Global */}
        {notificacion.mostrar && (
          <div className="fixed bottom-10 right-10 z-[9999] transition-all duration-500 ease-in-out">
            <div className={`px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 text-white font-medium ${notificacion.tipo === 'success' ? 'bg-[#25D366]' : 'bg-red-500'}`}>
              {notificacion.tipo === 'success' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
              <span className="text-sm shadow-sm">{notificacion.mensaje}</span>
            </div>
          </div>
        )}

        <Routes>
           <Route path="/" element={<MainLayout origenDatos={origenDatos} ultimaActualizacion={ultimaActualizacion} />}>
             <Route index element={<Overview parcelas={parcelas} manejarAprobacionAlerta={manejarAprobacionAlerta} ultimaActualizacion={ultimaActualizacion} />} />
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