import { Database } from 'lucide-react';

const guardian = ({ riesgo, fertilizante, datosSensores }) => {
  return (
    <div className="p-8 pt-6">
      <h2 className="text-3xl font-bold text-gray-800">Módulo Guardián</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="bg-slate-800 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center gap-3 mb-4 text-blue-400">
            <Database size={20}/> <h3 className="font-bold">Telemetría Real</h3>
          </div>
          <div className="space-y-3 font-mono text-sm">
            <div className="flex justify-between border-b border-slate-700"><span>TEMP</span><span className="text-blue-300">{datosSensores.temp}°C</span></div>
            <div className="flex justify-between border-b border-slate-700"><span>HUM</span><span className="text-blue-300">{datosSensores.hum}%</span></div>
            <div className="flex justify-between border-b border-slate-700"><span>PH</span><span className="text-blue-300">{datosSensores.ph}</span></div>
            <div className="flex justify-between border-b border-slate-700"><span>NDVI</span><span className="text-blue-300">{datosSensores.ndvi}</span></div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold mb-4">Validación del Modelo Random Forest</h3>
          <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-green-500 mb-4">
            <p className="text-xs font-bold text-gray-400">DIAGNÓSTICO IA</p>
            <p className="text-lg font-bold text-gray-800">{riesgo}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
            <p className="text-xs font-bold text-gray-400">RECOMENDACIÓN</p>
            <p className="text-lg font-bold text-gray-800">{fertilizante}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default guardian;