import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
const data = [
  { name: 'Lun', humedad: 40, rendimiento: 2400 },
  { name: 'Mar', humedad: 30, rendimiento: 1398 },
  { name: 'Mie', humedad: 20, rendimiento: 9800 },
  { name: 'Jue', humedad: 27, rendimiento: 3908 },
  { name: 'Vie', humedad: 18, rendimiento: 4800 },
  { name: 'Sab', humedad: 23, rendimiento: 3800 },
  { name: 'Dom', humedad: 34, rendimiento: 4300 },
];

const AnalyticsChart = () => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Tendencia de Humedad vs Rendimiento</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorHumedad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#166534" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#166534" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} padding={{ left: 30, right: 30 }} />
          <YAxis hide={true} />
          <Tooltip
            contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Area
            type="monotone"
            dataKey="humedad"
            stroke="#166534"
            fillOpacity={1}
            fill="url(#colorHumedad)"
            strokeWidth={3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnalyticsChart;