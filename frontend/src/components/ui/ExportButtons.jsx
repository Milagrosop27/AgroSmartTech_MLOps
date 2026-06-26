import { FileText, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const traducirRiesgo = (diagnostico) => {
  switch (diagnostico) {
    case 'Severe':   return 'Crítico';
    case 'Moderate': return 'Moderado';
    case 'Mild':     return 'Leve';
    default:         return diagnostico || '';
  }
};

const traducirEstado = (estado) => {
  switch (estado) {
    case 'SUCCESS': return 'Realizado';
    case 'TIMEOUT': return 'Sin respuesta';
    case 'PENDING': return 'Esperando';
    default:        return estado || '';
  }
};

const ExportButtons = ({ historialAlertas }) => {

  const exportarPDF = () => {
    if (!historialAlertas || historialAlertas.length === 0) return;

    const doc = new jsPDF();
    doc.text("Historial de Alertas - AgroSmart Tech", 14, 15);

    // 1. Mantenemos tus columnas iguales
    const columnas = ["FECHA", "LOTE", "DIAGNÓSTICO", "ACCIÓN", "ESTADO"];

// 2. Mapeamos las filas corrigiendo los nombres de los campos y agregando el temporizador
    const filas = historialAlertas.map(alerta => {

      // --- LÓGICA DEL TEMPORIZADOR PARA EL ESTADO ---
      let estadoFinal = traducirEstado(alerta.estado); // Por defecto: "Esperando..." o "Realizado"

      if (alerta.estado === "PENDING" && alerta.fecha_hora) {
        // Convertimos la fecha de la alerta a milisegundos
        // (Soporta si viene como Firestore Timestamp {seconds: ...} o como String ISO)
        const fechaAlerta = alerta.fecha_hora.seconds
            ? new Date(alerta.fecha_hora.seconds * 1000)
            : new Date(alerta.fecha_hora);

        const ahora = new Date();
        const diferenciaMinutos = (ahora - fechaAlerta) / (1000 * 60);

        // ⏱️ SI PASARON MÁS DE 5 MINUTOS Y SIGUE PENDIENTE -> CAMBIA A REENVIAR
        if (diferenciaMinutos >= 5) {
          estadoFinal = "Reenviar";
        }
      }
      // ----------------------------------------------

      return [
        alerta.fecha_hora?.seconds
            ? new Date(alerta.fecha_hora.seconds * 1000).toLocaleString()
            : alerta.fecha || new Date(alerta.fecha_hora).toLocaleString(),

        alerta.farm_id || "Sin Lote",   // 👈 Corregido: cambia .lote por .farm_id
        traducirRiesgo(alerta.diagnostico),
        alerta.accion || "Sin Acción",   // 👈 Corregido: cambia .recomendacion por .accion
        estadoFinal                     // 👈 Usa el estado calculado con el temporizador
      ];
    });

    autoTable(doc, {
      head: [columnas],
      body: filas,
      startY: 20,
      theme: 'grid',
      headStyles: { fillColor: [22, 163, 74] }
    });

    doc.save(`AgroSmart_Alertas_${new Date().getTime()}.pdf`);
  };

  const exportarCSV = () => {
    if (!historialAlertas || historialAlertas.length === 0) return;

    const cabeceras = ["FECHA", "LOTE", "DIAGNOSTICO", "ACCION", "ESTADO"];
    const filas = historialAlertas.map(alerta => [
      `"${alerta.fecha}"`,
      `"${alerta.lote}"`,
      `"${traducirRiesgo(alerta.diagnostico)}"`,  // ✅ traducido
      `"${alerta.recomendacion}"`,
      `"${traducirEstado(alerta.estado)}"`          // ✅ traducido
    ]);

    const contenidoCSV = [
      cabeceras.join(','),
      ...filas.map(fila => fila.join(','))
    ].join('\n');

    const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AgroSmart_Alertas_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={exportarCSV}
        className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 text-sm font-medium"
      >
        <FileSpreadsheet size={18} className="text-green-600" />
        CSV
      </button>
      <button
        onClick={exportarPDF}
        className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 text-sm font-medium"
      >
        <FileText size={18} className="text-red-500" />
        PDF
      </button>
    </div>
  );
};

export default ExportButtons;