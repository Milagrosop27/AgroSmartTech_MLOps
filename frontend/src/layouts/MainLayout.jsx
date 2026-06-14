import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShieldCheck, Sprout, BellRing, ClipboardList, ChevronDown, ChevronUp, LogOut } from 'lucide-react';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';

const MainLayout = ({ origenDatos = 'cargando' }) => {
  const location = useLocation();

  // Esta lógica es suficiente: si la ruta coincide, el menú se despliega automáticamente
  const menuAlertasAbierto =
    location.pathname.startsWith('/alertas') || location.pathname === '/record';

  const manejarCerrarSesion = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-green-600 text-white flex flex-col p-6 fixed h-full z-10">
        <h1 className="text-2xl font-bold mb-10 flex items-center gap-2">
          <Sprout /> AgroSmart
        </h1>

        <nav className="flex flex-col gap-2 flex-1">
          <NavLink
            to="/"
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive && location.pathname === '/' ? 'bg-white/20 font-semibold' : 'hover:bg-white/10'}`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/guardian"
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-white/20 font-semibold' : 'hover:bg-white/10'}`}
          >
            <ShieldCheck size={20} />
            <span>Guardián</span>
          </NavLink>

          <div className="flex flex-col">
            <div className="flex items-center relative">
              {/* Al hacer clic solo navegamos, la lógica de abierto la maneja el path */}
              <NavLink
                to="/alertas"
                className={({ isActive }) => `flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-white/20 font-semibold' : 'hover:bg-white/10'}`}
              >
                <div className="flex items-center gap-3">
                  <BellRing size={20} />
                  <span>Alertas</span>
                </div>
              </NavLink>

              <button
                className="absolute right-4 p-1 text-green-200 hover:text-white transition-colors cursor-default"
              >
                {menuAlertasAbierto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {menuAlertasAbierto && (
              <div className="ml-5 mt-1 pl-4 border-l border-green-400 flex flex-col overflow-hidden">
                <NavLink
                  to="/record"
                  className={({ isActive }) => `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${isActive ? 'bg-white/20 font-semibold' : 'hover:bg-white/10 text-green-100'}`}
                >
                  <ClipboardList size={18} />
                  <span>Registros</span>
                </NavLink>
              </div>
            )}
          </div>
        </nav>

        <div className="mt-auto border-t border-green-500/50 pt-6">
          <div className="mb-4">
            <p className="text-xs text-green-200 mb-1">Estado de datos:</p>
            <div className={`flex items-center gap-2 text-white text-xs px-3 py-1.5 rounded-lg shadow-sm w-fit font-medium ${origenDatos === 'api' ? 'bg-green-500' : 'bg-blue-500'}`}>
              {origenDatos === 'api' ? '✅ En vivo (API)' : '📦 Último registro guardado'}
            </div>
          </div>

          <button
            onClick={manejarCerrarSesion}
            className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-red-500/80 w-full text-left text-sm font-medium"
          >
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;