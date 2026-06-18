// src/views/overview.jsx
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { useState, useEffect } from 'react';
import { AlertTriangle, Leaf, MapPin, ChevronLeft, X, User } from 'lucide-react';

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

const traducirRiesgo = (diagnostico) => {
  switch (diagnostico) {
    case 'Severe':   return 'Crítico';
    case 'Moderate': return 'Moderado';
    case 'Mild':     return 'Leve';
    default:         return diagnostico || '';
  }
};

// --- MODAL SELECTOR DE AGRICULTOR ---
const ModalAgricultor = ({ registro, onConfirmar, onCerrar }) => {
  const [agricultores, setAgricultores] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch('https://agrosmart-api-940420015515.us-central1.run.app/api/agricultores')
      .then(r => r.json())
      .then(data => {
        setAgricultores(data);
        if (data.length > 0) setSeleccionado(data[0]);
        setCargando(false);
      })
      .catch(() => setCargando(false));
  }, []);

  // Agrupar agricultores por área
  const agricultoresPorArea = agricultores.reduce((acc, a) => {
    const area = a.area || 'Sin área';
    if (!acc[area]) acc[area] = [];
    acc[area].push(a);
    return acc;
  }, {});

  const areasOrdenadas = Object.keys(agricultoresPorArea).sort();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Enviar alerta</h3>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Info del sector */}
        <div className="mb-4 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600">
          Sector: <span className="font-bold text-gray-800">{registro?.farm_id}</span>
          {' · '}
          Riesgo: <span className={`font-bold ${
            registro?.crop_disease_status === 'Severe' ? 'text-red-600' :
            registro?.crop_disease_status === 'Moderate' ? 'text-amber-500' :
            'text-yellow-500'
          }`}>
            {traducirRiesgo(registro?.crop_disease_status)}
          </span>
        </div>

        {/* Lista agrupada por área */}
        <p className="text-sm font-semibold text-gray-500 mb-2">Seleccionar agricultor:</p>

        {cargando ? (
          <p className="text-sm text-gray-400 py-4 text-center animate-pulse">
            Cargando agricultores...
          </p>
        ) : agricultores.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-sm text-amber-600 font-semibold">No hay agricultores registrados.</p>
            <p className="text-xs text-gray-400 mt-1">
              El agricultor debe enviar "join &lt;palabra&gt;" al Sandbox de Twilio primero.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-56 overflow-y-auto mb-4">
            {areasOrdenadas.map((area) => (
              <div key={area}>
                {/* Encabezado de área */}
                <div className="flex items-center gap-2 mb-1.5">
                  <MapPin size={12} className="text-green-600" />
                  <span className="text-xs font-bold text-green-700 uppercase tracking-wider">
                    {area}
                  </span>
                  <div className="flex-1 h-px bg-green-100" />
                </div>

                {/* Agricultores del área */}
                <div className="space-y-1.5 pl-1">
                  {agricultoresPorArea[area].map((a) => (
                    <button
                      key={a.telefono}
                      onClick={() => setSeleccionado(a)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                        seleccionado?.telefono === a.telefono
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <User size={16} className="text-green-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {a.nombre} {a.apellidos || ''}
                        </p>
                        <p className="text-xs text-gray-400">{a.telefono}</p>
                      </div>
                      {seleccionado?.telefono === a.telefono && (
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M1.5 5l2.5 2.5 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={onCerrar}
            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              if (seleccionado) {
                onConfirmar(registro, seleccionado.telefono);
                onCerrar();
              }
            }}
            disabled={!seleccionado || agricultores.length === 0}
            className="flex-1 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
          >
            Enviar alerta
          </button>
        </div>

      </div>
    </div>
  );
};

// --- COMPONENTE SELECTOR DE HECTÁREAS ---
const SelectorHectareas = ({ zonas, hectareaSeleccionada, setHectareaSeleccionada }) => {
  const { hectareas } = zonas;

  if (hectareas.length === 0) {
    return (
      <div className="mb-6 p-4 bg-white rounded-xl border shadow-sm text-sm text-gray-400">
        Cargando zonas activas...
      </div>
    );
  }

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
          className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
            hectareaSeleccionada === null
              ? 'bg-green-600 text-white border-green-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-600'
          }`}
        >
          Todas
        </button>
        {hectareasValidas.map((h) => (
          <button
            key={h}
            onClick={() => setHectareaSeleccionada(h === hectareaSeleccionada ? null : h)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
              hectareaSeleccionada === h
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

// --- GRID DE SUBSECTORES ---
const GridSubsectores = ({ sectores, parcelas, manejarAprobacionAlerta, onVolver, hectarea }) => {
  const [modalRegistro, setModalRegistro] = useState(null); // ✅ estado del modal
  const mapaUltimos = {};
  parcelas.forEach((p) => { mapaUltimos[p.farm_id] = p; });

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onVolver}
          className="flex items-center gap-1 text-sm text-green-600 hover:text-green-800 font-semibold transition-colors"
        >
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
            <div
              key={farmId}
              className={`p-3 rounded-xl border-2 flex flex-col justify-between gap-2 transition-shadow hover:shadow-md ${getBgSubsector(estado)}`}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-bold text-gray-700">{farmId}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getBadgeSubsector(estado)}`}>
                    {getLabelEstado(estado)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 space-y-0.5">
                  <p>NDVI: <span className="font-semibold text-gray-700">{ndvi}</span></p>
                  <p>Hum: <span className="font-semibold text-gray-700">{hum}%</span></p>
                </div>
              </div>

              {registro && ['Severe', 'Moderate', 'Mild'].includes(estado) ? (
                <button
                  onClick={() => setModalRegistro(registro)} // ✅ abre el modal
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

      {/* ✅ Modal selector de agricultor */}
      {modalRegistro && (
        <ModalAgricultor
          registro={modalRegistro}
          onCerrar={() => setModalRegistro(null)}
          onConfirmar={(registro, telefono) => manejarAprobacionAlerta(registro, telefono)}
        />
      )}
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

  const mapaSectores = {};
  datos.forEach((p) => { if (p.farm_id) mapaSectores[p.farm_id] = p; });
  const sectoresActuales = Object.values(mapaSectores);
  const totalSectores = sectoresActuales.length;

  let cultivoActual = "Varios";
  if (hectareaSeleccionada && sectoresActuales.length > 0) {
    cultivoActual = sectoresActuales[0].crop_type || "Desconocido";
  }

  const severeCount      = sectoresActuales.filter((p) => p.crop_disease_status === 'Severe').length;
  const mildCount        = sectoresActuales.filter((p) => ['Mild', 'Moderate'].includes(p.crop_disease_status)).length;
  const sectoresEnAlerta = severeCount + mildCount;
  const saludVegetal     = totalSectores > 0
    ? (sectoresActuales.reduce((acc, p) => acc + (Number(p.NDVI_index) || 0), 0) / totalSectores).toFixed(2)
    : '0.00';

  let nivelRiesgo = 'Bajo'; let colorRiesgo = 'text-green-600'; let bgRiesgo = 'bg-green-50';
  if (severeCount > 0)      { nivelRiesgo = 'Alto';  colorRiesgo = 'text-red-600';   bgRiesgo = 'bg-red-50'; }
  else if (mildCount > 0)   { nivelRiesgo = 'Medio'; colorRiesgo = 'text-amber-600'; bgRiesgo = 'bg-amber-50'; }

  const telemetriaMap = {};
  datos.forEach(p => {
    const min = p.fecha ? p.fecha.substring(0, 5) : 'N/A';
    if (!telemetriaMap[min]) telemetriaMap[min] = { count: 0, temp: 0, hum: 0 };
    telemetriaMap[min].temp  += Number(p.temperature_C   || 0);
    telemetriaMap[min].hum   += Number(p['humidity_%']   || 0);
    telemetriaMap[min].count += 1;
  });

  const telemetria = Object.keys(telemetriaMap).slice(-15).map(min => ({
    fecha:         min,
    temperature_C: Number((telemetriaMap[min].temp / telemetriaMap[min].count).toFixed(2)),
    humidity:      Number((telemetriaMap[min].hum  / telemetriaMap[min].count).toFixed(2)),
  }));

  const sectoresActivos = hectareaSeleccionada
    ? (zonas.sectores_por_hectarea[hectareaSeleccionada] || [])
    : [];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Dashboard Ejecutivo</h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-gray-500 text-sm">
              {hectareaSeleccionada
                ? `Mostrando: Hectárea ${hectareaSeleccionada}`
                : 'Monitoreo en tiempo real — global'}
            </p>
            {hectareaSeleccionada && (
              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                Cultivo: {cultivoActual}
              </span>
            )}
          </div>
        </div>
      </header>

      <SelectorHectareas
        zonas={zonas}
        hectareaSeleccionada={hectareaSeleccionada}
        setHectareaSeleccionada={setHectareaSeleccionada}
      />

      {hectareaSeleccionada && sectoresActivos.length > 0 && (
        <GridSubsectores
          sectores={sectoresActivos}
          parcelas={datos}
          manejarAprobacionAlerta={manejarAprobacionAlerta}
          onVolver={() => setHectareaSeleccionada(null)}
          hectarea={hectareaSeleccionada}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className={`${bgRiesgo} p-6 rounded-xl shadow-sm border flex items-start justify-between`}>
          <div>
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Nivel de Riesgo</p>
            <h3 className={`text-3xl font-bold mt-2 ${colorRiesgo}`}>{nivelRiesgo}</h3>
            <p className="text-xs text-gray-500 mt-2">
              {severeCount > 0 ? `${severeCount} críticas` : (mildCount > 0 ? `${mildCount} en alerta` : 'Todo estable')}
            </p>
          </div>
          <div className={`p-3 ${bgRiesgo} ${colorRiesgo} rounded-lg`}>
            <AlertTriangle size={24} />
          </div>
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
            <p className="text-xs text-gray-500 mt-2">
              {hectareaSeleccionada ? `Promedio Hectárea ${hectareaSeleccionada}` : 'Promedio global'}
            </p>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-lg"><Leaf size={24} /></div>
        </div>
      </div>
    </div>
  );
};

export default Overview;