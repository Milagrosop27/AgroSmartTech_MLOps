//src/components/overview/ModalAgricultor.jsx

import {useEffect, useState} from "react";
import {MapPin, User, X} from "lucide-react";

import { traducirRiesgo } from '../../utils/helpers/traducirRiesgo.js';

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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Detalles de Alerta</h3>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* CINTA DE RIESGO */}
        <div className="mb-4 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600 flex justify-between">
          <span>Sector: <span className="font-bold text-gray-800">{registro?.farm_id}</span></span>
          <span>Riesgo: <span className={`font-bold ${
            registro?.crop_disease_status === 'Severe'   ? 'text-red-600'   :
            registro?.crop_disease_status === 'Moderate' ? 'text-amber-500' :
            'text-yellow-500'
          }`}>
            {traducirRiesgo(registro?.crop_disease_status)}
          </span></span>
        </div>

        {/* NUEVO: PANEL DE SENSORES Y NUTRIENTES */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="bg-blue-50 border border-blue-100 p-2 rounded-lg text-center">
            <span className="block text-[10px] uppercase font-bold text-blue-500">Clima</span>
            <span className="text-xs font-bold text-gray-800 block mt-1">
              {registro?.temperature_C || '--'}°C
            </span>
            <span className="text-[10px] text-gray-500 font-semibold">{registro?.['humidity_%'] || '--'}% Hum</span>
          </div>
          <div className="bg-green-50 border border-green-100 p-2 rounded-lg text-center">
            <span className="block text-[10px] uppercase font-bold text-green-600">Suelo</span>
            <span className="text-xs font-bold text-gray-800 block mt-1">
              pH: {registro?.soil_pH || '--'}
            </span>
            <span className="text-[10px] text-gray-500 font-semibold">NDVI: {registro?.NDVI_index || '--'}</span>
          </div>
          <div className="bg-purple-50 border border-purple-100 p-2 rounded-lg text-center">
            <span className="block text-[10px] uppercase font-bold text-purple-600">Nutrientes</span>
            <span className="text-xs font-bold text-gray-800 block mt-1 tracking-widest">
              {registro?.n || '--'}-{registro?.p || '--'}-{registro?.k || '--'}
            </span>
            <span className="text-[10px] text-gray-500 font-semibold">N - P - K</span>
          </div>
        </div>

        <p className="text-sm font-semibold text-gray-500 mb-2">Notificar al agricultor:</p>

        {cargando ? (
          <p className="text-sm text-gray-400 py-4 text-center animate-pulse">Cargando agricultores...</p>
        ) : agricultores.length === 0 ? (
          <div className="py-4 text-center border border-dashed border-gray-300 rounded-xl">
            <p className="text-sm text-amber-600 font-semibold">No hay agricultores registrados.</p>
            <p className="text-xs text-gray-400 mt-1">
              El agricultor debe enviar "join &lt;palabra&gt;" al Sandbox de Twilio primero.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-48 overflow-y-auto mb-4 pr-1">
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
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
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
            className="flex-1 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex justify-center items-center gap-2"
          >
            Enviar a WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalAgricultor;