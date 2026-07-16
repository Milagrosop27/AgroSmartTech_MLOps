
import { X, Thermometer, Droplets, FlaskConical, Leaf, Activity } from 'lucide-react';


const ModalAlerta = ({ registro, onCerrar }) => {
  if (!registro) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Header del Modal */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Detalle de Alerta: {registro.farm_id}</h2>
          <button
            onClick={onCerrar}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6">
          <p className="text-sm text-gray-500 mb-6">
            Análisis detallado de los sensores IoT para el subsector seleccionado.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {/* Tarjeta de Temperatura */}
            <div className="flex items-center p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <Thermometer className="text-blue-500 mr-3" size={24} />
              <div>
                <p className="text-[10px] uppercase font-bold text-blue-600">Temperatura</p>
                <p className="text-lg font-bold text-gray-800">{Number(registro.temperature_C).toFixed(1)}°C</p>
              </div>
            </div>

            {/* Tarjeta de Humedad */}
            <div className="flex items-center p-4 bg-cyan-50 rounded-2xl border border-cyan-100">
              <Droplets className="text-cyan-500 mr-3" size={24} />
              <div>
                <p className="text-[10px] uppercase font-bold text-cyan-600">Humedad</p>
                <p className="text-lg font-bold text-gray-800">{Number(registro['humidity_%']).toFixed(1)}%</p>
              </div>
            </div>

            {/* Tarjeta de pH */}
            <div className="flex items-center p-4 bg-green-50 rounded-2xl border border-green-100">
              <FlaskConical className="text-green-600 mr-3" size={24} />
              <div>
                <p className="text-[10px] uppercase font-bold text-green-700">pH Suelo</p>
                <p className="text-lg font-bold text-gray-800">{Number(registro.soil_pH).toFixed(1)}</p>
              </div>
            </div>

            {/* Tarjeta de NDVI */}
            <div className="flex items-center p-4 bg-purple-50 rounded-2xl border border-purple-100">
              <Leaf className="text-purple-600 mr-3" size={24} />
              <div>
                <p className="text-[10px] uppercase font-bold text-purple-700">Índice NDVI</p>
                <p className="text-lg font-bold text-gray-800">{Number(registro.NDVI_index).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Tarjeta de Nutrientes (NPK) */}
          <div className="mt-4 p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="text-orange-600 mr-3" size={24} />
              <div>
                <p className="text-[10px] uppercase font-bold text-orange-700">Perfil N-P-K</p>
                <p className="text-sm text-orange-800">Nitrógeno - Fósforo - Potasio</p>
              </div>
            </div>
            <span className="text-2xl font-black text-orange-900">
              {registro.n}-{registro.p}-{registro.k}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onCerrar}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalAlerta;