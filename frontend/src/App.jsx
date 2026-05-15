import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ShieldCheck, Sprout, BellRing, Database } from 'lucide-react';
import AlertDispatcher from './components/AlertDispatcher';
import AnalyticsChart from './components/AnalyticsChart';

function App() {
  const [seccionActiva, setSeccionActiva] = useState('dashboard');
  const [riesgo, setRiesgo] = useState("Esperando Simulador...");
  const [fertilizante, setFertilizante] = useState("Esperando...");

  // Estados para datos dinámicos en el Guardián
  const [datosSensores, setDatosSensores] = useState({ temp: 0, hum: 0, ph: 0, ndvi: 0 });

  const [historialAlertas, setHistorialAlertas] = useState(() => {
    const guardado = localStorage.getItem('agro_history_v1');
    return guardado ? JSON.parse(guardado) : [];
  });

  useEffect(() => {
    localStorage.setItem('agro_history_v1', JSON.stringify(historialAlertas));
  }, [historialAlertas]);

  // --- SINCRONIZACIÓN CON EL SIMULADOR ---
  useEffect(() => {
    const consultarSistemas = async () => {
      try {
        const response = await fetch('http://localhost:5000/datos-dashboard');
        const datos = await response.json();

        if (datos && datos.length > 0) {
          const ultimo = datos[datos.length - 1];
          setRiesgo(ultimo.diagnostico);
          setFertilizante(ultimo.recomendacion);
          setDatosSensores({
            temp: ultimo.temp,
            hum: ultimo.hum,
            ph: ultimo.ph,
            ndvi: ultimo.ndvi
          });
        }
      } catch (error) {
        console.error("Error conectando con la API:", error);
      }
    };

    consultarSistemas();
    const intervalo = setInterval(consultarSistemas, 3000);
    return () => clearInterval(intervalo);
  }, []);

  const manejarAprobacionAlerta = () => {
    const mensaje = `🌱 *AgroSmart* - Diagnóstico: ${riesgo}. Acción: Aplicar ${fertilizante}.`;
    window.open(`https://wa.me/?text=${mensaje}`, '_blank');

    const nuevaAlerta = {
      id: Date.now(),
      fecha: new Date().toLocaleString(),
      lote: "Lote 4 - Sector Norte",
      diagnostico: riesgo,
      recomendacion: fertilizante,
      estado: "Enviado a Campo"
    };
    setHistorialAlertas([nuevaAlerta, ...historialAlertas]);
  };

  const renderContenido = () => {
    switch (seccionActiva) {
      case 'dashboard':
        return (
          <div className="p-8 pt-6">
            <header className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800">Panel de Control Ejecutivo</h2>
              <p className="text-gray-500 text-sm">Monitoreo en tiempo real desde Simulador IoT</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-400 uppercase mb-2">Estado IA</h4>
                <p className="text-2xl font-bold text-gray-800">{riesgo}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-400 uppercase mb-2">Acción Sugerida</h4>
                <p className="text-2xl font-bold text-green-600">{fertilizante}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-400 uppercase mb-2">Telemetría</h4>
                <p className="text-2xl font-bold text-blue-600">📡 Activa</p>
              </div>
            </div>

            <AlertDispatcher
              prediction={`SISTEMA: ${riesgo}. RECOMENDACIÓN: ${fertilizante}.`}
              onApprove={manejarAprobacionAlerta}
            />

            <div className="grid grid-cols-12 gap-6 mt-6">
              <div className="col-span-12 lg:col-span-8 bg-white p-4 rounded-xl border shadow-sm">
                <AnalyticsChart />
              </div>
              <div className="col-span-12 lg:col-span-4 bg-white p-6 rounded-xl border shadow-sm h-[320px]">
                  <h4 className="text-gray-500 text-sm font-medium mb-4 uppercase">Lectura Actual</h4>
                  <div className="space-y-4">
                    <div>
                        <p className="text-3xl font-bold text-gray-800">{datosSensores.temp}°C</p>
                        <p className="text-sm text-gray-400">Temperatura Ambiente</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-gray-800">{datosSensores.hum}%</p>
                        <p className="text-sm text-gray-400">Humedad Suelo</p>
                    </div>
                  </div>
              </div>
            </div>
          </div>
        );
      case 'guardian':
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
                <h3 className="font-bold mb-4">Validación del Modelo XGBoost</h3>
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
      case 'alertas':
        return (
          <div className="p-8 pt-6">
            <h2 className="text-3xl font-bold text-gray-800">Historial de Alertas</h2>
            <div className="mt-8 bg-white rounded-xl border shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400">FECHA</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400">DIAGNÓSTICO</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400">ACCIÓN</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {historialAlertas.map(a => (
                    <tr key={a.id}>
                      <td className="px-6 py-4 text-sm">{a.fecha}</td>
                      <td className="px-6 py-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">{a.diagnostico}</span></td>
                      <td className="px-6 py-4 text-sm text-blue-600">{a.recomendacion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-green-800 text-white flex flex-col p-6 fixed h-full z-10">
        <h1 className="text-2xl font-bold mb-10 flex items-center gap-2"><Sprout /> AgroSmart</h1>
        <nav className="space-y-4">
          <div onClick={() => setSeccionActiva('dashboard')} className={`flex items-center gap-3 p-2 rounded cursor-pointer ${seccionActiva === 'dashboard' ? 'bg-green-700' : 'hover:bg-green-700'}`}><LayoutDashboard size={20}/> Dashboard</div>
          <div onClick={() => setSeccionActiva('guardian')} className={`flex items-center gap-3 p-2 rounded cursor-pointer ${seccionActiva === 'guardian' ? 'bg-green-700' : 'hover:bg-green-700'}`}><ShieldCheck size={20}/> Guardián</div>
          <div onClick={() => setSeccionActiva('alertas')} className={`flex items-center gap-3 p-2 rounded cursor-pointer ${seccionActiva === 'alertas' ? 'bg-green-700' : 'hover:bg-green-700'}`}><BellRing size={20}/> Alertas</div>
        </nav>
      </aside>
      <main className="flex-1 ml-64">{renderContenido()}</main>
    </div>
  );
}

export default App;