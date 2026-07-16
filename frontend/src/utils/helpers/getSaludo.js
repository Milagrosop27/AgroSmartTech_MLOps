// src/utils/helpers/getSaludo.js

// Saludo según la hora del día

export const getSaludo = () => {
  const hora = new Date().getHours();
  if (hora >= 5 && hora < 12)  return 'Buenos días';
  if (hora >= 12 && hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
};