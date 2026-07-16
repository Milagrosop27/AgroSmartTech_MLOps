// src/components/overview/SelectorHectareas.jsx

import {MapPin} from "lucide-react";

const SelectorHectareas = ({ zonas, hectareaSeleccionada, setHectareaSeleccionada }) => {
  const { hectareas } = zonas;

  if (hectareas.length === 0) {
    return (
      <div className="mb-6 p-4 bg-white rounded-xl border shadow-sm text-sm text-gray-400">
        Cargando zonas activas...
      </div>
    );
  }

  const hectareasValidas = hectareas.filter(
    (h) => h && !h.toLowerCase().includes('simul')
  );

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <MapPin size={16} className="text-green-600" />
        <span className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
          Filtrar por hectárea
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setHectareaSeleccionada(null)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
            hectareaSeleccionada === null
              ? 'bg-green-600 text-white border-green-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-600'
          }`}
        >
          Todas
        </button>
        {hectareasValidas.map((h) => (
          <button
            key={h}
            onClick={() => setHectareaSeleccionada(h === hectareaSeleccionada ? null : h)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
              hectareaSeleccionada === h
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-600'
            }`}
          >
            {h}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SelectorHectareas;