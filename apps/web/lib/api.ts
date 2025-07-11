import axios, { InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { getCookie } from 'cookies-next';
import { Note, Tag, User, Folder, PracticeList, PracticeListDetail, PracticeListCreate, PracticeListUpdate, PracticeListItem, ReviewResult } from "@/types/notes";

const api = axios.create({
  baseURL: '/api', // All requests will be prefixed with /api
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Try multiple ways to get the token
    let token = getCookie('auth_token');
    
    // If getCookie doesn't work, try document.cookie
    if (!token && typeof document !== 'undefined') {
      const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];
      token = cookieValue;
    }
    
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
      // Don't redirect if it's an auth endpoint request
      const isAuthRequest = error.config?.url?.includes('/auth/');
      
      // Avoid redirect loops if already on the login page or if it's an auth request
      if (window.location.pathname !== '/' && !isAuthRequest) {
        toast.error("Your session has expired. Please log in again.");
        // We can't call the useAuth hook here, so we manually clear the cookie
        // and force a reload, which will trigger the AuthProvider logic.
        document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        
        // Use replace to avoid adding to history
        window.location.replace('/');
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
  search: async (params: {
    q?: string;
    semantic?: boolean;
    similarity?: number;
    folder_id?: number;
    tags?: string[];
    note_type?: string;
    search_in_content?: boolean;
  }) => {
    const searchParams = new URLSearchParams();
    if (params.q) {
      searchParams.append('q', params.q);
    }
    if (params.semantic !== undefined) {
      searchParams.append('semantic', String(params.semantic));
    }
    if (params.similarity !== undefined) {
      searchParams.append('similarity', String(params.similarity));
    }
    if (params.folder_id) {
      searchParams.append('folder_id', String(params.folder_id));
    }
    if (params.tags && params.tags.length > 0) {
      params.tags.forEach(tag => searchParams.append('tags', tag));
    }
    if (params.note_type) {
      searchParams.append('note_type', params.note_type);
    }
    if (params.search_in_content !== undefined) {
      searchParams.append('search_in_content', String(params.search_in_content));
    }
    
    const queryString = searchParams.toString();
    const response = await api.get(`/notes/search?${queryString}`);
    return response.data;
  },
  // We can add other note-related API calls here in the future
  // e.g., getNotes, createNote, etc.
};

export const foldersApi = {
  getAll: async () => {
    const response = await api.get('/folders');
    return response.data;
  }
}

export const tagsApi = {
  getAll: async () => {
    const response = await api.get('/tags');
    return response.data;
  }
}

// Practice Lists API
export const practiceListsApi = {
  // List management
  getAll: async (): Promise<PracticeList[]> => {
    const response = await api.get("/practice-lists/");
    return response.data;
  },

  getById: async (id: number): Promise<PracticeListDetail> => {
    const response = await api.get(`/practice-lists/${id}`);
    return response.data;
  },

  create: async (data: PracticeListCreate): Promise<PracticeList> => {
    const response = await api.post("/practice-lists/", data);
    return response.data;
  },

  update: async (id: number, data: PracticeListUpdate): Promise<PracticeList> => {
    const response = await api.put(`/practice-lists/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/practice-lists/${id}`);
  },

  // Item management
  addItems: async (listId: number, noteIds: number[]): Promise<PracticeListItem[]> => {
    const response = await api.post(`/practice-lists/${listId}/items`, {
      note_ids: noteIds,
    });
    return response.data;
  },

  removeItem: async (listId: number, itemId: number): Promise<void> => {
    await api.delete(`/practice-lists/${listId}/items/${itemId}`);
  },

  reorderItems: async (listId: number, itemIds: number[]): Promise<void> => {
    await api.put(`/practice-lists/${listId}/items/reorder`, {
      item_ids: itemIds,
    });
  },

  // Review
  getReviewQueue: async (listId: number, limit: number = 20): Promise<PracticeListItem[]> => {
    const response = await api.get(`/practice-lists/${listId}/review-queue`, {
      params: { limit },
    });
    return response.data;
  },

  recordReview: async (listId: number, itemId: number, result: ReviewResult): Promise<void> => {
    await api.post(`/practice-lists/${listId}/items/${itemId}/review`, result);
  },
};