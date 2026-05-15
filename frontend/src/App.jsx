import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ShieldCheck, Sprout, BellRing, Database } from 'lucide-react';
import AlertDispatcher from './components/AlertDispatcher';
import { getPrediction, getRecommendation } from './api/api';
import AnalyticsChart from './components/AnalyticsChart';

function App() {
  const [seccionActiva, setSeccionActiva] = useState('dashboard');
  const [riesgo, setRiesgo] = useState("Analizando lote...");
  const [fertilizante, setFertilizante] = useState("Esperando datos...");

  // --- PERSISTENCIA DE HISTORIAL ---
  const [historialAlertas, setHistorialAlertas] = useState(() => {
    const guardado = localStorage.getItem('agro_history_v1');
    return guardado ? JSON.parse(guardado) : [];
  });

  useEffect(() => {
    localStorage.setItem('agro_history_v1', JSON.stringify(historialAlertas));
  }, [historialAlertas]);

  // --- FUNCIÓN: ENVÍO A WHATSAPP Y REGISTRO ---
  const manejarAprobacionAlerta = () => {
    const mensaje = `🌱 *AgroSmart AI* - Instrucción de Campo%0A%0A` +
                    `📍 *Lote:* 4 - Sector Norte%0A` +
                    `⚠️ *Diagnóstico:* ${riesgo}%0A` +
                    `💊 *Acción:* Aplicar ${fertilizante}%0A%0A` +
                    `_Por favor confirmar ejecución._`;

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

  useEffect(() => {
    const consultarSistemas = async () => {
      try {
        const dataEntrada = {
          "temperatura": 25,
          "humedad": 60,
          "ph": 6.5,
          "ndvi": 0.8
        };

        const [resGuardian, resAgronomic] = await Promise.all([
          getPrediction(dataEntrada),
          getRecommendation(dataEntrada)
        ]);

        if (resGuardian.data.estado_riesgo) {
          setRiesgo(resGuardian.data.estado_riesgo[0]);
        }

        if (resAgronomic.data.fertilizante_recomendado) {
          setFertilizante(resAgronomic.data.fertilizante_recomendado[0]);
        }

      } catch (error) {
        console.error("Error en la petición:", error.response?.data || error.message);
        setRiesgo("Revisar Columnas");
        setFertilizante("Revisar Columnas");
      }
    };

    consultarSistemas();
  }, []);

  const renderContenido = () => {
    switch (seccionActiva) {
      case 'dashboard':
        return (
          <div className="p-8 pt-6">
            <header className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800">Panel de Control Ejecutivo</h2>
              <p className="text-gray-500 text-sm">Monitoreo predictivo y validación de campo</p>
            </header>

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

            <div className="mb-6">
              <AlertDispatcher
                prediction={`ESTADO: ${riesgo} - Aplicar ${fertilizante} para estabilizar el cultivo.`}
                onApprove={manejarAprobacionAlerta}
              />
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <AnalyticsChart />
                </div>

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
        );
      case 'guardian':
        return (
          <div className="p-8 pt-6">
            <h2 className="text-3xl font-bold text-gray-800">Módulo Guardián</h2>
            <p className="text-gray-500 text-sm mb-8">Auditoría técnica y explicabilidad de modelos IA</p>

            {/* VISTA TÉCNICA DE AUDITORÍA */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-800 text-white p-6 rounded-xl shadow-lg border border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                  <Database size={20} className="text-blue-400"/>
                  <h3 className="font-bold">Inputs del Sistema</h3>
                </div>
                <div className="space-y-3 text-sm font-mono">
                  <div className="flex justify-between border-b border-slate-700 pb-1">
                    <span className="text-slate-400">TEMPERATURA</span>
                    <span className="text-blue-300">25.0 °C</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-700 pb-1">
                    <span className="text-slate-400">HUMEDAD</span>
                    <span className="text-blue-300">60.0 %</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-700 pb-1">
                    <span className="text-slate-400">PH_SUELO</span>
                    <span className="text-blue-300">6.50</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-700 pb-1">
                    <span className="text-slate-400">NDVI_INDEX</span>
                    <span className="text-blue-300">0.82</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <ShieldCheck className="text-green-600" size={20}/> Trazabilidad de Modelos
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-green-500">
                    <p className="text-xs font-bold text-gray-400 uppercase">Modelo: Guardián XGBoost v1.0</p>
                    <p className="text-sm text-gray-700 mt-1">Status: <span className="font-bold">Activo</span> | Predicción: <span className="text-green-600 font-bold">{riesgo}</span></p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                    <p className="text-xs font-bold text-gray-400 uppercase">Modelo: Agronomic Recommender v1.2</p>
                    <p className="text-sm text-gray-700 mt-1">Status: <span className="font-bold">Activo</span> | Output: <span className="text-blue-600 font-bold">{fertilizante}</span></p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg">
                <p className="text-amber-800 text-sm italic">
                  * Los datos mostrados representan los parámetros exactos enviados a la API de Polars/XGBoost para generar las predicciones actuales.
                </p>
            </div>
          </div>
        );
      case 'alertas':
        return (
          <div className="p-8 pt-6">
            <h2 className="text-3xl font-bold text-gray-800">Historial de Alertas</h2>
            <p className="text-gray-500 text-sm mb-8">Registro persistente de validación de campo</p>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Fecha / Hora</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Lote</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Diagnóstico</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Recomendación</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historialAlertas.length > 0 ? (
                    historialAlertas.map((alerta) => (
                      <tr key={alerta.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-600">{alerta.fecha}</td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-800">{alerta.lote}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${alerta.diagnostico.includes('Crítico') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {alerta.diagnostico}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-blue-600 font-medium">{alerta.recomendacion}</td>
                        <td className="px-6 py-4 text-[10px] font-bold text-green-600 italic">● {alerta.estado}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-20 text-center text-gray-400 italic">
                        No hay alertas registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-green-800 text-white flex flex-col p-6 fixed h-full z-10 shadow-xl">
        <h1 className="text-2xl font-bold mb-10 flex items-center gap-2">
          <Sprout /> AgroSmart
        </h1>
        <nav className="space-y-4">
          <div
            onClick={() => setSeccionActiva('dashboard')}
            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${seccionActiva === 'dashboard' ? 'bg-green-700' : 'hover:bg-green-700 opacity-70'}`}
          >
            <LayoutDashboard size={20} /> Dashboard
          </div>
          <div
            onClick={() => setSeccionActiva('guardian')}
            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${seccionActiva === 'guardian' ? 'bg-green-700' : 'hover:bg-green-700 opacity-70'}`}
          >
            <ShieldCheck size={20} /> Guardián
          </div>
          <div
            onClick={() => setSeccionActiva('alertas')}
            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${seccionActiva === 'alertas' ? 'bg-green-700' : 'hover:bg-green-700 opacity-70'}`}
          >
            <BellRing size={20} /> Alertas
          </div>
        </nav>
      </aside>

      <main className="flex-1 ml-64 min-h-screen">
        {renderContenido()}
      </main>
    </div>
  );
}

export default App;