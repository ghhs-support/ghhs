import axios from 'axios';

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

// Determine the base URL based on the current environment
const baseURL = import.meta.env.PROD 
  ? 'https://ghhs.fly.dev'  // Production URL
  : 'http://localhost:8000'; // Development URL

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Add a request interceptor to include credentials and CSRF token
api.interceptors.request.use(
  async (config) => {
    // Include credentials (cookies)
    config.withCredentials = true;

    // Add CSRF token for non-GET requests
    if (config.method !== 'get') {
      const csrfToken = getCookie('csrftoken');
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
    }

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
    // Only redirect to signin for certain types of auth failures
    if (error.response?.status === 401) {
      // Check if this is a critical auth failure (not just a temporary token issue)
      const config = error.config;
      const isImageUpload = config?.url?.includes('/api/alarm-images/');
      const isRefreshCall = config?.url?.includes('/api/alarms/') || config?.url?.includes('/api/alarm-updates/');
      
      // Don't redirect if it's an image upload or a refresh call after upload
      if (!isImageUpload && !isRefreshCall) {
        console.warn('Authentication failed, redirecting to signin');
        setAuthToken(null);
        window.location.href = '/signin';
      } else {
        console.warn('API call failed with 401, but not redirecting:', config?.url);
      }
    } else if (error.response?.status === 403) {
      // For 403 errors, only redirect if it's not a file upload or refresh operation
      const config = error.config;
      const isImageUpload = config?.url?.includes('/api/alarm-images/');
      const isRefreshCall = config?.url?.includes('/api/alarms/') || config?.url?.includes('/api/alarm-updates/');
      
      if (!isImageUpload && !isRefreshCall) {
        console.warn('Access forbidden, redirecting to signin');
        setAuthToken(null);
        window.location.href = '/signin';
      }
    }
    return Promise.reject(error);
  }
);

export default api;