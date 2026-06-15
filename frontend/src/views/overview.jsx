// src/views/overview.jsx
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import {  AlertTriangle, Leaf, MapPin, CloudRain, ChevronLeft } from 'lucide-react';

// --- HELPERS DE COLOR ---
const getBgSubsector = (estado) => {
  switch (estado) {
    case 'Severe':   return 'bg-white border-white shadow-md';
    case 'Moderate': return 'bg-white border-white shadow-md';
    case 'Mild':     return 'bg-white border-white shadow-md';
    default:         return 'bg-white border-white shadow-md';
  }
};

const getBadgeSubsector = (estado) => {
  switch (estado) {
    case 'Severe':   return 'bg-red-600 text-white';
    case 'Moderate': return 'bg-amber-500 text-white';
    case 'Mild':     return 'bg-yellow-400 text-gray-800';
    default:         return 'bg-green-600 text-white';
  }
};

const getLabelEstado = (estado) => {
  switch (estado) {
    case 'Severe':   return 'Crítico';
    case 'Moderate': return 'Moderado';
    case 'Mild':     return 'Leve';
    default:         return 'Sano';
  }
};

// --- COMPONENTE SELECTOR DE HECTÁREAS ---
const SelectorHectareas = ({ zonas, hectareaSeleccionada, setHectareaSeleccionada }) => {
  const { hectareas } = zonas;

  if (hectareas.length === 0) {
    return <div className="mb-6 p-4 bg-white rounded-xl border shadow-sm text-sm text-gray-400">Cargando zonas activas...</div>;
  }

  // FILTRO DE SEGURIDAD: Excluye cualquier registro que contenga la palabra "simul"
  const hectareasValidas = hectareas.filter(
    (h) => h && !h.toLowerCase().includes('simul')
  );

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <MapPin size={16} className="text-green-600" />
        <span className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
          Filtrar por hectárea
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setHectareaSeleccionada(null)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${hectareaSeleccionada === null ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-600'}`}
        >
          Todas
        </button>
        {hectareasValidas.map((h) => (
          <button
            key={h}
            onClick={() => setHectareaSeleccionada(h === hectareaSeleccionada ? null : h)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${hectareaSeleccionada === h ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-600'}`}
          >
            {h}
          </button>
        ))}
      </div>
    </div>
  );
};

// --- GRID DE SUBSECTORES ---
const GridSubsectores = ({ sectores, parcelas, manejarAprobacionAlerta, onVolver, hectarea }) => {
  const mapaUltimos = {};
  parcelas.forEach((p) => { mapaUltimos[p.farm_id] = p; });

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onVolver} className="flex items-center gap-1 text-sm text-green-600 hover:text-green-800 font-semibold transition-colors">
          <ChevronLeft size={16} /> Todas las hectáreas
        </button>
        <span className="text-gray-300">|</span>
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
          Hectárea {hectarea} — {sectores.length} sectores
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {sectores.map((farmId) => {
          const registro = mapaUltimos[farmId];
          const estado   = registro?.crop_disease_status || 'Healthy';
          const ndvi     = registro ? Number(registro.NDVI_index).toFixed(2) : '—';
          const hum      = registro ? Number(registro['humidity_%']).toFixed(1) : '—';

          return (
            <div key={farmId} className={`p-3 rounded-xl border-2 flex flex-col justify-between gap-2 transition-shadow hover:shadow-md ${getBgSubsector(estado)}`}>
              <div>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-bold text-gray-700">{farmId}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getBadgeSubsector(estado)}`}>{getLabelEstado(estado)}</span>
                </div>
                <div className="text-xs text-gray-500 space-y-0.5">
                  <p>NDVI: <span className="font-semibold text-gray-700">{ndvi}</span></p>
                  <p>Hum: <span className="font-semibold text-gray-700">{hum}%</span></p>
                </div>
              </div>

              {/* Botón de alerta - Ahora siempre visible pero deshabilitado si está Sano */}
              {registro && ['Severe', 'Moderate', 'Mild'].includes(estado) ? (
                <button
                 onClick={() => manejarAprobacionAlerta(registro)}
                 className="mt-2 flex w-full items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow transition-colors"
               >
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                   <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51h-.57c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487 2.98 1.285 2.98.866 3.524.815.545-.049 1.758-.718 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="white"/>
                   <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.551 4.17 1.597 5.991L0 24l6.237-1.612A11.96 11.96 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.986c-1.84 0-3.642-.472-5.26-1.365l-.377-.215-3.692.955.986-3.568-.242-.379A9.957 9.957 0 0 1 2.015 12C2.015 6.49 6.49 2.014 12 2.014c5.51 0 9.985 4.476 9.985 9.986 0 5.51-4.475 9.986-9.985 9.986z" fill="white"/>
                 </svg>
                 Enviar alerta
               </button>
              ) : (
                <div className="mt-2 flex w-full items-center justify-center bg-green-100 text-green-700 px-3 py-1.5 rounded-md text-xs font-semibold">
                  Cultivo Estable
                </div>
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

  // 1. DEDUPLICACIÓN PARA KPIs
  const mapaSectores = {};
  datos.forEach((p) => { if (p.farm_id) mapaSectores[p.farm_id] = p; });
  const sectoresActuales = Object.values(mapaSectores);
  const totalSectores = sectoresActuales.length;

  // Extraer el cultivo de la hectárea seleccionada
  let cultivoActual = "Varios";
  if (hectareaSeleccionada && sectoresActuales.length > 0) {
    cultivoActual = sectoresActuales[0].crop_type || "Desconocido";
  }

  // 2. MÉTRICAS
  const severeCount  = sectoresActuales.filter((p) => p.crop_disease_status === 'Severe').length;
  const mildCount    = sectoresActuales.filter((p) => ['Mild', 'Moderate'].includes(p.crop_disease_status)).length;
  const sectoresEnAlerta = severeCount + mildCount;
  const saludVegetal = totalSectores > 0 ? (sectoresActuales.reduce((acc, p) => acc + (Number(p.NDVI_index) || 0), 0) / totalSectores).toFixed(2) : '0.00';

  let nivelRiesgo = 'Bajo'; let colorRiesgo = 'text-green-600'; let bgRiesgo = 'bg-green-50';
  if (severeCount > 0) { nivelRiesgo = 'Alto'; colorRiesgo = 'text-red-600'; bgRiesgo = 'bg-red-50'; }
  else if (mildCount > 0) { nivelRiesgo = 'Medio'; colorRiesgo = 'text-amber-600'; bgRiesgo = 'bg-amber-50'; }

  // 3. TELEMETRÍA AGRUPADA POR MINUTO (Con promedios)
  const telemetriaMap = {};
  datos.forEach(p => {
    const min = p.fecha ? p.fecha.substring(0, 5) : 'N/A'; // Ej: "15:30"
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

  const sectoresActivos = hectareaSeleccionada ? (zonas.sectores_por_hectarea[hectareaSeleccionada] || []) : [];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Dashboard Ejecutivo</h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-gray-500 text-sm">
              {hectareaSeleccionada ? `Mostrando: Hectárea ${hectareaSeleccionada}` : 'Monitoreo en tiempo real — global'}
            </p>
            {/* AQUÍ MOSTRAMOS EL CULTIVO SI HAY UNA HECTÁREA SELECCIONADA */}
            {hectareaSeleccionada && (
              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                Cultivo: {cultivoActual}
              </span>
            )}
          </div>
        </div>

      </header>

      <SelectorHectareas zonas={zonas} hectareaSeleccionada={hectareaSeleccionada} setHectareaSeleccionada={setHectareaSeleccionada} />

      {hectareaSeleccionada && sectoresActivos.length > 0 && (
        <GridSubsectores sectores={sectoresActivos} parcelas={datos} manejarAprobacionAlerta={manejarAprobacionAlerta} onVolver={() => setHectareaSeleccionada(null)} hectarea={hectareaSeleccionada} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className={`${bgRiesgo} p-6 rounded-xl shadow-sm border flex items-start justify-between`}>
          <div>
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Nivel de Riesgo</p>
            <h3 className={`text-3xl font-bold mt-2 ${colorRiesgo}`}>{nivelRiesgo}</h3>
            <p className="text-xs text-gray-500 mt-2">{severeCount > 0 ? `${severeCount} críticas` : (mildCount > 0 ? `${mildCount} en alerta` : 'Todo estable')}</p>
          </div>
          <div className={`p-3 ${bgRiesgo} ${colorRiesgo} rounded-lg`}><AlertTriangle size={24} /></div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Sectores en Alerta</p>
            <h3 className="text-3xl font-bold text-amber-700 mt-2">{sectoresEnAlerta}</h3>
            <p className="text-xs text-gray-500 mt-2">de {totalSectores} sectores</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><MapPin size={24} /></div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Salud Vegetal (NDVI)</p>
            <h3 className="text-3xl font-bold text-green-700 mt-2">{saludVegetal}</h3>
            <p className="text-xs text-gray-500 mt-2">{hectareaSeleccionada ? `Promedio Hectárea ${hectareaSeleccionada}` : 'Promedio global'}</p>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-lg"><Leaf size={24} /></div>
        </div>
      </div>
    </div>
  );
};

export default Overview;