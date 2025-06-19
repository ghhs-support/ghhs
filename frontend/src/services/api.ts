import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',  // Django development server
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include credentials
api.interceptors.request.use(
  (config) => {
    config.withCredentials = true;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

export default api;