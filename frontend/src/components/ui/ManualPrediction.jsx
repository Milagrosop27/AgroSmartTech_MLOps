import { useState } from 'react';
import { Calculator, Droplets, FlaskConical, Thermometer } from 'lucide-react';

const ManualPrediction = () => {
  // 1. Estado limpio: Sin el mes y solo con las variables clave
  const [formData, setFormData] = useState({
    temperatura: '',
    humedad: '',
    ph: ''
  });

  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);

  const manejarCambio = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 2. Lógica de Predicción 100% Local (Sin consultar al backend)
  const ejecutarPrediccion = (e) => {
    e.preventDefault();
    setCargando(true);

    // Simulamos un micro-tiempo de carga para que se vea como un procesamiento real
    setTimeout(() => {
      const temp = parseFloat(formData.temperatura);
      const hum = parseFloat(formData.humedad);
      const ph = parseFloat(formData.ph);

      let diagnostico = "Saludable";
      let recomendacion = "Mantener plan de riego y fertilización estándar.";

      // Pequeño árbol de decisiones simulado en el frontend
      if (temp > 35 || hum < 30) {
        diagnostico = "Crítico (Estrés térmico/hídrico)";
        recomendacion = "Aplicar riego de emergencia de inmediato.";
      } else if (temp < 15) {
        diagnostico = "Riesgo Moderado (Baja temperatura)";
        recomendacion = "Monitorear posibles heladas. Pausar riego nocturno.";
      } else if (ph < 5.5 || ph > 7.5) {
        diagnostico = "Alerta de Suelo (pH desbalanceado)";
        recomendacion = "Aplicar enmiendas correctivas al suelo. Evaluar fertilizante.";
      } else if (hum > 80) {
        diagnostico = "Riesgo de Hongos (Alta humedad)";
        recomendacion = "Reducir riego. Aplicar fungicida preventivo.";
      }

      setResultado({ diagnostico, recomendacion });
      setCargando(false);
    }, 600); // 600ms de retraso para el efecto visual
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="text-blue-600" size={24} />
        <div>
          <h3 className="text-lg font-bold text-gray-800">Simulador de Predicción</h3>
          <p className="text-sm text-gray-500">Evalúe escenarios hipotéticos localmente sin interactuar con la base de datos ni generar alertas.</p>
        </div>
      </div>

      <form onSubmit={ejecutarPrediccion} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Solo dejamos Temperatura, Humedad y pH */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600 flex items-center gap-1"><Thermometer size={14}/> Temp (°C)</label>
          <input type="number" step="0.1" name="temperatura" required value={formData.temperatura} onChange={manejarCambio} className="border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none" placeholder="Ej: 24.5" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600 flex items-center gap-1"><Droplets size={14}/> Humedad (%)</label>
          <input type="number" step="0.1" name="humedad" required value={formData.humedad} onChange={manejarCambio} className="border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none" placeholder="Ej: 60" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600 flex items-center gap-1"><FlaskConical size={14}/> pH Suelo</label>
          <input type="number" step="0.1" name="ph" required value={formData.ph} onChange={manejarCambio} className="border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none" placeholder="Ej: 6.5" />
        </div>

        <div className="flex items-end">
          <button type="submit" disabled={cargando} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm flex justify-center items-center h-[38px]">
            {cargando ? 'Calculando...' : 'Consultar'}
          </button>
        </div>
      </form>

      {/* Caja de Resultados sin el texto del mes */}
      {resultado && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex flex-col md:flex-row gap-4 justify-between items-center animate-fade-in">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase mb-1">Resultado de la Simulación</p>
            <p className="text-sm text-gray-800"><span className="font-bold">Diagnóstico:</span> {resultado.diagnostico}</p>
            <p className="text-sm text-gray-800"><span className="font-bold">Acción Sugerida:</span> {resultado.recomendacion}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualPrediction;