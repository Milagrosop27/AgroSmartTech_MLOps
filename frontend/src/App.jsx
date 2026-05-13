import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ShieldCheck, Sprout, BellRing } from 'lucide-react';
import AlertDispatcher from './components/AlertDispatcher';
import { getPrediction, getRecommendation } from './api/api';
import AnalyticsChart from './components/AnalyticsChart';

function App() {
  // Estado para las predicciones de la IA
  const [riesgo, setRiesgo] = useState("Analizando lote...");
  const [fertilizante, setFertilizante] = useState("Esperando datos...");

  useEffect(() => {
    const consultarSistemas = async () => {
      try {
        const dataEntrada = {
          "Temperatura": 25, "Humedad": 60, "pH": 6.5, "NDVI": 0.8
        };

        // Ejecutamos ambas peticiones en paralelo
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
      {/* Sidebar Lateral para Navegación Ejecutiva */}
      <aside className="w-64 bg-green-800 text-white flex flex-col p-6">
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

      {/* Contenido Principal */}
      <main className="flex-1 p-8">
        <header className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Panel de Control Ejecutivo</h2>
          <p className="text-gray-500">Monitoreo predictivo y validación de campo</p>
        </header>

        {/* Grid de Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Card 1: Estado del Guardián */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-400 uppercase mb-2">Estado de Riesgo (IA)</h4>
            <p className="text-2xl font-bold text-gray-800">{riesgo}</p>
          </div>

          {/* Card 2: Recomendación de Nutrientes */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-400 uppercase mb-2">Recomendación Agrónomo</h4>
            <p className="text-2xl font-bold text-green-600">{fertilizante}</p>
          </div>

          {/* Card 3: Integridad IoT */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-400 uppercase mb-2">Sensores Online</h4>
            <p className="text-2xl font-bold text-blue-600">94% Operativo</p>
          </div>

          {/* Sección de Validación Crítica (Ocupa más espacio) */}
          <div className="md:col-span-2 lg:col-span-3">
            <AlertDispatcher
              prediction="Se recomienda aplicar fertilizante potásico en el Lote 4 debido a baja humedad residual."
              onApprove={() => alert("¡Alerta enviada al agricultor por WhatsApp!")}
            />
          </div>

            {/* Sección de Análisis de Tendencias */}
          <div className="lg:col-span-2">
            <AnalyticsChart />
          </div>

          {/* Sección de RESUMEN DE EFICIENCIA */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl border border-gray-100 h-80 flex flex-col">
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
                <p className="text-sm text-gray-400">Promedio pH Suelo</p>
              </div>
            </div>

            <button className="mt-4 w-full py-2 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-100 transition-colors">
              VER REPORTE DETALLADO
            </button>
          </div>

           {/* Sección de OPTIMIZACIÓN DE COSECHA */}
          <div className="bg-green-50 p-6 rounded-xl border border-green-100 h-80 flex flex-col justify-center items-center text-center">
            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                <Sprout className="text-green-600" size={32} />
            </div>
            <h4 className="text-green-900 font-bold text-lg">Optimización de Cosecha</h4>
            <p className="text-green-700 text-sm px-4">La IA ha optimizado el uso de agua en un 12% esta semana.</p>
          </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;
