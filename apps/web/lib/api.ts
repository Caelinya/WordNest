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
    // Check for 401 Unauthorized error
    if (error.response?.status === 401) {
      // Avoid redirect loops if already on the login page
      if (window.location.pathname !== '/') {
        toast.error("Your session has expired. Please log in again.");
        // We can't call the useAuth hook here, so we manually clear the cookie
        // and force a reload, which will trigger the AuthProvider logic.
        document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        window.location.href = '/';
      }
    } else {
      const message = error.response?.data?.detail || 'An unexpected error occurred.';
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  login: async ({ username, password }: Record<string, string>) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    const response = await api.post("/auth/token", formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return response.data;
  },
  register: async (userData: Record<string, string>) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  }
};

export const notesApi = {
  search: async (query: string, isSemantic: boolean) => {
    if (!query || !query.trim()) {
      return [];
    }
    const response = await api.get(
      `/notes/search?q=${encodeURIComponent(query)}&semantic=${isSemantic}`
    );
    return response.data;
  },
  // We can add other note-related API calls here in the future
  // e.g., getNotes, createNote, etc.
};