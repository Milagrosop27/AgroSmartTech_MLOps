// src/utils/helpers/getBadgeSubsector.js

// HELPERS DE COLOR PARA BADGES DE SUBSECTORES

export const getBadgeSubsector = (estado) => {
  switch (estado) {
    case 'Severe':   return 'bg-red-600 text-white';
    case 'Moderate': return 'bg-amber-500 text-white';
    case 'Mild':     return 'bg-green-600 text-white';
    default:         return 'bg-green-600 text-white';
  }
};