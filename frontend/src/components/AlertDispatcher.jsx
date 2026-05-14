import React, { useState } from 'react';
import { Send, CheckCircle, AlertTriangle } from 'lucide-react';

const AlertDispatcher = ({ prediction, onApprove }) => {
  return (
    <div className="p-6 bg-white rounded-xl shadow-md border-l-4 border-green-500">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <AlertTriangle className="text-amber-500" />
          Validación de Alerta Predictiva
        </h3>
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          Confianza: 98.2%
        </span>
      </div>

      <p className="text-gray-600 mb-6">
        La IA sugiere: <span className="font-semibold text-gray-800">"{prediction || 'Cargando recomendación...'}"</span>.
        ¿Deseas enviar esta instrucción al agricultor por WhatsApp?
      </p>

      <div className="flex gap-4">
        <button
          onClick={onApprove}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Send size={18} /> Aprobar y Enviar
        </button>
        <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg transition-colors">
          Editar Mensaje
        </button>
      </div>
    </div>
  );
};

export default AlertDispatcher;