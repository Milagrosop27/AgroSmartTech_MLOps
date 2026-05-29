import { useState } from 'react';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
// 1. Añadimos Eye y EyeOff a las importaciones
import { Leaf, Eye, EyeOff } from 'lucide-react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  // 2. Estado para controlar si se muestra o no la contraseña
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const manejarLogin = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error(err);
      setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
      setCargando(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[url('https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=2000')] bg-cover bg-center bg-fixed p-4">

      <div className="absolute inset-0 bg-green-900/30 backdrop-blur-[2px]"></div>

      <div className="relative z-10 w-full max-w-md rounded-3xl bg-white/90 p-8 shadow-2xl backdrop-blur-md border border-white/40">

        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-green-100 p-4 text-green-600 shadow-inner">
            <Leaf size={36} strokeWidth={2.5} />
          </div>
        </div>
        <h2 className="mb-2 text-center text-3xl font-bold text-gray-800 tracking-tight">AgroSmart Tech</h2>
        <p className="mb-8 text-center text-sm text-gray-600 font-medium">Acceso seguro al centro de control MLOps</p>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50/90 p-4 text-sm text-red-600 border border-red-100 backdrop-blur-sm">
            {error}
          </div>
        )}

        <form onSubmit={manejarLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@agrosmart.com"
              className="w-full rounded-xl border border-gray-200 bg-white/70 p-3.5 text-gray-800 shadow-inner focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all placeholder:text-gray-400"
            />
          </div>

          {/* 3. Contenedor modificado para la contraseña */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Contraseña</label>
            <div className="relative">
              <input
                // Cambia entre "text" y "password" según el estado
                type={mostrarPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                // Añadí pr-12 para que el texto no se superponga con el ícono
                className="w-full rounded-xl border border-gray-200 bg-white/70 p-3.5 pr-12 text-gray-800 shadow-inner focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all placeholder:text-gray-400"
              />
              {/* Botón del ojito posicionado absolutamente a la derecha */}
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-green-600 transition-colors focus:outline-none"
              >
                {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="mt-6 w-full rounded-xl bg-green-600 p-4 font-bold text-white shadow-lg shadow-green-600/30 hover:bg-green-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:bg-green-400 disabled:hover:translate-y-0"
          >
            {cargando ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;