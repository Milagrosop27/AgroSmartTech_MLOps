// services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://agrosmart-api-940420015515.us-central1.run.app',
});

// Prediccion de riesgo (Modelo Guardian)
export const getPrediction = (data) => api.post('/predecir', data);

// Recomendacion de fertilizante (Modelo Agronomo)
export const getRecommendation = (data) => api.post('/recomendar_fertilizante', data);

/**
 * Retorna el historico de predicciones desde BigQuery.
 *
 * @param {object} params
 * @param {number} [params.minutos=1440]  - Ventana temporal en minutos (default 24h)
 * @param {string} [params.hectarea]      - Ej: "H1". Si se omite, trae todas.
 * @param {string} [params.sector]        - Ej: "S03". Requiere hectarea.
 */
export const getDashboard = ({ minutos = 1440, hectarea = null, sector = null } = {}) => {
  const params = { minutos };
  if (hectarea) params.hectarea = hectarea;
  if (sector)   params.sector   = sector;
  return api.get('/datos-dashboard', { params });
};

/**
 * Retorna el catalogo de hectareas y sectores activos en BigQuery.
 * Respuesta: { hectareas: ["H1",...], sectores_por_hectarea: { H1: ["H1_S01",...] } }
 */
export const getZonas = () => api.get('/api/zonas');

export default api;