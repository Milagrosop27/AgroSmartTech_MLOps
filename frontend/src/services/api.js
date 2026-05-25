import axios from 'axios';

const api = axios.create({
  baseURL: 'https://agrosmart-api-940420015515.us-central1.run.app',
});

export const getPrediction = (data) => api.post('/predecir', data);
// Agregamos de una vez la del agrónomo
export const getRecommendation = (data) => api.post('/recomendar_fertilizante', data);
export default api;