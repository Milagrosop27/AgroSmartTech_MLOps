// src/utils/helpers/getLabelEstado.js

// HELPERS DE COLOR PARA LABELS DE ESTADO

export const getLabelEstado = (estado) => {
  switch (estado) {
    case 'Severe':   return 'Crítico';
    case 'Moderate': return 'Moderado';
    case 'Mild':     return 'Sano';
    default:         return 'Sano';
  }
};