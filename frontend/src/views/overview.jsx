// src/views/overview.jsx
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Activity, AlertTriangle, Leaf, MapPin, CloudRain, ChevronLeft } from 'lucide-react';
import ManualPrediction from '../components/ui/ManualPrediction.jsx';

// --- HELPERS DE COLOR PARA EL MODELO GUARDIAN ---

// Color de fondo de la tarjeta de subsector segun la prediccion del Guardian
const getBgSubsector = (estado) => {
  switch (estado) {
    case 'Severe':   return 'bg-red-50 border-red-300';
    case 'Moderate': return 'bg-amber-50 border-amber-300';
    case 'Mild':     return 'bg-yellow-50 border-yellow-200';
    default:         return 'bg-green-50 border-green-200';
  }
};

// Badge de texto dentro de la tarjeta
const getBadgeSubsector = (estado) => {
  switch (estado) {
    case 'Severe':   return 'bg-red-600 text-white';
    case 'Moderate': return 'bg-amber-500 text-white';
    case 'Mild':     return 'bg-yellow-400 text-gray-800';
    default:         return 'bg-green-600 text-white';
  }
};

// Color de borde izquierdo en la lista de parcelas
const getColorEstado = (estado) => {
  switch (estado) {
    case 'Severe':   return '#dc2626';
    case 'Moderate': return '#f59e0b';
    case 'Mild':     return '#eab308';
    default:         return '#16a34a';
  }
};

// Etiqueta legible del estado
const getLabelEstado = (estado) => {
  switch (estado) {
    case 'Severe':   return 'Critico';
    case 'Moderate': return 'Moderado';
    case 'Mild':     return 'Leve';
    default:         return 'Sano';
  }
};


// --- COMPONENTE SELECTOR DE HECTAREAS ---

const SelectorHectareas = ({ zonas, hectareaSeleccionada, setHectareaSeleccionada }) => {
  const { hectareas } = zonas;

  if (hectareas.length === 0) {
    return (
      <div className="mb-6 p-4 bg-white rounded-xl border border-gray-100 shadow-sm text-sm text-gray-400">
        Cargando zonas activas...
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <MapPin size={16} className="text-green-600" />
        <span className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
          Filtrar por hectarea
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Boton "Todas" */}
        <button
          onClick={() => setHectareaSeleccionada(null)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors
            ${hectareaSeleccionada === null
              ? 'bg-green-600 text-white border-green-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-600'
            }`}
        >
          Todas
        </button>

        {hectareas.map((h) => (
          <button
            key={h}
            onClick={() => setHectareaSeleccionada(h === hectareaSeleccionada ? null : h)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors
              ${hectareaSeleccionada === h
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-600'
              }`}
          >
            {h}
          </button>
        ))}
      </div>
    </div>
  );
};


// --- COMPONENTE GRID DE SUBSECTORES ---
// Muestra los 10 sectores de la hectarea seleccionada como tarjetas con color
// segun la ultima prediccion del Modelo Guardian.

const GridSubsectores = ({ sectores, parcelas, manejarAprobacionAlerta, onVolver, hectarea }) => {
  // Construimos un mapa farm_id -> ultimo registro para consulta rapida
  const mapaUltimos = {};
  parcelas.forEach((p) => {
    // Como los datos vienen ordenados ascendente, el ultimo sobrescribe
    mapaUltimos[p.farm_id] = p;
  });

  return (
    <div className="mb-6">
      {/* Header del grid con boton de regreso */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onVolver}
          className="flex items-center gap-1 text-sm text-green-600 hover:text-green-800 font-semibold transition-colors"
        >
          <ChevronLeft size={16} />
          Todas las hectareas
        </button>
        <span className="text-gray-300">|</span>
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
          Hectarea {hectarea} — {sectores.length} sectores
        </h3>
      </div>

      {/* Grid 5x2 de tarjetas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {sectores.map((farmId) => {
          const registro = mapaUltimos[farmId];
          const estado   = registro?.crop_disease_status || 'Healthy';
          const ndvi     = registro ? Number(registro.NDVI_index).toFixed(2) : '—';
          const hum      = registro ? Number(registro['humidity_%']).toFixed(1) : '—';

          return (
            <div
              key={farmId}
              className={`p-3 rounded-xl border-2 flex flex-col gap-2 transition-shadow hover:shadow-md ${getBgSubsector(estado)}`}
            >
              {/* ID del sector */}
              <div className="flex justify-between items-start">
                <p className="text-xs font-bold text-gray-700">{farmId}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getBadgeSubsector(estado)}`}>
                  {getLabelEstado(estado)}
                </span>
              </div>

              {/* Metricas rapidas */}
              <div className="text-xs text-gray-500 space-y-0.5">
                <p>NDVI: <span className="font-semibold text-gray-700">{ndvi}</span></p>
                <p>Hum: <span className="font-semibold text-gray-700">{hum}%</span></p>
              </div>

              {/* Boton de alerta solo si hay riesgo */}
              {registro && ['Severe', 'Moderate', 'Mild'].includes(estado) && (
                <button
                  onClick={() => manejarAprobacionAlerta(registro)}
                  className="mt-1 text-xs bg-[#25D366] hover:bg-green-600 text-white py-1 rounded-lg font-semibold transition-colors"
                >
                  Alertar
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};


// --- COMPONENTE PRINCIPAL ---

const Overview = ({
  parcelas = [],
  manejarAprobacionAlerta,
  zonas = { hectareas: [], sectores_por_hectarea: {} },
  hectareaSeleccionada,
  setHectareaSeleccionada,
}) => {
  const datos = parcelas || [];

  // Metricas globales (o de la hectarea seleccionada segun los datos recibidos)
  const parcelasEnAlerta = datos.filter(
    (p) => p.crop_disease_status === 'Mild' || p.crop_disease_status === 'Severe'
  ).length;

  const saludVegetal = datos.length > 0
    ? (datos.reduce((acc, p) => acc + (Number(p.NDVI_index) || 0), 0) / datos.length).toFixed(2)
    : '0.00';

  const severeCount  = datos.filter((p) => p.crop_disease_status === 'Severe').length;
  const mildCount    = datos.filter((p) => ['Mild', 'Moderate'].includes(p.crop_disease_status)).length;
  const healthyCount = datos.length - severeCount - mildCount;

  let nivelRiesgo = 'Bajo';
  let colorRiesgo = 'text-green-600';
  let bgRiesgo    = 'bg-green-50';
  if (severeCount > 0) {
    nivelRiesgo = 'Alto';   colorRiesgo = 'text-red-600';   bgRiesgo = 'bg-red-50';
  } else if (mildCount > 0) {
    nivelRiesgo = 'Medio';  colorRiesgo = 'text-amber-600'; bgRiesgo = 'bg-amber-50';
  }

  // Datos para el grafico de telemetria (ultimos 20 registros de la zona activa)
  const telemetria = datos.slice(-20).map((p) => ({
    fecha:         p.fecha || 'N/A',
    temperature_C: Number(p.temperature_C) || 0,
    humidity:      Number(p['humidity_%']) || 0,
  }));

  // Sectores activos de la hectarea seleccionada (para el grid)
  const sectoresActivos = hectareaSeleccionada
    ? (zonas.sectores_por_hectarea[hectareaSeleccionada] || [])
    : [];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Dashboard Ejecutivo</h2>
          <p className="text-gray-500 text-sm">
            {hectareaSeleccionada
              ? `Mostrando: Hectarea ${hectareaSeleccionada}`
              : 'Monitoreo en tiempo real — todas las hectareas'}
          </p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
          <Activity className="text-blue-500" size={28} />
          <div>
            <p className="text-sm font-semibold text-gray-800">Conexion IoT</p>
            <p className="text-xs text-green-500 font-bold">En linea (Sincronizado)</p>
          </div>
        </div>
      </header>

      {/* SELECTOR DE HECTAREAS */}
      <SelectorHectareas
        zonas={zonas}
        hectareaSeleccionada={hectareaSeleccionada}
        setHectareaSeleccionada={setHectareaSeleccionada}
      />

      {/* GRID DE SUBSECTORES (solo visible cuando hay hectarea seleccionada) */}
      {hectareaSeleccionada && sectoresActivos.length > 0 && (
        <GridSubsectores
          sectores={sectoresActivos}
          parcelas={datos}
          manejarAprobacionAlerta={manejarAprobacionAlerta}
          onVolver={() => setHectareaSeleccionada(null)}
          hectarea={hectareaSeleccionada}
        />
      )}

      {/* TARJETAS DE METRICAS GLOBALES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        <div className={`${bgRiesgo} p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between`}>
          <div>
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Nivel de Riesgo</p>
            <h3 className={`text-3xl font-bold mt-2 ${colorRiesgo}`}>{nivelRiesgo}</h3>
            <p className="text-xs text-gray-500 mt-2">
              {severeCount > 0 && `${severeCount} criticas`}
              {mildCount > 0  && ` · ${mildCount} en alerta`}
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
            <p className="text-xs text-gray-500 mt-2">de {datos.length} registros</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <MapPin size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Salud Vegetal (NDVI)</p>
            <h3 className="text-3xl font-bold text-green-700 mt-2">{saludVegetal}</h3>
            <p className="text-xs text-gray-500 mt-2">
              {hectareaSeleccionada ? `Promedio Hectarea ${hectareaSeleccionada}` : 'Promedio global'}
            </p>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <Leaf size={24} />
          </div>
        </div>
      </div>

      {/* SIMULADOR MANUAL */}
      <div className="mb-8">
        <ManualPrediction />
      </div>

      {/* GRAFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">

        {/* LISTA DE PARCELAS */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="mb-4">
            <h4 className="text-lg font-bold text-gray-800">Mapa de Calor Epidemiologico</h4>
            <p className="text-xs text-gray-400">
              {hectareaSeleccionada
                ? `Parcelas de la Hectarea ${hectareaSeleccionada}`
                : 'Todas las parcelas por estado sanitario'}
            </p>
          </div>
          <div className="h-80 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-4 flex flex-col justify-center">
            {datos.length > 0 ? (
              <div className="space-y-3 overflow-y-auto max-h-72">
                {datos.map((p, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-3 rounded-lg border-l-4 flex justify-between items-center text-xs"
                    style={{ borderLeftColor: getColorEstado(p.crop_disease_status) }}
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{p.farm_id}</p>
                      <p className="text-gray-400">{p.crop_type}</p>
                    </div>
                    <span
                      className="inline-block px-2 py-1 rounded text-white text-xs font-bold"
                      style={{ backgroundColor: getColorEstado(p.crop_disease_status) }}
                    >
                      {getLabelEstado(p.crop_disease_status)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <MapPin size={40} className="mx-auto mb-2 opacity-50" />
                <p>
                  {hectareaSeleccionada
                    ? `Sin datos para Hectarea ${hectareaSeleccionada}`
                    : 'Cargando parcelas...'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* TELEMETRIA — los datos ya vienen filtrados por hectarea desde la API */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="mb-4">
            <h4 className="text-lg font-bold text-gray-800">Telemetria Predictiva</h4>
            <p className="text-xs text-gray-400">
              {hectareaSeleccionada
                ? `Temp. y humedad — Hectarea ${hectareaSeleccionada}`
                : 'Temperatura y humedad — todas las hectareas'}
            </p>
          </div>
          {telemetria.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={telemetria}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line yAxisId="left" type="monotone" dataKey="temperature_C" stroke="#ef4444" name="Temp. (C)" strokeWidth={2} dot={false} />
                  <Line yAxisId="left" type="monotone" dataKey="humidity"      stroke="#3b82f6" name="Humedad (%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <CloudRain size={40} className="mx-auto mb-2 opacity-50" />
                <p>Cargando telemetria...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PANEL DE TAREAS Y DONA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* PANEL DE TAREAS */}
        <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="mb-4 flex justify-between items-center">
            <div>
              <h4 className="text-lg font-bold text-gray-800">Panel de Tareas</h4>
              <p className="text-xs text-gray-400">Tareas criticas generadas por los modelos</p>
            </div>
            <div className="text-xs text-gray-500">Click en Enviar</div>
          </div>

          {(() => {
            const emergencias = datos.filter((r) =>
              ['Severe', 'Mild', 'Moderate'].includes(r.crop_disease_status)
            );

            if (!emergencias.length)
              return (
                <div className="py-12 text-center text-gray-400">
                  Sin alertas criticas en la zona seleccionada.
                </div>
              );

            return (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
                {emergencias.map((e, idx) => {
                  const color =
                    e.crop_disease_status === 'Severe'   ? 'bg-red-600'   :
                    e.crop_disease_status === 'Moderate' ? 'bg-amber-500' : 'bg-yellow-500';

                  return (
                    <div key={idx} className="bg-white rounded-lg shadow-sm border p-4 flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`w-3 h-12 rounded-lg ${color} mr-1`} />
                        <div>
                          <h5 className="font-bold text-gray-800">
                            {e.crop_disease_status === 'Severe'   ? 'Emergencia: '   :
                             e.crop_disease_status === 'Moderate' ? 'Advertencia: '  : 'Aviso: '}
                            {e.crop_type} — {e.farm_id}
                          </h5>
                          <p className="text-xs text-gray-500 mt-1">Plaga / dano critico detectado.</p>
                          <div className="mt-2 text-xs text-gray-600">
                            <span className="mr-3 font-semibold">NDVI: </span>
                            {typeof e.NDVI_index === 'number' ? e.NDVI_index.toFixed(2) : '—'}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => manejarAprobacionAlerta(e)}
                          className="flex items-center gap-2 bg-[#25D366] hover:bg-green-600 text-white px-3 py-2 rounded-md text-sm font-semibold shadow transition-colors"
                        >
                          {/* Icono WhatsApp inline */}
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51h-.57c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487 2.98 1.285 2.98.866 3.524.815.545-.049 1.758-.718 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="white"/>
                            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.551 4.17 1.597 5.991L0 24l6.237-1.612A11.96 11.96 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.986c-1.84 0-3.642-.472-5.26-1.365l-.377-.215-3.692.955.986-3.568-.242-.379A9.957 9.957 0 0 1 2.015 12C2.015 6.49 6.49 2.014 12 2.014c5.51 0 9.985 4.476 9.985 9.986 0 5.51-4.475 9.986-9.985 9.986z" fill="white"/>
                          </svg>
                          Enviar
                        </button>
                        <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs transition-colors">
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

        {/* DONA DE ESTADO DE SECTORES */}
        <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="mb-4">
            <h4 className="text-lg font-bold text-gray-800">Estado de Sectores</h4>
            <p className="text-xs text-gray-400">
              {hectareaSeleccionada
                ? `Hectarea ${hectareaSeleccionada}`
                : 'Distribucion global'}
            </p>
          </div>

          {(() => {
            const data = [
              { name: 'Saludable',       value: healthyCount },
              { name: 'En Observacion',  value: mildCount    },
              { name: 'Critico',         value: severeCount  },
            ];
            const COLORS = ['#16a34a', '#f59e0b', '#dc2626'];

            return (
              <div className="flex flex-col items-center justify-center">
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={data} dataKey="value" nameKey="name" innerRadius={56} outerRadius={90} paddingAngle={2}>
                        {data.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-sm text-gray-600 space-y-1">
                  <div><span className="inline-block w-3 h-3 bg-green-600 mr-2 rounded-full" />Saludable: {healthyCount}</div>
                  <div><span className="inline-block w-3 h-3 bg-yellow-500 mr-2 rounded-full" />En Observacion: {mildCount}</div>
                  <div><span className="inline-block w-3 h-3 bg-red-600 mr-2 rounded-full" />Critico: {severeCount}</div>
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