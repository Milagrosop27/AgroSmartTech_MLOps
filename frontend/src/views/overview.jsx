// src/views/overview.jsx

import { AlertTriangle, Leaf, MapPin } from 'lucide-react';

// Importaciones de tus nuevos componentes separados
import HeroBienvenida from '../components/overview/HeroBienvenida';
import BannerHectarea from '../components/overview/BannerHectarea';
import SelectorHectareas from '../components/overview/SelectorHectareas';
import GridSubsectores from '../components/overview/GridSubsectores';

const Overview = ({
  parcelas = [],
  manejarAprobacionAlerta,
  zonas = { hectareas: [], sectores_por_hectarea: {} },
  hectareaSeleccionada,
  setHectareaSeleccionada,
  
}) => {
  const datos = parcelas || [];

  // Lógica de cálculo (Orquestación)
  const mapaSectores = {};
  datos.forEach((p) => { if (p.farm_id) mapaSectores[p.farm_id] = p; });
  const sectoresActuales = Object.values(mapaSectores);
  const totalSectores = sectoresActuales.length;

  let cultivoActual = 'Varios';
  if (hectareaSeleccionada) {
    const primerSectorHectarea = sectoresActuales.find(
      (p) => p.farm_id && p.farm_id.startsWith(hectareaSeleccionada + '_')
    );
    cultivoActual = primerSectorHectarea?.crop_type || 'Desconocido';
  }

  const severeCount = sectoresActuales.filter((p) => p.crop_disease_status === 'Severe').length;
  const moderateCount = sectoresActuales.filter((p) => p.crop_disease_status === 'Moderate').length;
  const sectoresEnAlerta = severeCount + moderateCount;
  const saludVegetal = totalSectores > 0
    ? (sectoresActuales.reduce((acc, p) => acc + (Number(p.NDVI_index) || 0), 0) / totalSectores).toFixed(2)
    : '0.00';

  let nivelRiesgo = 'Bajo'; let colorRiesgo = 'text-green-600'; let bgRiesgo = 'bg-green-50';
  if (severeCount > 0) {
    nivelRiesgo = 'Alto';  colorRiesgo = 'text-red-600';   bgRiesgo = 'bg-red-50';
  } else if (moderateCount > 0) {
    nivelRiesgo = 'Medio'; colorRiesgo = 'text-amber-600'; bgRiesgo = 'bg-amber-50';
  }

  const sectoresActivos = hectareaSeleccionada ? (zonas.sectores_por_hectarea[hectareaSeleccionada] || []) : [];

  return (
    <div className="p-8 bg-gray-50 min-h-screen rounded-3xl">
      {!hectareaSeleccionada && <HeroBienvenida />}

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

      {/* Tarjetas KPI al final */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className={`${bgRiesgo} p-6 rounded-xl shadow-xl flex items-start justify-between`}>
          <div>
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Nivel de Riesgo</p>
            <h3 className={`text-3xl font-bold mt-2 ${colorRiesgo}`}>{nivelRiesgo}</h3>
          </div>
          <div className={`p-3 ${bgRiesgo} ${colorRiesgo} rounded-lg`}><AlertTriangle size={24} /></div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-xl  flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Sectores en Alerta</p>
            <h3 className="text-3xl font-bold text-amber-700 mt-2">{sectoresEnAlerta}</h3>
            <p className="text-xs text-gray-500 mt-2">de {totalSectores} sectores</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><MapPin size={24} /></div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-xl flex items-start justify-between">
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