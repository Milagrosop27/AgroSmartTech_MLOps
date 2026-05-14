import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ShieldCheck, Sprout, BellRing } from 'lucide-react';
import AlertDispatcher from './components/AlertDispatcher';
import { getPrediction, getRecommendation } from './api/api';
import AnalyticsChart from './components/AnalyticsChart';

function App() {
  const [riesgo, setRiesgo] = useState("Analizando lote...");
  const [fertilizante, setFertilizante] = useState("Esperando datos...");

  useEffect(() => {
    const consultarSistemas = async () => {
      try {
        const dataEntrada = { "Temperatura": 25, "Humedad": 60, "pH": 6.5, "NDVI": 0.8 };
        const [resGuardian, resAgronomic] = await Promise.all([
          getPrediction(dataEntrada),
          getRecommendation(dataEntrada)
        ]);
        setRiesgo(resGuardian.data.estado_riesgo[0]);
        setFertilizante(resAgronomic.data.recomendacion[0]);
      } catch (error) {
        setRiesgo("Error de conexión");
        setFertilizante("Error de conexión");
      }
    };
    consultarSistemas();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Lateral - Se mantiene igual */}
      <aside className="w-64 bg-green-800 text-white flex flex-col p-6 fixed h-full z-10">
        <h1 className="text-2xl font-bold mb-10 flex items-center gap-2">
          <Sprout /> AgroSmart
        </h1>
        <nav className="space-y-4">
          <div className="flex items-center gap-3 p-2 bg-green-700 rounded-lg cursor-pointer">
            <LayoutDashboard size={20} /> Dashboard
          </div>
          <div className="flex items-center gap-3 p-2 hover:bg-green-700 rounded-lg cursor-pointer transition-colors">
            <ShieldCheck size={20} /> Guardián
          </div>
          <div className="flex items-center gap-3 p-2 hover:bg-green-700 rounded-lg cursor-pointer transition-colors">
            <BellRing size={20} /> Alertas
          </div>
        </nav>
      </aside>

      {/* Contenido Principal - Eliminamos el espacio superior con p-0 y luego controlamos el margen */}
      <main className="flex-1 ml-64 min-h-screen">
        {/* Este div controla el espaciado real del contenido para que no pegue arriba */}
        <div className="p-8 pt-6">
          <header className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Panel de Control Ejecutivo</h2>
            <p className="text-gray-500 text-sm">Monitoreo predictivo y validación de campo</p>
          </header>

          {/* Grid de KPIs Superiores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h4 className="text-sm font-semibold text-gray-400 uppercase mb-2">Estado de Riesgo (IA)</h4>
              <p className="text-2xl font-bold text-gray-800">{riesgo}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h4 className="text-sm font-semibold text-gray-400 uppercase mb-2">Recomendación Agrónomo</h4>
              <p className="text-2xl font-bold text-green-600">{fertilizante}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h4 className="text-sm font-semibold text-gray-400 uppercase mb-2">Sensores Online</h4>
              <p className="text-2xl font-bold text-blue-600">94% Operativo</p>
            </div>
          </div>

          {/* Sección de Validación */}
          <div className="mb-6">
            <AlertDispatcher
              prediction="Se recomienda aplicar fertilizante potásico en el Lote 4 debido a baja humedad residual."
              onApprove={() => alert("¡Alerta enviada!")}
            />
          </div>

          {/* Grid de Análisis Detallado (12 columnas) */}
          <div className="grid grid-cols-12 gap-6">

            {/* Bloque Izquierdo: Gráfica + 3 Cards */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <AnalyticsChart />
              </div>

              {/* Cards Inferiores alineadas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 h-24">
                  <div className="text-amber-500 bg-amber-50 p-2 rounded-lg"><BellRing size={20} /></div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Clima</p>
                    <p className="text-lg font-bold text-gray-800">28°C <span className="text-xs text-blue-500 ml-1">15% Lluvia</span></p>
                    <p className="text-[10px] text-gray-400">Soleado - Despejado</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 h-24">
                  <div className="text-green-600 bg-green-50 p-2 rounded-lg"><ShieldCheck size={20} /></div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Salud (NDVI)</p>
                    <p className="text-lg font-bold text-gray-800">0.82</p>
                    <p className="text-[10px] text-green-500 font-bold italic">Estado Óptimo</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 h-24">
                  <div className="text-blue-600 bg-blue-50 p-2 rounded-lg"><LayoutDashboard size={20} /></div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Próximo Riego</p>
                    <p className="text-lg font-bold text-gray-800">05:00 AM</p>
                    <p className="text-[10px] text-gray-400">Lote 4</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloque Derecho: Resumen y Optimización */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-100 flex flex-col shadow-sm h-[320px]">
                <h4 className="text-gray-500 text-sm font-medium mb-4 uppercase">Resumen de Eficiencia</h4>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-gray-800">88%</span>
                    <p className="text-xs text-green-600 font-medium">↑ 5% vs mes anterior</p>
                    <p className="text-sm text-gray-400">Eficiencia de Riego</p>
                  </div>
                  <div>
                    <span className="text-3xl font-bold text-gray-800">14.2</span>
                    <p className="text-xs text-amber-600 font-medium">↓ 2% vs ayer</p>
                    <p className="text-sm text-gray-400 font-medium">Promedio pH Suelo</p>
                  </div>
                </div>
                <button className="mt-4 w-full py-2 bg-white text-blue-900 text-xs font-bold rounded-lg border border-blue-900 hover:bg-blue-50 transition-colors">
                  VER REPORTE DETALLADO
                </button>
              </div>

              <div className="bg-green-50 p-6 rounded-xl border border-green-100 flex flex-col justify-center items-center text-center shadow-sm h-[130px]">
                <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                  <Sprout className="text-green-600" size={24} />
                </div>
                <h4 className="text-green-900 font-bold text-lg leading-tight">Optimización</h4>
                <p className="text-green-700 text-xs mt-2 italic px-2">Uso de agua optimizado en un 12% esta semana.</p>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default App;