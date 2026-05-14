import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.18.28:5000',
});

export const getPrediction = (data) => api.post('/predecir', data);
// Agregamos de una vez la del agrónomo
export const getRecommendation = (data) => api.post('/recomendar_fertilizante', data);
export default api;