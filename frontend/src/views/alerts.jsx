import { useState, useMemo } from 'react';
import { CheckCircle, Send, Clock, Filter, X } from 'lucide-react';

const traducirRiesgo = (diagnostico) => {
  switch (diagnostico) {
    case 'Severe':   return 'Crítico';
    case 'Moderate': return 'Moderado';
    case 'Mild':     return 'Leve';
    default:         return diagnostico;
  }
};

const getBadgeRiesgo = (diagnostico) => {
  switch (diagnostico) {
    case 'Severe':   return 'bg-red-50 text-red-600';
    case 'Moderate': return 'bg-amber-50 text-amber-600';
    case 'Mild':     return 'bg-yellow-50 text-yellow-600';
    default:         return 'bg-gray-50 text-gray-600';
  }
};

const Alerts = ({ historialAlertas, manejarAprobacionAlerta, confirmarAlerta }) => {
  const [filtroFecha, setFiltroFecha] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroLote, setFiltroLote] = useState('todos');
  const [filtroDiagnostico, setFiltroDiagnostico] = useState('todos');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Opciones dinámicas de lotes
  const lotesUnicos = useMemo(() => {
    const lotes = [...new Set(historialAlertas.map(a => a.lote))].filter(Boolean).sort();
    return lotes;
  }, [historialAlertas]);

  // Filtrado
  const alertasFiltradas = useMemo(() => {
    const ahora = new Date();

    return historialAlertas.filter(alerta => {
      // Filtro fecha
      if (filtroFecha !== 'todos') {
        const fechaAlerta = new Date(alerta.fecha);
        if (filtroFecha === 'hoy') {
          const esHoy = fechaAlerta.toDateString() === ahora.toDateString();
          if (!esHoy) return false;
        } else if (filtroFecha === 'semana') {
          const hace7dias = new Date(ahora);
          hace7dias.setDate(ahora.getDate() - 7);
          if (fechaAlerta < hace7dias) return false;
        } else if (filtroFecha === 'mes') {
          const hace30dias = new Date(ahora);
          hace30dias.setDate(ahora.getDate() - 30);
          if (fechaAlerta < hace30dias) return false;
        }
      }

      // Filtro estado
      if (filtroEstado !== 'todos' && alerta.estado !== filtroEstado) return false;

      // Filtro lote
      if (filtroLote !== 'todos' && alerta.lote !== filtroLote) return false;

      // Filtro diagnóstico
      if (filtroDiagnostico !== 'todos' && alerta.diagnostico !== filtroDiagnostico) return false;

      return true;
    });
  }, [historialAlertas, filtroFecha, filtroEstado, filtroLote, filtroDiagnostico]);

  const hayFiltrosActivos = filtroFecha !== 'todos' || filtroEstado !== 'todos' || filtroLote !== 'todos' || filtroDiagnostico !== 'todos';

  const limpiarFiltros = () => {
    setFiltroFecha('todos');
    setFiltroEstado('todos');
    setFiltroLote('todos');
    setFiltroDiagnostico('todos');
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">

        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Historial de Alertas</h2>
            <p className="text-sm text-gray-500 mt-1">
              Registro de notificaciones enviadas a los agricultores
              {hayFiltrosActivos && (
                <span className="ml-2 text-green-600 font-semibold">
                  · {alertasFiltradas.length} resultado{alertasFiltradas.length !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hayFiltrosActivos && (
              <button
                onClick={limpiarFiltros}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 px-2 py-1 rounded-lg border border-gray-200 hover:border-red-200 transition-colors"
              >
                <X size={12} /> Limpiar filtros
              </button>
            )}
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                mostrarFiltros || hayFiltrosActivos
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'
              }`}
            >
              <Filter size={14} />
              Filtros {hayFiltrosActivos && `(${[filtroFecha, filtroEstado, filtroLote, filtroDiagnostico].filter(f => f !== 'todos').length})`}
            </button>
          </div>
        </div>

        {/* Panel de filtros */}
        {mostrarFiltros && (
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 grid grid-cols-2 md:grid-cols-4 gap-4">

            {/* Filtro fecha */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Fecha
              </label>
              <select
                value={filtroFecha}
                onChange={e => setFiltroFecha(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white focus:outline-none focus:border-green-400"
              >
                <option value="todos">Todas</option>
                <option value="hoy">Hoy</option>
                <option value="semana">Esta semana</option>
                <option value="mes">Este mes</option>
              </select>
            </div>

            {/* Filtro estado */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Estado
              </label>
              <select
                value={filtroEstado}
                onChange={e => setFiltroEstado(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white focus:outline-none focus:border-green-400"
              >
                <option value="todos">Todos</option>
                <option value="PENDING">Esperando</option>
                <option value="SUCCESS">Realizado</option>
                <option value="TIMEOUT">Timeout</option>
              </select>
            </div>

            {/* Filtro lote */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Lote
              </label>
              <select
                value={filtroLote}
                onChange={e => setFiltroLote(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white focus:outline-none focus:border-green-400"
              >
                <option value="todos">Todos</option>
                {lotesUnicos.map(lote => (
                  <option key={lote} value={lote}>{lote}</option>
                ))}
              </select>
            </div>

            {/* Filtro diagnóstico */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Diagnóstico
              </label>
              <select
                value={filtroDiagnostico}
                onChange={e => setFiltroDiagnostico(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white focus:outline-none focus:border-green-400"
              >
                <option value="todos">Todos</option>
                <option value="Severe">Crítico</option>
                <option value="Moderate">Moderado</option>
                <option value="Mild">Leve</option>
              </select>
            </div>

          </div>
        )}

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/50 text-gray-400 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">FECHA</th>
                <th className="px-6 py-4">LOTE</th>
                <th className="px-6 py-4">DIAGNÓSTICO</th>
                <th className="px-6 py-4">ACCIÓN</th>
                <th className="px-6 py-4 text-right">ESTADO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {alertasFiltradas.map((alerta) => (
                <tr
                  key={alerta.id}
                  className="hover:bg-gray-50 transition-colors"
                  onDoubleClick={() => confirmarAlerta(alerta.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">{alerta.fecha}</td>
                  <td className="px-6 py-4 font-medium text-gray-800">{alerta.lote}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getBadgeRiesgo(alerta.diagnostico)}`}>
                      {traducirRiesgo(alerta.diagnostico)}
                    </span>
                  </td>
                  <td className="px-6 py-4">{alerta.recomendacion}</td>
                  <td className="px-6 py-4 flex justify-end">

                    {alerta.estado === 'PENDING' && (
                      <span className="flex items-center gap-1 text-yellow-600 text-xs font-semibold px-3 py-1 bg-yellow-50 rounded-md border border-yellow-200">
                        <Clock size={14} className="animate-spin" /> Esperando...
                      </span>
                    )}

                    {alerta.estado === 'TIMEOUT' && (
                      <button
                        onClick={() => manejarAprobacionAlerta(
                          {
                            farm_id: alerta.lote,
                            crop_disease_status: alerta.diagnostico,
                            crop_type: alerta.cultivo
                          },
                          alerta.telefono
                        )}
                        className="flex items-center gap-1 text-white bg-red-500 border border-red-500 hover:bg-red-600 px-3 py-1 rounded-md text-sm font-semibold transition-colors"
                      >
                        <Send size={14} />
                        Reenviar
                      </button>
                    )}

                    {alerta.estado === 'SUCCESS' && (
                      <span className="flex items-center gap-1 text-emerald-600 text-sm font-bold">
                        <CheckCircle size={16} /> Realizado
                      </span>
                    )}

                  </td>
                </tr>
              ))}

              {alertasFiltradas.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                    {hayFiltrosActivos
                      ? 'No hay alertas que coincidan con los filtros seleccionados.'
                      : 'No hay alertas en el historial.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Alerts;