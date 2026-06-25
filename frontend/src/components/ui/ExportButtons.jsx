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

    const columnas = ["FECHA", "LOTE", "DIAGNÓSTICO", "ACCIÓN", "ESTADO"];
    const filas = historialAlertas.map(alerta => [
      alerta.fecha,
      alerta.lote,
      traducirRiesgo(alerta.diagnostico),
      alerta.recomendacion,
      traducirEstado(alerta.estado)
    ]);

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