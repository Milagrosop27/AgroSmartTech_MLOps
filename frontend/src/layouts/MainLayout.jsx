import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, ShieldCheck, Sprout, BellRing } from 'lucide-react';

const MainLayout = ({ origenDatos = 'cargando' }) => {
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

        <div className="mt-auto pt-6 border-t border-green-700">
          <p className="text-xs text-green-200 mb-2">Estado de datos:</p>
          <span className={`inline-block px-2 py-1 text-white text-xs font-bold rounded ${origenDatos === 'api' ? 'bg-green-500' : origenDatos === 'cache' ? 'bg-blue-500' : 'bg-amber-500'}`}>
            {origenDatos === 'api' ? '✅ Último registro API' : origenDatos === 'cache' ? '📦 Último registro guardado' : '⚠️ Sin datos'}
          </span>
        </div>
      </aside>

      <main className="flex-1 ml-64">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;