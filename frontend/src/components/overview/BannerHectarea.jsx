// src/components/overview/BannerHectarea.jsx

import { ChevronLeft } from 'lucide-react';

// Diccionario de imágenes por tipo de cultivo
const IMAGENES_CULTIVO = {
  'Maíz':    'https://i.pinimg.com/1200x/ee/28/ed/ee28edb03efcb3ab9302a76a0af8b2e3.jpg',
  'Trigo':   'https://i.pinimg.com/1200x/d5/e2/a4/d5e2a4205111236d3c20b71ee832a844.jpg',
  'Arroz':   'https://i.pinimg.com/1200x/70/9e/05/709e05562f3a71cf882777c043713450.jpg',
  'Soja':    'https://i.pinimg.com/1200x/a5/2a/76/a52a7642966856313a10bac8766036a5.jpg',
  'Algodón': 'https://i.pinimg.com/736x/8c/ae/63/8cae638bf968e8f4e989f615518d47d0.jpg',
  'default': 'https://i.pinimg.com/1200x/50/d3/6d/50d36d2f4ed564da4ae15a2aa94ae02b.jpg',
};

const BannerHectarea = ({ hectarea, cultivoActual, totalSectores, onVolver }) => {
  const imagenUrl = IMAGENES_CULTIVO[cultivoActual] || IMAGENES_CULTIVO.default;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden mb-6 h-36 md:h-44">
      <img
        src={imagenUrl}
        alt={`Cultivo ${cultivoActual}`}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-transparent" />

      <div className="relative z-10 h-full flex flex-col justify-center px-7 py-5">
        <button
          onClick={onVolver}
          className="flex items-center gap-1 text-white/70 hover:text-white text-xs font-semibold mb-2 transition-colors w-fit"
        >
          <ChevronLeft size={14} /> Todas las hectáreas
        </button>
        <h2 className="text-white text-2xl md:text-3xl font-bold leading-tight">
          Hectárea {hectarea}
        </h2>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-white/80 text-sm">{totalSectores} sectores activos</span>
          <span className="w-1 h-1 rounded-full bg-white/40" />
          <span className="text-white/80 text-sm capitalize">{cultivoActual}</span>
        </div>
      </div>

      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/25 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        En vivo
      </div>
    </div>
  );
};

// Exportamos por defecto para que sea más limpio de importar
export default BannerHectarea;