// src/utils/helpers/getBgSubsector.js

// HELPERS DE COLOR PARA SUBSECTORES

export const getBgSubsector = (estado) => {
  switch (estado) {
    case 'Severe':   return 'bg-white border-white shadow-md';
    case 'Moderate': return 'bg-white border-white shadow-md';
    case 'Mild':     return 'bg-white border-white shadow-md';
    default:         return 'bg-white border-white shadow-md';
  }
};