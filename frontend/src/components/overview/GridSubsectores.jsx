//src/components/overview/GridSubsectores.jsx

import { useState } from "react"
import { Eye } from 'lucide-react';


import { getBgSubsector} from '../../utils/helpers/getBgSubsector.js';
import { getBadgeSubsector} from "../../utils/helpers/getBadgeSubsector.js";
import { getLabelEstado} from "../../utils/helpers/getLabelEstado.js";


import ModalAgricultor from './ModalAgricultor';
import ModalAlerta from './ModalAlerta';

const GridSubsectores = ({ sectores, parcelas, manejarAprobacionAlerta }) => {
  const [modalAgricultor, setModalAgricultor] = useState(null);
  const [modalAlerta, setModalAlerta] = useState(null);

  const mapaUltimos = {};
  parcelas.forEach((p) => { mapaUltimos[p.farm_id] = p; });

  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {sectores.map((farmId) => {
          const registro = mapaUltimos[farmId];
          const estado = registro?.crop_disease_status || 'Healthy';
          const temp = registro ? Number(registro.temperature_C).toFixed(1) : '—';
          const hum = registro ? Number(registro['humidity_%']).toFixed(1) : '—';

          return (
            <div key={farmId} className={`p-3 rounded-xl border-2 flex flex-col justify-between gap-2 transition-shadow hover:shadow-md ${getBgSubsector(estado)}`}>
              <div>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-bold text-gray-700">{farmId}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getBadgeSubsector(estado)}`}>
                    {getLabelEstado(estado)}
                  </span>
                </div>

                {/* VISTA RESUMIDA: Solo Temperatura y Humedad */}
                <div className="text-xs text-gray-500 space-y-0.5">
                  <p>Temp: <span className="font-semibold text-gray-800">{temp}°C</span></p>
                  <p>Hum: <span className="font-semibold text-gray-800">{hum}%</span></p>
                </div>
              </div>

              {/* --- NUEVAS ACCIONES ESTILIZADAS --- */}
              {/* Contenedor en Fila (flex-row) */}
              <div className="flex flex-row items-center gap-2 mt-2 pt-2 border-t border-gray-100">

                {/* Botón 1: Ver detalles (Cuadrado con Ojito) */}
                <button
                  onClick={() => setModalAlerta(registro)}
                  title="Ver detalles técnicos completos" // Tooltip para accesibilidad
                  className="flex-shrink-0 aspect-square p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors flex items-center justify-center border border-blue-100"
                >
                  <Eye size={18} />
                </button>

                {/* Botón 2: Enviar alerta (Verde con WhatsApp y Texto) */}
                {['Severe', 'Moderate'].includes(estado) ? (
                  <button
                    onClick={() => setModalAgricultor(registro)}
                    className="flex-1 flex justify-center items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-[11px] h-full py-2 rounded-lg font-bold transition-colors shadow-sm"
                  >
                    {/* ICONO DE WHATSAPP (SVG) */}
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51h-.57c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487 2.98 1.285 2.98.866 3.524.815.545-.049 1.758-.718 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="white"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.551 4.17 1.597 5.991L0 24l6.237-1.612A11.96 11.96 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.986c-1.84 0-3.642-.472-5.26-1.365l-.377-.215-3.692.955.986-3.568-.242-.379A9.957 9.957 0 0 1 2.015 12C2.015 6.49 6.49 2.014 12 2.014c5.51 0 9.985 4.476 9.985 9.986 0 5.51-4.475 9.986-9.985 9.986z" fill="white"/>
                    </svg>
                    Enviar alerta
                  </button>
                ) : (
                  // Estado Estable: Un placeholder visual alineado
                  <div className="flex-1 text-center bg-green-50 text-green-700 text-[11px] py-2 rounded-lg font-semibold border border-green-100">
                    Estable
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- RENDERIZADO DE MODALES (SIN CAMBIOS) --- */}
      {modalAlerta && (
        <ModalAlerta registro={modalAlerta} onCerrar={() => setModalAlerta(null)} />
      )}
      {modalAgricultor && (
        <ModalAgricultor registro={modalAgricultor} onCerrar={() => setModalAgricultor(null)} onConfirmar={(reg, tel) => manejarAprobacionAlerta(reg, tel)} />
      )}
    </div>
  );
};

export default GridSubsectores;