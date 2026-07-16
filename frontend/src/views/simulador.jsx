import { useState } from 'react';
import {
  Thermometer, Droplets, FlaskConical, Leaf, Play,
  AlertTriangle, CheckCircle, Info, Sprout
} from 'lucide-react';

const Simulador = () => {
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  // Estado inicial del formulario
  const [formulario, setFormulario] = useState({
    temperature_C: 25.0,
    'humidity_%': 60.0,
    soil_pH: 6.5,
    NDVI_index: 0.65,
    crop_type: 'Maíz'
  });

  const cultivosDisponibles = ['Maíz', 'Trigo', 'Papa', 'Quinua', 'Espárrago'];

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormulario(prev => ({
      ...prev,
      [name]: name === 'crop_type' ? value : Number(value)
    }));
  };

  const ejecutarSimulacion = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');
    setResultado(null);

    try {
      // 1. Definimos la URL de tu API
      const API_URL = 'https://agrosmart-api-940420015515.us-central1.run.app';

      // 2. Hacemos la petición a la nueva ruta "sandbox" que creamos
      const response = await fetch(`${API_URL}/predecir-prueba`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formulario), // Enviamos los datos del formulario directamente
      });

      if (!response.ok) {
        throw new Error(`Error en el servidor: ${response.status}`);
      }

      // 3. Recibimos la respuesta de la IA
      const data = await response.json();

      // 4. Actualizamos la pantalla con la predicción real
      setResultado({
        riesgo: data.riesgo,
        recomendacion: data.recomendacion
      });

    } catch (err) {
      console.error(err);
      setError('Error de conexión con el motor de IA. Verifica que el backend esté encendido.');
    } finally {
      setCargando(false);
    }
  };

  // Helpers visuales para el resultado
  const getColorResultado = (riesgo) => {
    if (riesgo === 'Severe') return 'bg-red-50 border-red-200 text-red-800';
    if (riesgo === 'Moderate' || riesgo === 'Mild') return 'bg-amber-50 border-amber-200 text-amber-800';
    return 'bg-green-50 border-green-200 text-green-800';
  };

  const getIconoResultado = (riesgo) => {
    if (riesgo === 'Severe') return <AlertTriangle className="text-red-500" size={32} />;
    if (riesgo === 'Moderate' || riesgo === 'Mild') return <Info className="text-amber-500" size={32} />;
    return <CheckCircle className="text-green-500" size={32} />;
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen rounded-3xl">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FlaskConical className="text-blue-600" size={32} />
          Laboratorio de Simulación
        </h2>
        <p className="text-gray-500 text-sm mt-2">
          Ingresa parámetros.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* PANEL DE FORMULARIO */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-3">Parámetros Agronómicos</h3>

          <form onSubmit={ejecutarSimulacion} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* SELECTOR DE CULTIVO */}
              <div className="col-span-1 md:col-span-2">
                <label className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                  <Sprout size={16} className="text-green-600"/> Tipo de Cultivo
                </label>
                <select
                  name="crop_type"
                  value={formulario.crop_type}
                  onChange={manejarCambio}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none transition-all font-medium text-gray-700"
                >
                  {cultivosDisponibles.map(cultivo => (
                    <option key={cultivo} value={cultivo}>{cultivo}</option>
                  ))}
                </select>
              </div>

              {/* TEMPERATURA */}
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                  <Thermometer size={16} className="text-red-500"/> Temperatura (°C)
                </label>
                <input
                  type="number" step="0.1" name="temperature_C"
                  value={formulario.temperature_C} onChange={manejarCambio}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none transition-all"
                  required
                />
              </div>

              {/* HUMEDAD */}
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                  <Droplets size={16} className="text-blue-500"/> Humedad (%)
                </label>
                <input
                  type="number" step="0.1" name="humidity_%"
                  value={formulario['humidity_%']} onChange={manejarCambio}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none transition-all"
                  required
                />
              </div>

              {/* PH DEL SUELO */}
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                  <FlaskConical size={16} className="text-purple-500"/> pH del Suelo
                </label>
                <input
                  type="number" step="0.1" name="soil_pH"
                  value={formulario.soil_pH} onChange={manejarCambio}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none transition-all"
                  required
                />
              </div>

              {/* NDVI */}
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                  <Leaf size={16} className="text-green-500"/> Índice NDVI (0 a 1)
                </label>
                <input
                  type="number" step="0.01" min="0" max="1" name="NDVI_index"
                  value={formulario.NDVI_index} onChange={manejarCambio}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-800 text-white p-4 rounded-xl font-bold transition-all disabled:bg-gray-400"
            >
              {cargando ? (
                <span className="animate-pulse">Procesando reglas lógicas...</span>
              ) : (
                <>
                  <Play size={20} />
                  Ejecutar Predicción
                </>
              )}
            </button>
          </form>
        </div>

        {/* PANEL DE RESULTADO */}
        <div className="lg:col-span-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-4 flex items-center gap-3">
              <AlertTriangle size={24} />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-3">Dictamen del Simulador</h3>

            {!resultado && !cargando && !error && (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-center">
                <FlaskConical size={48} className="mb-4 opacity-30" />
                <p>Esperando parámetros para ejecutar la evaluación local.</p>
              </div>
            )}

            {cargando && (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
              </div>
            )}

            {resultado && !cargando && (
              <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className={`p-6 rounded-xl border-2 flex items-start gap-4 ${getColorResultado(resultado.riesgo)}`}>
                  {getIconoResultado(resultado.riesgo)}
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wider opacity-80">Nivel de Riesgo</p>
                    <p className="text-2xl font-black mt-1">
                      {resultado.riesgo === 'Severe' ? 'CRÍTICO' :
                       resultado.riesgo === 'Moderate' ? 'MODERADO' :
                       resultado.riesgo === 'Mild' ? 'LEVE' : 'SANO'}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                  <p className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-2">Recomendación Sugerida</p>
                  <p className="text-gray-800 font-medium leading-relaxed">
                    {resultado.recomendacion}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulador;