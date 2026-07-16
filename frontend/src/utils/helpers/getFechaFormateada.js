// src/utils/helpers/getFechaFormateada.js

// HELPERS DE FECHA FORMATEADA

export const getFechaFormateada = () => {
  return new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};