// src/views/overview.jsx

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
    case 'Mild':     return 'bg-green-600 text-white';
    default:         return 'bg-green-600 text-white';
  }
};

const getLabelEstado = (estado) => {
  switch (estado) {
    case 'Severe':   return 'Crítico';
    case 'Moderate': return 'Moderado';
    case 'Mild':     return 'Sano';
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

// --- SALUDO SEGÚN HORA ---
const getSaludo = () => {
  const hora = new Date().getHours();
  if (hora >= 5 && hora < 12)  return 'Buenos días';
  if (hora >= 12 && hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

// --- FECHA EN ESPAÑOL ---
const getFechaFormateada = () => {
  return new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// --- HERO DE BIENVENIDA ---
const HeroBienvenida = () => {
  const saludo   = getSaludo();
  const fecha    = getFechaFormateada();
  const nombre   = 'Jefe de producción';

  return (
    <div className="relative w-full rounded-2xl overflow-hidden mb-8 h-52 md:h-60">
      {/* Imagen de fondo */}
      <img
        src="https://i.pinimg.com/1200x/50/d3/6d/50d36d2f4ed564da4ae15a2aa94ae02b.jpg"
        alt="Campo agrícola"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay degradado */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/40 to-transparent" />

      {/* Contenido */}
      <div className="relative z-10 h-full flex flex-col justify-center px-8 py-6">
        <p className="text-white/70 text-sm font-medium tracking-widest uppercase mb-1">
          {fecha}
        </p>
        <h1 className="text-white text-3xl md:text-4xl font-bold leading-tight mb-2">
          {saludo}, {nombre} 👋
        </h1>
        <p className="text-white/80 text-sm md:text-base max-w-md leading-relaxed">
          Selecciona una hectárea para explorar sus sectores.
        </p>
      </div>

      {/* Badge live */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/25 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        En vivo
      </div>
    </div>
  );
};

// --- MODAL SELECTOR DE AGRICULTOR ---
const ModalAgricultor = ({ registro, onConfirmar, onCerrar }) => {
  const [agricultores, setAgricultores]   = useState([]);
  const [seleccionado, setSeleccionado]   = useState(null);
  const [cargando, setCargando]           = useState(true);

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
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Enviar alerta</h3>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600">
          Sector: <span className="font-bold text-gray-800">{registro?.farm_id}</span>
          {' · '}
          Riesgo: <span className={`font-bold ${
            registro?.crop_disease_status === 'Severe'   ? 'text-red-600'   :
            registro?.crop_disease_status === 'Moderate' ? 'text-amber-500' :
            'text-yellow-500'
          }`}>
            {traducirRiesgo(registro?.crop_disease_status)}
          </span>
        </div>

        <p className="text-sm font-semibold text-gray-500 mb-2">Seleccionar agricultor:</p>

        {cargando ? (
          <p className="text-sm text-gray-400 py-4 text-center animate-pulse">Cargando agricultores...</p>
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
                <div className="flex items-center gap-2 mb-1.5">
                  <MapPin size={12} className="text-green-600" />
                  <span className="text-xs font-bold text-green-700 uppercase tracking-wider">{area}</span>
                  <div className="flex-1 h-px bg-green-100" />
                </div>
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

// --- BANNER DE HECTÁREA SELECCIONADA ---
const IMAGENES_CULTIVO = {
  'Maíz':    'https://i.pinimg.com/1200x/ee/28/ed/ee28edb03efcb3ab9302a76a0af8b2e3.jpg',
  'Trigo':   'https://i.pinimg.com/1200x/d5/e2/a4/d5e2a4205111236d3c20b71ee832a844.jpg',
  'Arroz':   'https://i.pinimg.com/1200x/70/9e/05/709e05562f3a71cf882777c043713450.jpg',
  'Soja':    'https://i.pinimg.com/1200x/a5/2a/76/a52a7642966856313a10bac8766036a5.jpg',
  'Algodón': 'https://i.pinimg.com/736x/8c/ae/63/8cae638bf968e8f4e989f615518d47d0.jpg',
  'default': 'https://i.pinimg.com/1200x/50/d3/6d/50d36d2f4ed564da4ae15a2aa94ae02b.jpg',
};

const BannerHectarea = ({ hectarea, cultivoActual, totalSectores, onVolver }) => {
  const imagenUrl = IMAGENES_CULTIVO[cultivoActual] || IMAGENES_CULTIVO.default;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden mb-6 h-36 md:h-44">
      <img
        src={imagenUrl}
        alt={`Cultivo ${cultivoActual}`}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-transparent" />

      <div className="relative z-10 h-full flex flex-col justify-center px-7 py-5">
        <button
          onClick={onVolver}
          className="flex items-center gap-1 text-white/70 hover:text-white text-xs font-semibold mb-2 transition-colors w-fit"
        >
          <ChevronLeft size={14} /> Todas las hectáreas
        </button>
        <h2 className="text-white text-2xl md:text-3xl font-bold leading-tight">
          Hectárea {hectarea}
        </h2>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-white/80 text-sm">{totalSectores} sectores activos</span>
          <span className="w-1 h-1 rounded-full bg-white/40" />
          <span className="text-white/80 text-sm capitalize">{cultivoActual}</span>
        </div>
      </div>

      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/25 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        En vivo
      </div>
    </div>
  );
};

// --- GRID DE SUBSECTORES ---
const GridSubsectores = ({ sectores, parcelas, manejarAprobacionAlerta }) => {
  const [modalRegistro, setModalRegistro] = useState(null);
  const mapaUltimos = {};
  parcelas.forEach((p) => { mapaUltimos[p.farm_id] = p; });

  return (
    <div className="mb-6">
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

              {registro && ['Severe', 'Moderate'].includes(estado) ? (
                <button
                  onClick={() => setModalRegistro(registro)}
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
  usuario = null,
}) => {
  const datos = parcelas || [];

  const mapaSectores = {};
  datos.forEach((p) => { if (p.farm_id) mapaSectores[p.farm_id] = p; });
  const sectoresActuales    = Object.values(mapaSectores);
  const totalSectores       = sectoresActuales.length;

  let cultivoActual = 'Varios';
  if (hectareaSeleccionada) {
    const primerSectorHectarea = sectoresActuales.find(
      (p) => p.farm_id && p.farm_id.startsWith(hectareaSeleccionada + '_')
    );
    cultivoActual = primerSectorHectarea?.crop_type || 'Desconocido';
  }

  const severeCount      = sectoresActuales.filter((p) => p.crop_disease_status === 'Severe').length;
  const mildCount        = sectoresActuales.filter((p) => ['Mild', 'Moderate'].includes(p.crop_disease_status)).length;
  const sectoresEnAlerta = severeCount + mildCount;
  const saludVegetal     = totalSectores > 0
    ? (sectoresActuales.reduce((acc, p) => acc + (Number(p.NDVI_index) || 0), 0) / totalSectores).toFixed(2)
    : '0.00';

  let nivelRiesgo = 'Bajo'; let colorRiesgo = 'text-green-600'; let bgRiesgo = 'bg-green-50';
  if (severeCount > 0)    { nivelRiesgo = 'Alto';  colorRiesgo = 'text-red-600';   bgRiesgo = 'bg-red-50'; }
  else if (mildCount > 0) { nivelRiesgo = 'Medio'; colorRiesgo = 'text-amber-600'; bgRiesgo = 'bg-amber-50'; }

  const sectoresActivos = hectareaSeleccionada
    ? (zonas.sectores_por_hectarea[hectareaSeleccionada] || [])
    : [];

  const nombreUsuario = usuario?.displayName || usuario?.email || null;

  return (
    <div className="p-8 bg-gray-50 min-h-screen rounded-3xl">

      {!hectareaSeleccionada && (
        <HeroBienvenida nombreUsuario={nombreUsuario} />
      )}

      {hectareaSeleccionada && (
        <BannerHectarea
          hectarea={hectareaSeleccionada}
          cultivoActual={cultivoActual}
          totalSectores={sectoresActivos.length}
          onVolver={() => setHectareaSeleccionada(null)}
        />
      )}

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