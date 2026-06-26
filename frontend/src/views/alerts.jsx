import React, { useState, useMemo, Fragment } from 'react';
import { CheckCircle, Send, Clock, Filter, X, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

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

// --- MINI CALENDARIO ---
const MiniCalendario = ({ fechaSeleccionada, onSeleccionar, onCerrar }) => {
  const hoy = new Date();
  const [mesVista, setMesVista] = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1));

  const diasEnMes = new Date(mesVista.getFullYear(), mesVista.getMonth() + 1, 0).getDate();
  const primerDia = new Date(mesVista.getFullYear(), mesVista.getMonth(), 1).getDay();

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const diasSemana = ['Do','Lu','Ma','Mi','Ju','Vi','Sá'];

  const mesAnterior = () => setMesVista(new Date(mesVista.getFullYear(), mesVista.getMonth() - 1, 1));
  const mesSiguiente = () => setMesVista(new Date(mesVista.getFullYear(), mesVista.getMonth() + 1, 1));

  const formatoFecha = (d) => {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  };

  const celdas = [];
  for (let i = 0; i < primerDia; i++) celdas.push(null);
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d);

  return (
    <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 w-72">
      <div className="flex justify-between items-center mb-3">
        <button onClick={mesAnterior} className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 font-bold">‹</button>
        <span className="text-sm font-bold text-gray-800">{meses[mesVista.getMonth()]} {mesVista.getFullYear()}</span>
        <button onClick={mesSiguiente} className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 font-bold">›</button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {diasSemana.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {celdas.map((dia, i) => {
          if (!dia) return <div key={`empty-${i}`} />;
          const fechaStr = formatoFecha(new Date(mesVista.getFullYear(), mesVista.getMonth(), dia));
          const esSeleccionado = fechaSeleccionada === fechaStr;
          const esHoy = formatoFecha(hoy) === fechaStr;
          return (
            <button
              key={dia}
              onClick={() => { onSeleccionar(fechaStr); onCerrar(); }}
              className={`text-xs rounded-lg py-1.5 font-medium transition-colors ${
                esSeleccionado ? 'bg-green-600 text-white' :
                esHoy ? 'bg-green-50 text-green-700 font-bold' :
                'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {dia}
            </button>
          );
        })}
      </div>
      {fechaSeleccionada && (
        <button
          onClick={() => { onSeleccionar(null); onCerrar(); }}
          className="mt-3 w-full text-xs text-gray-400 hover:text-red-500 transition-colors text-center"
        >
          Limpiar fecha exacta
        </button>
      )}
    </div>
  );
};

const ALERTAS_POR_PAGINA = 10;

const Alerts = ({ historialAlertas, manejarAprobacionAlerta, confirmarAlerta }) => {
  const [filtroFecha, setFiltroFecha] = useState('todos');
  const [fechaExacta, setFechaExacta] = useState(null);
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroLote, setFiltroLote] = useState('todos');
  const [filtroDiagnostico, setFiltroDiagnostico] = useState('todos');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);

  const hectareasUnicas = useMemo(() => {
    const hectareas = historialAlertas.map(a => a.lote?.split('_')[0]).filter(Boolean);
    return [...new Set(hectareas)].sort();
  }, [historialAlertas]);

  const alertasFiltradas = useMemo(() => {
    const ahora = new Date();
    return historialAlertas.filter(alerta => {
      let fechaAlerta;
      if (alerta.fechaISO) {
        fechaAlerta = new Date(alerta.fechaISO);
      } else if (alerta.fecha) {
        const partes = String(alerta.fecha).match(
          /(\d+)\/(\d+)\/(\d+),?\s+(\d+):(\d+):(\d+)\s*(a\.m\.|p\.m\.)/i
        );
        if (partes) {
          const [, dia, mes, anio, h, min, seg, ampm] = partes;
          let hora = parseInt(h);
          if (ampm.toLowerCase().includes('p') && hora !== 12) hora += 12;
          if (ampm.toLowerCase().includes('a') && hora === 12) hora = 0;
          fechaAlerta = new Date(anio, mes - 1, dia, hora, min, seg);
        } else {
          fechaAlerta = new Date(alerta.fecha);
        }
      }

      if (!fechaAlerta || isNaN(fechaAlerta.getTime())) return true;

      if (fechaExacta) {
        const yyyy = fechaAlerta.getFullYear();
        const mm = String(fechaAlerta.getMonth() + 1).padStart(2, '0');
        const dd = String(fechaAlerta.getDate()).padStart(2, '0');
        if (`${yyyy}-${mm}-${dd}` !== fechaExacta) return false;
      } else if (filtroFecha !== 'todos') {
        if (filtroFecha === 'hoy') {
          if (fechaAlerta.toDateString() !== ahora.toDateString()) return false;
        } else if (filtroFecha === 'semana') {
          const inicioSemana = new Date(ahora);
          const diaSemana = ahora.getDay() === 0 ? 6 : ahora.getDay() - 1;
          inicioSemana.setDate(ahora.getDate() - diaSemana);
          inicioSemana.setHours(0, 0, 0, 0);
          if (fechaAlerta < inicioSemana) return false;
        } else if (filtroFecha === 'mes') {
          if (fechaAlerta.getMonth() !== ahora.getMonth() ||
              fechaAlerta.getFullYear() !== ahora.getFullYear()) return false;
        }
      }

      if (filtroEstado !== 'todos' && alerta.estado !== filtroEstado) return false;
      if (filtroLote !== 'todos' && !alerta.lote?.startsWith(filtroLote)) return false;
      if (filtroDiagnostico !== 'todos' && alerta.diagnostico !== filtroDiagnostico) return false;

      return true;
    });
  }, [historialAlertas, filtroFecha, fechaExacta, filtroEstado, filtroLote, filtroDiagnostico]);

  const totalPaginas = Math.ceil(alertasFiltradas.length / ALERTAS_POR_PAGINA);
  const alertasPagina = alertasFiltradas.slice(
    (paginaActual - 1) * ALERTAS_POR_PAGINA,
    paginaActual * ALERTAS_POR_PAGINA
  );

  const hayFiltrosActivos = filtroFecha !== 'todos' || fechaExacta || filtroEstado !== 'todos' || filtroLote !== 'todos' || filtroDiagnostico !== 'todos';

  const limpiarFiltros = () => {
    setFiltroFecha('todos');
    setFechaExacta(null);
    setFiltroEstado('todos');
    setFiltroLote('todos');
    setFiltroDiagnostico('todos');
    setPaginaActual(1);
  };

  const seleccionarPill = (valor) => {
    setFiltroFecha(valor);
    setFechaExacta(null);
    setPaginaActual(1);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen rounded-3xl">
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
              Filtros {hayFiltrosActivos && `(${[filtroFecha !== 'todos', fechaExacta, filtroEstado !== 'todos', filtroLote !== 'todos', filtroDiagnostico !== 'todos'].filter(Boolean).length})`}
            </button>
          </div>
        </div>

        {/* Panel de filtros */}
        {mostrarFiltros && (
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Fecha</label>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { label: 'Todas', valor: 'todos' },
                  { label: 'Hoy', valor: 'hoy' },
                  { label: 'Esta semana', valor: 'semana' },
                  { label: 'Este mes', valor: 'mes' },
                ].map(({ label, valor }) => (
                  <button
                    key={valor}
                    onClick={() => seleccionarPill(valor)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      filtroFecha === valor && !fechaExacta
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
                <div className="relative">
                  <button
                    onClick={() => setMostrarCalendario(!mostrarCalendario)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      fechaExacta
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-600'
                    }`}
                  >
                    <Calendar size={12} />
                    {fechaExacta ? fechaExacta : 'Fecha exacta'}
                  </button>
                  {mostrarCalendario && (
                    <MiniCalendario
                      fechaSeleccionada={fechaExacta}
                      onSeleccionar={(f) => { setFechaExacta(f); if (f) { setFiltroFecha('todos'); setPaginaActual(1); } }}
                      onCerrar={() => setMostrarCalendario(false)}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Estado</label>
                <select
                  value={filtroEstado}
                  onChange={e => { setFiltroEstado(e.target.value); setPaginaActual(1); }}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white focus:outline-none focus:border-green-400"
                >
                  <option value="todos">Todos</option>
                  <option value="SUCCESS">Realizado</option>
                  <option value="TIMEOUT">Sin respuesta</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Lote</label>
                <select
                  value={filtroLote}
                  onChange={e => { setFiltroLote(e.target.value); setPaginaActual(1); }}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white focus:outline-none focus:border-green-400"
                >
                  <option value="todos">Todos</option>
                  {hectareasUnicas.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Diagnóstico</label>
                <select
                  value={filtroDiagnostico}
                  onChange={e => { setFiltroDiagnostico(e.target.value); setPaginaActual(1); }}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white focus:outline-none focus:border-green-400"
                >
                  <option value="todos">Todos</option>
                  <option value="Severe">Crítico</option>
                  <option value="Moderate">Moderado</option>
                  <option value="Mild">Leve</option>
                </select>
              </div>
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
              {alertasPagina.map((alerta) => (
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
                          { farm_id: alerta.lote, crop_disease_status: alerta.diagnostico, crop_type: alerta.cultivo },
                          alerta.telefono
                        )}
                        className="flex items-center gap-1 text-white bg-amber-600 border border-amber-700 hover:bg-amber-700 px-3 py-1 rounded-md text-sm font-semibold transition-colors"
                      >
                        <Send size={14} /> Reenviar
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

        {/* Paginado Truncado */}
        {totalPaginas > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Mostrando {(paginaActual - 1) * ALERTAS_POR_PAGINA + 1}–{Math.min(paginaActual * ALERTAS_POR_PAGINA, alertasFiltradas.length)} de {alertasFiltradas.length} alertas
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} className="text-gray-600" />
              </button>

              {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                .filter(num => num === 1 || num === totalPaginas || (num >= paginaActual - 1 && num <= paginaActual + 1))
                .map((num, i, arr) => (
                  <Fragment key={num}>
                    {i > 0 && arr[i - 1] !== num - 1 && (
                      <span className="px-2 text-gray-400">...</span>
                    )}
                    <button
                      onClick={() => setPaginaActual(num)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold border transition-colors ${
                        paginaActual === num
                          ? 'bg-green-600 text-white border-green-600'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {num}
                    </button>
                  </Fragment>
                ))}

              <button
                onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual === totalPaginas}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={14} className="text-gray-600" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Alerts;