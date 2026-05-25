import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Activity, AlertTriangle, Leaf, MapPin, CloudRain } from 'lucide-react';

const Overview = ({ parcelas = [] }) => {
  // ===== NORMALIZAR DATOS =====
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
    // Mantener timestamp como string (sin crear Date aquí)
    timestamp: p.timestamp || p.fecha || '',
  }));

  // ===== DERIVAR KPIs =====
  const parcelasEnAlerta = parcelasNormalizadas.filter(
    (p) => p.crop_disease_status === 'Mild' || p.crop_disease_status === 'Severe'
  ).length;

  const saludVegetal =
    parcelasNormalizadas.length > 0
      ? (
          parcelasNormalizadas.reduce((acc, p) => acc + (Number(p.NDVI_index) || 0), 0) /
          parcelasNormalizadas.length
        ).toFixed(2)
      : '0.00';

  const severeCount = parcelasNormalizadas.filter((p) => p.crop_disease_status === 'Severe').length;
  const mildCount = parcelasNormalizadas.filter((p) => p.crop_disease_status === 'Mild' || p.crop_disease_status === 'Moderate').length;
  const healthyCount = parcelasNormalizadas.length - severeCount - mildCount;

  // ===== NIVEL DE RIESGO GLOBAL =====
  let nivelRiesgo = 'Bajo';
  let colorRiesgo = 'text-green-600';
  let bgRiesgo = 'bg-green-50';

  if (severeCount > 0) {
    nivelRiesgo = 'Alto';
    colorRiesgo = 'text-red-600';
    bgRiesgo = 'bg-red-50';
  } else if (mildCount > 0) {
    nivelRiesgo = 'Medio';
    colorRiesgo = 'text-amber-600';
    bgRiesgo = 'bg-amber-50';
  }

  // ===== TELEMETRÍA PARA GRÁFICO =====
  const telemetria = parcelasNormalizadas
    .slice(-20)
    .map((p) => ({
      fecha: p.timestamp ? p.timestamp.split('T')[0] : 'N/A',
      temperature_C: Number(p.temperature_C) || 0,
      humidity: Number(p['humidity_%']) || 0,
      rainfall: Number(p.rainfall_mm) || 0,
    }));

  // ===== MAPA SIMPLE =====
  const getColorEstado = (estado) => {
    switch (estado) {
      case 'Severe':
        return '#dc2626';
      case 'Moderate':
        return '#f59e0b';
      case 'Mild':
        return '#eab308';
      default:
        return '#16a34a';
    }
  };

  // Formato puro para mostrar timestamp (sin crear Date)
  const formatoTimestamp = (ts) => (ts ? String(ts).replace('T', ' ').split('.')[0] : '—');

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* HEADER PRINCIPAL */}
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

      {/* SECCIÓN 1: KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        <div className={`${bgRiesgo} p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between`}>
          <div>
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Nivel de Riesgo Global</p>
            <h3 className={`text-3xl font-bold mt-2 ${colorRiesgo}`}>{nivelRiesgo}</h3>
            <p className="text-xs text-gray-500 mt-2">
              {severeCount > 0 && `${severeCount} críticas`}
              {mildCount > 0 && ` · ${mildCount} en alerta`}
            </p>
          </div>
          <div className={`p-3 ${bgRiesgo} ${colorRiesgo} rounded-lg`}>
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Parcelas en Alerta</p>
            <h3 className="text-3xl font-bold text-amber-700 mt-2">{parcelasEnAlerta}</h3>
            <p className="text-xs text-gray-500 mt-2">de {parcelasNormalizadas.length} totales</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <MapPin size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Salud Vegetal (NDVI)</p>
            <h3 className="text-3xl font-bold text-green-700 mt-2">{saludVegetal}</h3>
            <p className="text-xs text-gray-500 mt-2">Índice de vegetación</p>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <Leaf size={24} />
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: MAPA + TELEMETRÍA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="mb-4">
            <h4 className="text-lg font-bold text-gray-800">Mapa de Calor Epidemiológico</h4>
            <p className="text-xs text-gray-400">Parcelas geolocalizadas por estado sanitario</p>
          </div>

          <div className="h-80 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-4 flex flex-col justify-center">
            {parcelasNormalizadas.length > 0 ? (
              <div className="space-y-3 overflow-y-auto max-h-72">
                <div className="grid grid-cols-3 gap-2 mb-4 text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                    <span>Severe ({severeCount})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>Mild/Moderate ({mildCount})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    <span>Sano ({healthyCount})</span>
                  </div>
                </div>

                {parcelasNormalizadas.map((p, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-3 rounded-lg border-l-4 flex justify-between items-center text-xs"
                    style={{ borderLeftColor: getColorEstado(p.crop_disease_status) }}
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{p.farm_id}</p>
                      <p className="text-gray-500">
                        {p.latitude != null ? p.latitude.toFixed(4) : '—'}, {p.longitude != null ? p.longitude.toFixed(4) : '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className="inline-block px-2 py-1 rounded text-white text-xs font-bold"
                        style={{ backgroundColor: getColorEstado(p.crop_disease_status) }}
                      >
                        {p.crop_disease_status || 'Sano'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <MapPin size={40} className="mx-auto mb-2 opacity-50" />
                <p>Cargando parcelas...</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="mb-4">
            <h4 className="text-lg font-bold text-gray-800">Telemetría Predictiva</h4>
            <p className="text-xs text-gray-400">Temperatura, humedad y lluvia superpuestas</p>
          </div>

          {telemetria.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={telemetria}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="temperature_C"
                    stroke="#ef4444"
                    name="Temp. (°C)"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="humidity"
                    stroke="#3b82f6"
                    name="Humedad (%)"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="rainfall"
                    stroke="#16a34a"
                    name="Lluvia (mm)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <CloudRain size={40} className="mx-auto mb-2 opacity-50" />
                <p>Cargando telemetría...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN 3: PANEL DE EMERGENCIAS Y ASIGNACIÓN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LISTA DE TARJETAS - Centro de Acción */}
        <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="mb-4 flex justify-between items-center">
            <div>
              <h4 className="text-lg font-bold text-gray-800">Panel de Tareas</h4>
              <p className="text-xs text-gray-400">Tareas críticas generadas por los modelos</p>
            </div>
            <div className="text-xs text-gray-500">Click en "Enviar"</div>
          </div>

          {(() => {
            const raw = parcelasNormalizadas || [];
            const emergencias = raw
              .filter((r) => r.crop_disease_status === 'Severe' || r.crop_disease_status === 'Mild' || r.crop_disease_status === 'Moderate')
              .sort((a, b) => {
                const score = (s) => (s.crop_disease_status === 'Severe' ? 3 : s.crop_disease_status === 'Moderate' ? 2 : s.crop_disease_status === 'Mild' ? 1 : 0);
                if (score(b) !== score(a)) return score(b) - score(a);
                // Comparación pura de strings ISO (sin new Date)
                return (b.timestamp || '').localeCompare(a.timestamp || '');
              });

            if (!emergencias.length) {
              return (
                <div className="py-12 text-center text-gray-400">
                  ✅ No hay alertas críticas. El Panel de Emergencias está limpio.
                </div>
              );
            }

            const handleNotificar = (registro) => {
              const mensaje = [
                `AgroSmart - Alerta: ${registro.crop_disease_status}`,
                `Finca: ${registro.farm_id}`,
                `Cultivo: ${registro.crop_type}`,
                `Detalle: Se detectó ${registro.crop_disease_status} (NDVI: ${typeof registro.NDVI_index === 'number' ? registro.NDVI_index.toFixed(2) : '—'}, Humedad: ${registro.soil_moisture}%)`,
                `Acción requerida: Revisar sector y aplicar medidas.`,
              ].join('\n');

              const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
              window.open(url, '_blank');
            };

            return (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
                {emergencias.map((e, idx) => {
                  const color =
                    e.crop_disease_status === 'Severe' ? 'bg-red-600' :
                    e.crop_disease_status === 'Moderate' ? 'bg-amber-500' :
                    e.crop_disease_status === 'Mild' ? 'bg-yellow-500' : 'bg-gray-400';

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
                          <p className="text-xs text-gray-500 mt-1">
                            {e.crop_disease_status === 'Severe' ? 'Plaga / daño crítico detectado.' :
                              e.crop_disease_status === 'Moderate' ? 'Condición de riesgo moderado.' :
                              'Anomalía leve detectada.'}
                          </p>

                          <div className="mt-2 text-xs text-gray-600">
                            <span className="mr-3 font-semibold">NDVI: </span>{typeof e.NDVI_index === 'number' ? e.NDVI_index.toFixed(2) : '—'}
                            <span className="ml-4 mr-2 font-semibold">Humedad: </span>{e.soil_moisture}%
                            <span className="ml-4 font-semibold">Riego: </span>{e.irrigation}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => handleNotificar(e)}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-semibold shadow"
                          title="Simular envío por WhatsApp"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path d="M20.52 3.48A11.91 11.91 0 0 0 12 0C5.373 0 0 5.373 0 12c0 2.116.553 4.165 1.6 5.98L0 24l6.245-1.61A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12 0-3.21-1.25-6.208-3.48-8.52z" fill="#25D366"/>
                            <path d="M17.6 14.1c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.46-2.42-1.49-.9-.8-1.5-1.8-1.67-2.1-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.28.3-.47.1-.2.04-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.28.3-1.06 1.03-1.06 2.5 0 1.48 1.09 2.9 1.24 3.1.15.2 2.12 3.35 5.14 4.69 3.02 1.35 3.02.9 3.57.84.55-.07 1.76-.72 2.01-1.41.25-.69.25-1.28.18-1.4-.07-.12-.27-.18-.57-.33z" fill="#fff"/>
                          </svg>
                          Enviar
                        </button>

                        <button
                          onClick={() => {
                            alert(`Tarea asignada: Revisar ${e.farm_id} (${e.crop_type})`);
                          }}
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs"
                        >
                          Marcar tarea
                        </button>
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
      {/* FIN PANEL DE EMERGENCIAS */}
    </div>
  );
};

export default Overview;