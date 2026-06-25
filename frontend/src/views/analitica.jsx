import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Thermometer, Droplets, Activity, AlertTriangle } from 'lucide-react';

const COLORES_DONA_4 = ['#16a34a', '#eab308', '#f55d0b', '#dc2626'];

const TooltipDona = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow text-xs">
        <p className="font-bold text-gray-800">{payload[0].name}</p>
        <p className="text-gray-600">{payload[0].value} sectores</p>
      </div>
    );
  }
  return null;
};

const TooltipTemp = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow text-xs">
        <p className="font-bold text-gray-600">{label} (hora local)</p>
        <p style={{ color: '#ef4444' }}>🌡 Temp: <span className="font-bold">{payload[0]?.value}°C</span></p>
      </div>
    );
  }
  return null;
};

const TooltipHum = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow text-xs">
        <p className="font-bold text-gray-600">{label} (hora local)</p>
        <p style={{ color: '#3b82f6' }}>💧 Hum: <span className="font-bold">{payload[0]?.value}%</span></p>
      </div>
    );
  }
  return null;
};

const utcAHoraLocal = (horaUTC) => {
  if (!horaUTC || horaUTC === 'N/A') return horaUTC;
  try {
    const [h, m] = horaUTC.split(':').map(Number);
    const fecha = new Date();
    fecha.setUTCHours(h, m, 0, 0);
    const hLocal = fecha.getHours().toString().padStart(2, '0');
    const mLocal = fecha.getMinutes().toString().padStart(2, '0');
    return `${hLocal}:${mLocal}`;
  } catch {
    return horaUTC;
  }
};

const Analitica = ({ parcelas = [] }) => {
  const datos = parcelas;

  // Deduplicar por farm_id
  const mapaUltimos = {};
  datos.forEach(p => { mapaUltimos[p.farm_id] = p; });
  const sectoresActuales = Object.values(mapaUltimos);

  // Telemetría con conversión UTC → Perú
  const telemetriaMap = {};
  datos.forEach(p => {
    const horaUTC   = p.fecha ? p.fecha.substring(0, 5) : 'N/A';
    const horaLocal = utcAHoraLocal(horaUTC);
    if (!telemetriaMap[horaLocal]) telemetriaMap[horaLocal] = { count: 0, temp: 0, hum: 0 };
    telemetriaMap[horaLocal].temp  += Number(p.temperature_C  || 0);
    telemetriaMap[horaLocal].hum   += Number(p['humidity_%']  || 0);
    telemetriaMap[horaLocal].count += 1;
  });

  const telemetria = Object.keys(telemetriaMap)
    .sort()
    .slice(-20)
    .map(key => ({
      fecha:         key,
      temperature_C: Number((telemetriaMap[key].temp / telemetriaMap[key].count).toFixed(1)),
      humidity:      Number((telemetriaMap[key].hum  / telemetriaMap[key].count).toFixed(1)),
    }));

  // Dona — deduplicada
  const severeCount   = sectoresActuales.filter(p => p.crop_disease_status === 'Severe').length;
  const moderateCount = sectoresActuales.filter(p => p.crop_disease_status === 'Moderate').length;
  const mildCount     = sectoresActuales.filter(p => p.crop_disease_status === 'Mild').length;
  const healthyCount  = sectoresActuales.filter(p =>
    !['Severe', 'Moderate', 'Mild'].includes(p.crop_disease_status)
  ).length;

  const dataDona = [
    { name: 'Sano',     value: healthyCount  },
    { name: 'Leve',     value: mildCount     },
    { name: 'Moderado', value: moderateCount },
    { name: 'Crítico',  value: severeCount   },
  ].filter(d => d.value > 0);

  // KPIs
  const tempPromedio = sectoresActuales.length > 0
    ? (sectoresActuales.reduce((s, p) => s + Number(p.temperature_C || 0), 0) / sectoresActuales.length).toFixed(1)
    : '—';
  const humPromedio = sectoresActuales.length > 0
    ? (sectoresActuales.reduce((s, p) => s + Number(p['humidity_%'] || 0), 0) / sectoresActuales.length).toFixed(1)
    : '—';
  const totalSectores = sectoresActuales.length;

  return (
    <div className="p-8 bg-gray-50 min-h-screen rounded-3xl">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Analítica y Tendencias</h2>
        <p className="text-gray-500 text-sm mt-1">Monitoreo de telemetría y estado fitosanitario en tiempo real</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="p-2 bg-red-50 rounded-lg"><Thermometer size={20} className="text-red-500" /></div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Temp. promedio</p>
            <p className="text-xl font-bold text-gray-800">{tempPromedio}°C</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg"><Droplets size={20} className="text-blue-500" /></div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Hum. promedio</p>
            <p className="text-xl font-bold text-gray-800">{humPromedio}%</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg"><Activity size={20} className="text-green-600" /></div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Sectores activos</p>
            <p className="text-xl font-bold text-gray-800">{totalSectores}</p>
          </div>
        </div>
        {/* ✅ Cambiado a Sectores Críticos */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="p-2 bg-red-50 rounded-lg"><AlertTriangle size={20} className="text-red-600" /></div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Sectores críticos</p>
            <p className="text-xl font-bold text-gray-800">{severeCount}</p>
          </div>
        </div>
      </div>

      {/* ✅ Temperatura — gráfico separado */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="font-bold text-gray-800 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
              Temperatura (°C)
            </h4>
            <p className="text-xs text-gray-400 mt-0.5">Hora local (UTC-5 · Perú)</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={telemetria} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
              tickCount={5}
            />
            <Tooltip content={<TooltipTemp />} />
            <Line
              type="monotone"
              dataKey="temperature_C"
              stroke="#ef4444"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ✅ Humedad — gráfico separado */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="font-bold text-gray-800 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-400 inline-block" />
              Humedad del Suelo (%)
            </h4>
            <p className="text-xs text-gray-400 mt-0.5">Hora local (UTC-5 · Perú)</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={telemetria} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
              tickCount={5}
            />
            <Tooltip content={<TooltipHum />} />
            <Line
              type="monotone"
              dataKey="humidity"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Dona */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="mb-4">
          <h4 className="font-bold text-gray-800">Estado Fitosanitario</h4>
          <p className="text-xs text-gray-400 mt-0.5">{totalSectores} sectores activos</p>
        </div>
        {dataDona.length > 0 ? (
          <div className="flex flex-col md:flex-row items-center gap-8">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={dataDona}
                  dataKey="value"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  startAngle={90}
                  endAngle={-270}
                >
                  {dataDona.map((_, i) => (
                    <Cell key={i} fill={COLORES_DONA_4[i]} />
                  ))}
                </Pie>
                <Tooltip content={<TooltipDona />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 flex-1">
              {dataDona.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORES_DONA_4[i] }} />
                    <span className="text-sm text-gray-600">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-800">{item.value} sectores</span>
                    <span className="text-xs text-gray-400">
                      {totalSectores > 0 ? Math.round((item.value / totalSectores) * 100) : 0}%
                    </span>
                    <div className="w-24 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${totalSectores > 0 ? (item.value / totalSectores) * 100 : 0}%`,
                          backgroundColor: COLORES_DONA_4[i]
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
            Sin datos disponibles
          </div>
        )}
      </div>
    </div>
  );
};

export default Analitica;