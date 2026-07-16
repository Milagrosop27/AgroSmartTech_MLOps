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

  // --- HELPER 1: Formateo seguro de fechas ---
  const formatearFecha = (alerta) => {
    try {
      // 1. Buscamos la fecha en todas las propiedades posibles de tu Firebase
      const campoFecha = alerta.timestamp || alerta.fecha_registro || alerta.fecha_hora || alerta.fecha;

      // Si definitivamente no hay ninguna fecha guardada en la BD
      if (!campoFecha) return 'Sin Fecha';

      // 2. Si viene de Firebase Timestamp (tiene .seconds)
      if (campoFecha.seconds) {
        return new Date(campoFecha.seconds * 1000).toLocaleString();
      }

      // 3. Si viene como un texto normal (String ISO)
      const fecha = new Date(campoFecha);
      if (!isNaN(fecha)) {
        return fecha.toLocaleString();
      }
    } catch {
      return 'Fecha Inválida';
    }

    return 'Sin Fecha';
  };

  // --- HELPER 2: Lógica del temporizador ---
  const obtenerEstadoFinal = (alerta) => {
    let estadoFinal = traducirEstado(alerta.estado);

    if (alerta.estado === "PENDING" && alerta.fecha_hora) {
      const fechaAlerta = alerta.fecha_hora.seconds
          ? new Date(alerta.fecha_hora.seconds * 1000)
          : new Date(alerta.fecha_hora);

      const ahora = new Date();
      const diferenciaMinutos = (ahora - fechaAlerta) / (1000 * 60);

      // REGLAS DE TIEMPO

      if (diferenciaMinutos >= 5) {
        // Si pasaron 5 o más minutos
        estadoFinal = "No atendido";
      } else if (diferenciaMinutos >= 1) {
        // Si no pasaron 5, pero sí pasó 1 o más minutos
        estadoFinal = "Reenviar";
      }
      // (Si es menor a 1 minuto, se queda con su estado original "Esperando")
    }

    return estadoFinal;
  };

  // --- EXPORTAR PDF ---
  const exportarPDF = () => {
    if (!historialAlertas || historialAlertas.length === 0) return;

    const doc = new jsPDF();
    doc.text("Historial de Alertas - AgroSmart Tech", 14, 15);

    const columnas = ["FECHA", "LOTE", "DIAGNÓSTICO", "ACCIÓN", "ESTADO"];

    const filas = historialAlertas.map(alerta => [
      formatearFecha(alerta),
      alerta.farm_id || "Sin Lote",
      traducirRiesgo(alerta.diagnostico),
      alerta.accion || "Sin Acción",
      obtenerEstadoFinal(alerta)
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

  // --- EXPORTAR CSV ---
  const exportarCSV = () => {
    if (!historialAlertas || historialAlertas.length === 0) return;

    const cabeceras = ["FECHA", "LOTE", "DIAGNOSTICO", "ACCION", "ESTADO"];

    const filas = historialAlertas.map(alerta => [
      `"${formatearFecha(alerta)}"`,
      `"${alerta.farm_id || "Sin Lote"}"`,
      `"${traducirRiesgo(alerta.diagnostico)}"`,
      `"${alerta.accion || "Sin Acción"}"`,
      `"${obtenerEstadoFinal(alerta)}"`
    ]);

    const contenidoCSV = [
      cabeceras.join(','),
      ...filas.map(fila => fila.join(','))
    ].join('\n');


    const blob = new Blob(['\uFEFF' + contenidoCSV], { type: 'text/csv;charset=utf-8;' });

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