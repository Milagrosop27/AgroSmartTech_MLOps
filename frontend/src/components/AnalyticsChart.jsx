import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AnalyticsChart = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Tendencia de Humedad en Tiempo Real</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorHumedad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#166534" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#166534" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />

          {/* Usamos la clave "fecha" que viene de BigQuery */}
          <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} padding={{ left: 30, right: 30 }} />

          {/* Ponemos un dominio automático para que la gráfica suba y baje dinámicamente */}
          <YAxis domain={['auto', 'auto']} hide={true} />

          <Tooltip
            contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />

          {/* Usamos la clave "hum" que viene de BigQuery */}
          <Area
            type="monotone"
            dataKey="hum"
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