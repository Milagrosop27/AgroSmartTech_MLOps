import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, ShieldCheck, Sprout, BellRing, LogOut, CheckCircle } from 'lucide-react';

// Importaciones de Firebase
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';

const MainLayout = () => {

  const manejarCierreSesion = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-green-600 text-white flex flex-col p-6 fixed h-full z-10">
        <h1 className="text-2xl font-bold mb-10 flex items-center gap-2"><Sprout /> AgroSmart</h1>

        <nav className="space-y-4">
          <NavLink to="/" end className={({ isActive }) => `flex items-center gap-3 p-2 rounded transition-colors ${isActive ? 'bg-green-700' : 'hover:bg-green-700'}`}>
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>

          <NavLink to="/guardian" className={({ isActive }) => `flex items-center gap-3 p-2 rounded transition-colors ${isActive ? 'bg-green-700' : 'hover:bg-green-700'}`}>
            <ShieldCheck size={20} /> Guardián
          </NavLink>

          <NavLink to="/alertas" className={({ isActive }) => `flex items-center gap-3 p-2 rounded transition-colors ${isActive ? 'bg-green-700' : 'hover:bg-green-700'}`}>
            <BellRing size={20} /> Alertas
          </NavLink>
        </nav>

        {/* CONTENEDOR INFERIOR */}
        <div className="mt-auto pt-6 border-t border-green-700 space-y-6">

          {/* Indicador de estado para presentación */}
          <div>
            <p className="text-xs text-green-200 mb-2">Estado de datos:</p>
            <div className="flex items-center gap-2 px-2 py-2 text-white text-xs font-bold rounded bg-green-500">
              <CheckCircle size={16} />
              <span>SISTEMA SINCRONIZADO</span>
            </div>
            <p className="text-xs text-green-100 mt-2">Actualización cada 1m</p>
          </div>

          {/* Botón de Cerrar Sesión */}
          <button
            onClick={manejarCierreSesion}
            className="flex w-full items-center gap-3 p-2 rounded text-sm text-green-100 hover:bg-green-800 hover:text-white transition-colors"
          >
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;