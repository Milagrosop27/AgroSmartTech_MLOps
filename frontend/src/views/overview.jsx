import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Activity, AlertTriangle, Leaf, MapPin, CloudRain } from 'lucide-react';
import ManualPrediction from '../components/ui/ManualPrediction.jsx';

const Overview = ({ parcelas = [], manejarAprobacionAlerta }) => {
  const parcelasNormalizadas = (parcelas || []).map((p) => ({
    farm_id: p.farm_id || `FARM_${p.fecha || 'N/A'}`,
    crop_type: p.crop_type || 'Cultivo',
    crop_disease_status: p.crop_disease_status || p.diagnostico || 'Sano',
    NDVI_index: Number(p.NDVI_index ?? p.ndvi ?? 0),
    latitude: p.latitude ?? null,
    longitude: p.longitude ?? null,
    temperature_C: Number(p.temperature_C ?? p.temp ?? 0),
    'humidity_%': Number(p['humidity_%'] ?? p.hum ?? 0),
    rainfall_mm: Number(p.rainfall_mm ?? 0),
    irrigation: p.irrigation_type || p.irrigation || p['irrigation_type'] || 'Desconocido',
    soil_moisture: Number(p['soil_moisture_%'] ?? p.soil_moisture_percent ?? p.soil_moisture ?? 0),
    timestamp: p.timestamp || p.fecha || '',
  }));

  const parcelasEnAlerta = parcelasNormalizadas.filter(p => p.crop_disease_status === 'Mild' || p.crop_disease_status === 'Severe').length;
  const saludVegetal = parcelasNormalizadas.length > 0
      ? (parcelasNormalizadas.reduce((acc, p) => acc + (Number(p.NDVI_index) || 0), 0) / parcelasNormalizadas.length).toFixed(2)
      : '0.00';

  const severeCount = parcelasNormalizadas.filter((p) => p.crop_disease_status === 'Severe').length;
  const mildCount = parcelasNormalizadas.filter((p) => p.crop_disease_status === 'Mild' || p.crop_disease_status === 'Moderate').length;
  const healthyCount = parcelasNormalizadas.length - severeCount - mildCount;

  let nivelRiesgo = 'Bajo'; let colorRiesgo = 'text-green-600'; let bgRiesgo = 'bg-green-50';
  if (severeCount > 0) { nivelRiesgo = 'Alto'; colorRiesgo = 'text-red-600'; bgRiesgo = 'bg-red-50'; }
  else if (mildCount > 0) { nivelRiesgo = 'Medio'; colorRiesgo = 'text-amber-600'; bgRiesgo = 'bg-amber-50'; }

  const telemetria = parcelasNormalizadas.slice(-20).map((p) => ({
      fecha: p.timestamp ? p.timestamp.split('T')[0] : 'N/A',
      temperature_C: Number(p.temperature_C) || 0,
      humidity: Number(p['humidity_%']) || 0,
      rainfall: Number(p.rainfall_mm) || 0,
  }));

  const getColorEstado = (estado) => {
    switch (estado) {
      case 'Severe': return '#dc2626';
      case 'Moderate': return '#f59e0b';
      case 'Mild': return '#eab308';
      default: return '#16a34a';
    }
  };

  const formatoTimestamp = (ts) => (ts ? String(ts).replace('T', ' ').split('.')[0] : '—');

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Dashboard Ejecutivo</h2>
          <p className="text-gray-500 text-sm">Monitoreo en tiempo real</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
          <Activity className="text-blue-500" size={28} />
          <div>
            <p className="text-sm font-semibold text-gray-800">Conexión IoT</p>
            <p className="text-xs text-green-500 font-bold">En línea (Sincronizado)</p>
          </div>
        </div>
      </header>

      {/* --- TARJETAS SUPERIORES --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        <div className={`${bgRiesgo} p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between`}>
          <div>
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Nivel de Riesgo Global</p>
            <h3 className={`text-3xl font-bold mt-2 ${colorRiesgo}`}>{nivelRiesgo}</h3>
            <p className="text-xs text-gray-500 mt-2">{severeCount > 0 && `${severeCount} críticas`} {mildCount > 0 && ` · ${mildCount} en alerta`}</p>
          </div>
          <div className={`p-3 ${bgRiesgo} ${colorRiesgo} rounded-lg`}><AlertTriangle size={24} /></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Parcelas en Alerta</p>
            <h3 className="text-3xl font-bold text-amber-700 mt-2">{parcelasEnAlerta}</h3>
            <p className="text-xs text-gray-500 mt-2">de {parcelasNormalizadas.length} totales</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><MapPin size={24} /></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Salud Vegetal (NDVI)</p>
            <h3 className="text-3xl font-bold text-green-700 mt-2">{saludVegetal}</h3>
            <p className="text-xs text-gray-500 mt-2">Índice de vegetación</p>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-lg"><Leaf size={24} /></div>
        </div>
      </div>

      {/* === AQUÍ INYECTAMOS EL SIMULADOR MANUAL === */}
      <div className="mb-8">
        <ManualPrediction />
      </div>

      {/* --- GRÁFICOS Y MAPAS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="mb-4"><h4 className="text-lg font-bold text-gray-800">Mapa de Calor Epidemiológico</h4><p className="text-xs text-gray-400">Parcelas geolocalizadas por estado sanitario</p></div>
          <div className="h-80 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-4 flex flex-col justify-center">
            {parcelasNormalizadas.length > 0 ? (
              <div className="space-y-3 overflow-y-auto max-h-72">
                {parcelasNormalizadas.map((p, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg border-l-4 flex justify-between items-center text-xs" style={{ borderLeftColor: getColorEstado(p.crop_disease_status) }}>
                    <div className="flex-1"><p className="font-semibold text-gray-800">{p.farm_id}</p><p className="text-gray-500">{p.latitude != null ? p.latitude.toFixed(4) : '—'}, {p.longitude != null ? p.longitude.toFixed(4) : '—'}</p></div>
                    <div className="text-right"><span className="inline-block px-2 py-1 rounded text-white text-xs font-bold" style={{ backgroundColor: getColorEstado(p.crop_disease_status) }}>{p.crop_disease_status || 'Sano'}</span></div>
                  </div>
                ))}
              </div>
            ) : (<div className="text-center text-gray-400"><MapPin size={40} className="mx-auto mb-2 opacity-50" /><p>Cargando parcelas...</p></div>)}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="mb-4"><h4 className="text-lg font-bold text-gray-800">Telemetría Predictiva</h4><p className="text-xs text-gray-400">Temperatura, humedad y lluvia superpuestas</p></div>
          {telemetria.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={telemetria}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line yAxisId="left" type="monotone" dataKey="temperature_C" stroke="#ef4444" name="Temp. (°C)" strokeWidth={2} />
                  <Line yAxisId="left" type="monotone" dataKey="humidity" stroke="#3b82f6" name="Humedad (%)" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="rainfall" stroke="#16a34a" name="Lluvia (mm)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (<div className="h-80 flex items-center justify-center text-gray-400"><div className="text-center"><CloudRain size={40} className="mx-auto mb-2 opacity-50" /><p>Cargando telemetría...</p></div></div>)}
        </div>
      </div>

      {/* SECCIÓN 2: TAREAS Y ESTADO DE SECTORES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="mb-4 flex justify-between items-center">
            <div><h4 className="text-lg font-bold text-gray-800">Panel de Tareas</h4><p className="text-xs text-gray-400">Tareas críticas generadas por los modelos</p></div>
            <div className="text-xs text-gray-500">Click en "Enviar"</div>
          </div>

          {(() => {
            const emergencias = parcelasNormalizadas.filter((r) => ['Severe', 'Mild', 'Moderate'].includes(r.crop_disease_status));
            if (!emergencias.length) return <div className="py-12 text-center text-gray-400">✅ No hay alertas críticas.</div>;

            return (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
                {emergencias.map((e, idx) => {
                  const color = e.crop_disease_status === 'Severe' ? 'bg-red-600' : e.crop_disease_status === 'Moderate' ? 'bg-amber-500' : 'bg-yellow-500';

                  return (
                    <div key={idx} className="bg-white rounded-lg shadow-sm border p-4 flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`w-3 h-12 rounded-lg ${color} mr-1`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-gray-800">
                              {e.crop_disease_status === 'Severe' ? 'Emergencia: ' : e.crop_disease_status === 'Moderate' ? 'Advertencia: ' : 'Aviso: '}
                              {e.crop_type} - {e.farm_id}
                            </h5>
                            <span className="text-xs text-gray-400">· {formatoTimestamp(e.timestamp)}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Plaga / daño crítico detectado.</p>
                          <div className="mt-2 text-xs text-gray-600">
                            <span className="mr-3 font-semibold">NDVI: </span>{typeof e.NDVI_index === 'number' ? e.NDVI_index.toFixed(2) : '—'}
                            <span className="ml-4 mr-2 font-semibold">Humedad: </span>{e.soil_moisture}%
                            <span className="ml-4 font-semibold">Riego: </span>{e.irrigation}
                          </div>
                        </div>
                      </div>

                      {/* --- AQUI LLAMAMOS A LA API EN SECRETO SIN ABRIR PESTAÑAS --- */}
                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => manejarAprobacionAlerta(e)}
                          className="flex items-center gap-2 bg-[#25D366] hover:bg-green-600 text-white px-3 py-2 rounded-md text-sm font-semibold shadow transition-colors"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51h-.57c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487 2.98 1.285 2.98.866 3.524.815.545-.049 1.758-.718 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="white"/>
                            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.551 4.17 1.597 5.991L0 24l6.237-1.612A11.96 11.96 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.986c-1.84 0-3.642-.472-5.26-1.365l-.377-.215-3.692.955.986-3.568-.242-.379A9.957 9.957 0 0 1 2.015 12C2.015 6.49 6.49 2.014 12 2.014c5.51 0 9.985 4.476 9.985 9.986 0 5.51-4.475 9.986-9.985 9.986z" fill="white"/>
                          </svg>
                          Enviar
                        </button>
                        <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs transition-colors">Marcar tarea</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* PANEL SECUNDARIO - DONUT: Estado de Sectores */}
        <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="mb-4">
            <h4 className="text-lg font-bold text-gray-800">Estado de Sectores</h4>
            <p className="text-xs text-gray-400">Distribución por estado (Saludable / Observación / Crítico)</p>
          </div>

          {(() => {
            const raw = parcelasNormalizadas || [];
            const severe = raw.filter((r) => r.crop_disease_status === 'Severe').length;
            const mild = raw.filter((r) => r.crop_disease_status === 'Mild' || r.crop_disease_status === 'Moderate').length;
            const healthy = raw.length - severe - mild;

            const data = [
              { name: 'Saludable', value: healthy },
              { name: 'En Observación', value: mild },
              { name: 'Crítico', value: severe },
            ];

            const COLORS = ['#16a34a', '#f59e0b', '#dc2626'];

            return (
              <div className="flex flex-col items-center justify-center">
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={data} dataKey="value" nameKey="name" innerRadius={56} outerRadius={90} paddingAngle={2}>
                        {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 text-sm text-gray-600">
                  <div><span className="inline-block w-3 h-3 bg-green-600 mr-2 rounded-full"></span>Saludable: {healthy}</div>
                  <div className="mt-1"><span className="inline-block w-3 h-3 bg-yellow-500 mr-2 rounded-full"></span>En Observación: {mild}</div>
                  <div className="mt-1"><span className="inline-block w-3 h-3 bg-red-600 mr-2 rounded-full"></span>Crítico: {severe}</div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default Overview;