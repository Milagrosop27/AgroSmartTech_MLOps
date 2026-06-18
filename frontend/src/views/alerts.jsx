import { CheckCircle, Send, Clock } from 'lucide-react';

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
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800">Historial de Alertas</h2>
          <p className="text-sm text-gray-500 mt-1">Registro de notificaciones enviadas a los agricultores</p>
        </div>

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
              {historialAlertas.map((alerta) => (
                <tr
                  key={alerta.id}
                  className="hover:bg-gray-50 transition-colors"
                  // DOBLE CLIC OCULTO PARA SIMULAR EL WEBHOOK DE META
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

                    {/* ESTADO 1: ESPERANDO */}
                    {alerta.estado === 'PENDING' && (
                      <span className="flex items-center gap-1 text-yellow-600 text-xs font-semibold px-3 py-1 bg-yellow-50 rounded-md border border-yellow-200">
                        <Clock size={14} className="animate-spin" /> Esperando...
                      </span>
                    )}

                    {/* ESTADO 2: TIMEOUT (EL DISEÑO DE TU CAPTURA) */}
                    {alerta.estado === 'TIMEOUT' && (
                      <button
                        onClick={() => manejarAprobacionAlerta({ farm_id: alerta.lote, crop_disease_status: alerta.diagnostico })}
                        className="flex items-center gap-1 text-green-600 bg-green-50 border border-green-200 hover:bg-green-100 px-3 py-1 rounded-md text-sm font-semibold transition-colors"
                      >
                        <Send size={14} />
                        Reenviar
                      </button>
                    )}

                    {/* ESTADO 3: REALIZADO */}
                    {alerta.estado === 'SUCCESS' && (
                      <span className="flex items-center gap-1 text-emerald-600 text-sm font-bold">
                        <CheckCircle size={16} /> Realizado
                      </span>
                    )}

                  </td>
                </tr>
              ))}
              {historialAlertas.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                    No hay alertas en el historial.
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