import axios from 'axios';

// Get API base URL from environment variable, default to http://localhost:8080
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect on login page
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    // Log network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      if (error.code === 'ECONNREFUSED') {
        error.message = `Cannot connect to server at ${API_BASE_URL}. Please ensure the backend is running.`;
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

