import { useEffect, useState, useMemo } from 'react';
import { ClipboardList, AlertTriangle, CheckCircle, Activity, XCircle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ExportButtons from '../components/ui/ExportButtons.jsx';
import { db } from '../config/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

const toDate = (valor) => {
  if (!valor) return null;
  if (valor?.seconds) return new Date(valor.seconds * 1000);
  const d = new Date(valor);
  return isNaN(d.getTime()) ? null : d;
};

const Record = () => {
  const [historialAlertas, setHistorialAlertas] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, 'historial_alertas'),
      orderBy('fecha_hora', 'desc')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const alertas = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const fechaDate = toDate(data.fecha_hora);
        return {
          id:          docSnap.id,
          farm_id:     data.farm_id     || '',
          diagnostico: data.diagnostico || '',
          accion:      data.accion      || '',
          estado:      data.estado      || '',
          telefono:    data.telefono    || '',
          cultivo:     data.cultivo     || '',
          fechaDate,
          fechaMostrar: fechaDate ? fechaDate.toLocaleString('es-PE') : '',
        };
      });
      setHistorialAlertas(alertas);
    });
    return () => unsub();
  }, []);

  // KPIs — nombres en español igual que Firestore
  const totalAlertas        = historialAlertas.length;
  const alertasExitosas     = historialAlertas.filter(a => a.estado === 'Realizado').length;
  const alertasCriticas     = historialAlertas.filter(a => a.diagnostico === 'Severe').length;
  const alertasSinRespuesta = historialAlertas.filter(a => a.estado === 'Sin respuesta').length;
  const tasaConfirmacion    = totalAlertas > 0
    ? Math.round((alertasExitosas / totalAlertas) * 100)
    : 0;

  const alertasPorHectarea = useMemo(() => {
    const mapa = {};
    historialAlertas.forEach(a => {
      const hectarea = a.farm_id?.split('_')[0] || 'Otro';
      if (!mapa[hectarea]) mapa[hectarea] = { hectarea, total: 0, confirmadas: 0, sinRespuesta: 0 };
      mapa[hectarea].total += 1;
      if (a.estado === 'Realizado')     mapa[hectarea].confirmadas  += 1;
      if (a.estado === 'Sin respuesta') mapa[hectarea].sinRespuesta += 1;
    });
    return Object.values(mapa).sort((a, b) => a.hectarea.localeCompare(b.hectarea));
  }, [historialAlertas]);

  const COLORES = ['#16a34a', '#22c55e', '#45da7b', '#86efac', '#bbf7d0'];

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full">

      {/* CABECERA Y EXPORTACIÓN */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList className="text-green-600" />
            Registro de Alertas
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Genera y descarga el historial completo de la telemetría y notificaciones.
          </p>
        </div>
        <ExportButtons historialAlertas={historialAlertas} />
      </div>

      {/* KPIs — FILA 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total de Registros</p>
            <h3 className="text-2xl font-bold text-gray-800">{totalAlertas}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 rounded-lg text-red-600">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Diagnósticos Críticos</p>
            <h3 className="text-2xl font-bold text-gray-800">{alertasCriticas}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 rounded-lg text-green-600">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Alertas Confirmadas</p>
            <h3 className="text-2xl font-bold text-gray-800">{alertasExitosas}</h3>
          </div>
        </div>
      </div>

      {/* KPIs — FILA 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <XCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Sin Respuesta</p>
            <h3 className="text-2xl font-bold text-gray-800">{alertasSinRespuesta}</h3>
            <p className="text-xs text-gray-400 mt-1">Alertas que no fueron confirmadas</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <TrendingUp size={24} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500 font-medium">Tasa de Confirmación</p>
            <h3 className="text-2xl font-bold text-gray-800">{tasaConfirmacion}%</h3>
            <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${tasaConfirmacion}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* GRÁFICO DE BARRAS */}
      {alertasPorHectarea.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-800 mb-1">Alertas por Hectárea</h3>
          <p className="text-xs text-gray-400 mb-4">Total de notificaciones enviadas por zona</p>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={alertasPorHectarea} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hectarea" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
              <Tooltip
                formatter={(value, name) => {
                  const labels = { total: 'Total', confirmadas: 'Confirmadas', sinRespuesta: 'Sin respuesta' };
                  return [value, labels[name] || name];
                }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
              />
              <Bar dataKey="total" name="total" radius={[4, 4, 0, 0]}>
                {alertasPorHectarea.map((_, i) => (
                  <Cell key={i} fill={COLORES[i % COLORES.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
            {alertasPorHectarea.map((item, i) => (
              <div key={item.hectarea} className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: COLORES[i % COLORES.length] }} />
                <p className="text-xs font-bold text-gray-700">{item.hectarea}</p>
                <p className="text-xs text-gray-500">{item.total} alertas</p>
                <p className="text-xs text-emerald-600">{item.confirmadas} confirmadas</p>
                <p className="text-xs text-amber-600">{item.sinRespuesta} sin respuesta</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default Record;