import { useState} from 'react';
import { Send, AlertTriangle } from 'lucide-react';

const AlertDispatcher = ({ prediction, onApprove }) => {
  // Lista de contactos disponibles
  const contactos = [
    { nombre: "Juan Pérez (Administrador)", telefono: "51999999999" },
    { nombre: "Ing. Sofía Ruiz (Campo)", telefono: "51988888888" },
    { nombre: "Carlos Méndez (Logística)", telefono: "51977777777" }
  ];

  const [contactoSeleccionado, setContactoSeleccionado] = useState(contactos[0].telefono);

  return (
    <div className="p-6 bg-white rounded-xl shadow-md border-l-4 border-green-500 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <AlertTriangle className="text-amber-500" />
          Validación de Alerta
        </h3>
      </div>

      <p className="text-gray-600 mb-4">La IA sugiere: <span className="font-semibold">{prediction}</span></p>

      {/* Selector de contactos */}
      <label className="block text-sm font-medium text-gray-700 mb-2">Enviar a:</label>
      <select
        className="w-full p-2 border border-gray-300 rounded-lg mb-4"
        value={contactoSeleccionado}
        onChange={(e) => setContactoSeleccionado(e.target.value)}
      >
        {contactos.map((c, index) => (
          <option key={index} value={c.telefono}>{c.nombre}</option>
        ))}
      </select>

      <button
        onClick={() => onApprove(contactoSeleccionado)} // Pasamos el número seleccionado
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
      >
        <Send size={18} /> Aprobar y Enviar a WhatsApp
      </button>
    </div>
  );
};

export default AlertDispatcher;