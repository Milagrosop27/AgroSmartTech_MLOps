import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, FlaskConical, TrendingUp, Sprout, BellRing, ClipboardList, ChevronDown, ChevronUp, LogOut } from 'lucide-react';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';

const MainLayout = ({ origenDatos = 'cargando' }) => {
  const location = useLocation();
  // Estado para controlar si el sidebar está expandido o colapsado
  const [isHovered, setIsHovered] = useState(false);

  const menuAlertasAbierto = location.pathname.startsWith('/alertas') || location.pathname === '/record';

  const manejarCerrarSesion = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* SIDEBAR FLOTANTE Y RESPONSIVO
        onMouseEnter y onMouseLeave controlan la expansión automática
      */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed top-0 left-0 z-50 flex flex-col bg-gray-50 text-agro-600 transition-all duration-300 ease-in-out shadow-xl
          ${isHovered ? 'w-64' : 'w-20'} 
          h-[calc(100vh-32px)] m-4 rounded-3xl border border-gray-200 overflow-hidden`
        }
      >
        <div className="p-4 flex flex-col h-full">
          {/* LOGO Y TÍTULO */}
          <h1 className={`font-bold flex items-center mb-8 transition-all duration-300 ${isHovered ? 'px-2' : 'justify-center'}`}>
            <Sprout size={32} className="shrink-0 text-green-600" />
            <span className={`text-2xl ml-3 overflow-hidden whitespace-nowrap transition-all duration-300 ${isHovered ? 'w-auto opacity-100' : 'w-0 opacity-0'} text-green-600`}>
              AgroSmart
            </span>
          </h1>

          {/* NAVEGACIÓN */}
          <nav className="flex flex-col gap-2 flex-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center rounded-xl transition-all duration-200 ${
                  isHovered ? 'px-4 py-3 gap-3' : 'justify-center py-3'
                } ${
                  isActive && location.pathname === '/'
                    ? 'bg-white shadow-sm font-bold text-agro-900 border border-gray-100'
                    : 'bg-transparent text-agro-800 hover:bg-gray-200/50'
                }`
              }
            >
              <LayoutDashboard size={22} className="shrink-0" />
              <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${isHovered ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                Dashboard
              </span>
            </NavLink>

            <NavLink to="/analitica" className={({ isActive }) => `flex items-center rounded-xl transition-all duration-200 ${isHovered ? 'px-4 py-3 gap-3' : 'justify-center py-3'} ${isActive ? 'bg-white shadow-sm font-bold text-agro-900 border border-gray-100' : 'bg-transparent text-agro-800 hover:bg-gray-200/50'}`}>
              <TrendingUp size={22} className="shrink-0" />
              <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${isHovered ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>Analítica</span>
            </NavLink>

            <NavLink
              to="/simulador"
              className={({ isActive }) =>
                `flex items-center rounded-xl transition-all duration-200 ${
                  isHovered ? 'px-4 py-3 gap-3' : 'justify-center py-3'
                } ${
                  isActive
                    ? 'bg-white shadow-sm font-bold text-agro-900 border border-gray-100'
                    : 'bg-transparent text-agro-800 hover:bg-gray-200/50'
                }`
              }
            >
              <FlaskConical size={22} className="shrink-0" />
              <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${isHovered ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                Laboratorio
              </span>
            </NavLink>

            {/* SECCIÓN ALERTAS (CON DESPLEGABLE) */}
            <div className="flex flex-col">
              <div className="flex items-center relative">
                <NavLink
                  to="/alertas"
                  className={({ isActive }) =>
                    `flex items-center justify-between w-full rounded-xl transition-all duration-200 ${
                      isHovered ? 'px-4 py-3 gap-3' : 'justify-center py-3'
                    } ${
                      isActive
                        ? 'bg-white shadow-sm font-bold text-agro-900 border border-gray-100'
                        : 'bg-transparent text-agro-800 hover:bg-gray-200/50'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <BellRing size={22} className="shrink-0" />
                    <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${isHovered ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                      Alertas
                    </span>
                  </div>
                </NavLink>

                {/* Solo mostramos la flecha si el menú está expandido */}
                {isHovered && (
                  <button className="absolute right-4 p-1 text-agro-500 transition-colors cursor-default">
                    {menuAlertasAbierto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                )}
              </div>

              {/* Solo mostramos los sub-ítems si está abierto Y el sidebar está expandido */}
              {menuAlertasAbierto && isHovered && (
                <div className="ml-6 mt-1 pl-4 border-l-2 border-green-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <NavLink
                    to="/record"
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-sm ${
                        isActive
                          ? 'bg-white shadow-sm font-bold text-agro-900'
                          : 'text-agro-600 hover:bg-gray-200/50'
                      }`
                    }
                  >
                    <ClipboardList size={18} className="shrink-0" />
                    <span className="whitespace-nowrap">Registros</span>
                  </NavLink>
                </div>
              )}
            </div>
          </nav>

          {/* FOOTER DEL SIDEBAR */}
          <div className="mt-auto border-t border-gray-200 pt-4 overflow-hidden">
            <div className={`transition-all duration-300 whitespace-nowrap ${isHovered ? 'opacity-100 h-auto mb-4' : 'opacity-0 h-0 mb-0'}`}>
              <p className="text-xs text-gray-400 mb-1 px-2">Estado de datos:</p>
              <div className={`flex items-center gap-2 text-white text-xs px-3 py-1.5 rounded-lg shadow-sm w-full font-medium ${origenDatos === 'api' ? 'bg-green-500' : 'bg-blue-500'}`}>
                {origenDatos === 'api' ? '✅ En vivo (API)' : '📦 Último registro'}
              </div>
            </div>

            <button
              onClick={manejarCerrarSesion}
              className={`flex items-center rounded-xl transition-all duration-200 hover:bg-red-50 text-red-600 ${
                isHovered ? 'px-4 py-3 gap-3 w-full' : 'justify-center py-3'
              }`}
            >
              <LogOut size={22} className="shrink-0" />
              <span className={`font-semibold overflow-hidden whitespace-nowrap transition-all duration-300 ${isHovered ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                Cerrar Sesión
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL
        Tiene un margen izquierdo fijo de ml-28 (112px) para dejar espacio
        al sidebar colapsado, permitiendo que el sidebar se expanda por encima
        sin empujar la pantalla abruptamente.
      */}
      <main className={`flex-1 p-8 min-h-screen transition-all duration-300 ease-in-out ${isHovered ? 'ml-[280px]' : 'ml-[100px]'}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;