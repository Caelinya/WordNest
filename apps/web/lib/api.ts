import axios, { InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { getCookie } from 'cookies-next';

const api = axios.create({
  baseURL: '/api', // All requests will be prefixed with /api
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getCookie('auth_token');
    if (token && typeof token === 'string') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// Add a response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const message = error.response?.data?.detail || 'An unexpected error occurred.';
    toast.error(message);
    return Promise.reject(error);
  }
);

export default api;