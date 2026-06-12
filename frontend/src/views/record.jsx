import React from 'react';
import { ClipboardList, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import ExportButtons from '../components/ui/ExportButtons.jsx';

const Record = ({ historialAlertas }) => {
  const totalAlertas = historialAlertas.length;
  const alertasExitosas = historialAlertas.filter(a => a.estado === 'SUCCESS').length;
  const alertasCriticas = historialAlertas.filter(a => a.diagnostico === 'Severe' || a.diagnostico === 'Crítico').length;

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

      {/* RESUMEN ESTADÍSTICO GERENCIAL */}
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
            <p className="text-sm text-gray-500 font-medium">Alertas Enviadas (WA)</p>
            <h3 className="text-2xl font-bold text-gray-800">{alertasExitosas}</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Record;