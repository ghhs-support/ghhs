import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Beeping Alarms API Functions
export const beepingAlarmsApi = {
  getBeepingAlarms: async (getToken: () => Promise<string | null>) => {
    const token = await getToken();
    const response = await api.get('/beeping_alarms', {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });
    return response.data;
  },
}

export default api;