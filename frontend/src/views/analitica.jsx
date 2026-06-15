import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar, YAxis as BarYAxis
} from 'recharts';
import {  AlertTriangle } from 'lucide-react';

const Analitica = ({ parcelas = [] }) => {
  const datos = parcelas;

  // 1. Cálculos para gráficos (usando tus mismos datos)
  const telemetriaMap = {};
  datos.forEach(p => {
    const min = p.fecha ? p.fecha.substring(0, 5) : 'N/A';
    if(!telemetriaMap[min]) telemetriaMap[min] = { count: 0, temp: 0, hum: 0 };
    telemetriaMap[min].temp += Number(p.temperature_C || 0);
    telemetriaMap[min].hum += Number(p['humidity_%'] || 0);
    telemetriaMap[min].count += 1;
  });
  const telemetria = Object.keys(telemetriaMap).slice(-15).map(min => ({
    fecha: min,
    temperature_C: Number((telemetriaMap[min].temp / telemetriaMap[min].count).toFixed(2)),
    humidity: Number((telemetriaMap[min].hum / telemetriaMap[min].count).toFixed(2))
  }));

  const severeCount = datos.filter(p => p.crop_disease_status === 'Severe').length;
  const mildCount   = datos.filter(p => ['Mild', 'Moderate'].includes(p.crop_disease_status)).length;
  const healthyCount = datos.length - severeCount - mildCount;

  const alertasPorCultivo = {};
  datos.forEach(p => {
    const cultivo = p.crop_type || 'Desconocido';
    if (!alertasPorCultivo[cultivo]) alertasPorCultivo[cultivo] = { nombre: cultivo, peligro: 0 };
    if (['Severe', 'Moderate', 'Mild'].includes(p.crop_disease_status)) alertasPorCultivo[cultivo].peligro += 1;
  });
  const topCultivos = Object.values(alertasPorCultivo).sort((a, b) => b.peligro - a.peligro).slice(0, 5);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Analítica y Tendencias</h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        <div className="lg:col-span-8 bg-white p-6 rounded-xl shadow-sm border">
          <h4 className="font-bold mb-4">Telemetría Promedio</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetria}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="temperature_C" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white p-6 rounded-xl shadow-sm border">
          <h4 className="font-bold mb-4">Estado General</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={[{name:'Sano', value:healthyCount}, {name:'Alerta', value:mildCount}, {name:'Crítico', value:severeCount}]} dataKey="value" innerRadius={50} outerRadius={70}>
                <Cell fill="#16a34a" /><Cell fill="#f59e0b" /><Cell fill="#dc2626" />
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
export default Analitica;