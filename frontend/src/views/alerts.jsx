import { Send } from 'lucide-react';

const Alerts = ({ historialAlertas }) => {


  const reenviarWhatsApp = (alerta) => {
    const mensaje = encodeURIComponent(
      `*Recordatorio AgroSmart*\n\n *Lote:* ${alerta.lote}\n *Diagnóstico IA:* ${alerta.diagnostico}\n *Acción Sugerida:* ${alerta.recomendacion}`
    );

    window.open(`https://wa.me/?text=${mensaje}`, '_blank');
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800">Historial de Alertas</h2>
      <p className="text-gray-500 text-sm mb-8">Registro de notificaciones enviadas a los agricultores</p>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-400">FECHA</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400">LOTE</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400">DIAGNÓSTICO</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400">ACCIÓN</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400">ENVIAR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(!historialAlertas || historialAlertas.length === 0) ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-400">No hay alertas registradas.</td>
              </tr>
            ) : (
              historialAlertas.map(a => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-600">{a.fecha}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{a.lote}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-red-50 text-red-700 rounded-md text-xs font-bold">
                      {a.diagnostico}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{a.recomendacion}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => reenviarWhatsApp(a)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-xs font-bold transition-colors"
                    >
                      <Send size={14} /> Reenviar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Alerts;