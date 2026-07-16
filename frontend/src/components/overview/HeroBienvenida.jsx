// src/components/overview/HeroBienvenida.jsx

import { getSaludo} from '../../utils/helpers/getSaludo.js';
import { getFechaFormateada } from '../../utils/helpers/getFechaFormateada.js';


const HeroBienvenida = () => {
  const saludo   = getSaludo();
  const fecha    = getFechaFormateada();
  const nombre   = 'Jefe de producción';

  return (
    <div className="relative w-full rounded-2xl overflow-hidden mb-8 h-52 md:h-60">
      <img
        src="https://i.pinimg.com/1200x/50/d3/6d/50d36d2f4ed564da4ae15a2aa94ae02b.jpg"
        alt="Campo agrícola"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/40 to-transparent" />
      <div className="relative z-10 h-full flex flex-col justify-center px-8 py-6">
        <p className="text-white/70 text-sm font-medium tracking-widest uppercase mb-1">
          {fecha}
        </p>
        <h1 className="text-white text-3xl md:text-4xl font-bold leading-tight mb-2">
          {saludo}, {nombre} 👋
        </h1>
        <p className="text-white/80 text-sm md:text-base max-w-md leading-relaxed">
          Selecciona una hectárea para explorar sus sectores.
        </p>
      </div>
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/25 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        En vivo
      </div>
    </div>
  );
};
export default HeroBienvenida;
