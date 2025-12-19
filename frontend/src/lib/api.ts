import axios from 'axios';

// Determine if we're in browser and on production domain
const isProduction = typeof window !== 'undefined' && 
  (window.location.hostname.includes('albardaiforness.org') || 
   window.location.hostname.includes('alberodipreone.org') ||
   window.location.hostname.includes('alberodiraveo.org'));

// In production, use relative path (Nginx will proxy /api/ to backend)
// In development, use full URL to localhost API
const API_BASE_URL = isProduction
  ? '' // Use relative paths in production
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3300');

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor для добавления токена
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API methods
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/api/auth', { username, password }),
};

export const personApi = {
  search: (query: string, server?: string) =>
    api.get('/api/search', { params: { q: query, server } }),
  
  getById: (id: number) =>
    api.get(`/api/person/${id}`),
  
  getTodayBirthdays: (server?: string) =>
    api.get('/api/today', { params: { server } }),
  
  loadByIds: (ids: number[]) =>
    api.get('/api/persons/load', { params: { ids: ids.join(',') } }),
};

export const serverApi = {
  getAll: () =>
    api.get('/api/servers'),
  
  getByCode: (code: string) =>
    api.get(`/api/servers/${code}`),
  
  getPersons: (code: string, page = 1, limit = 50) =>
    api.get(`/api/servers/${code}/persons`, { params: { page, limit } }),
};

export const duplicateApi = {
  getAll: () =>
    api.get('/api/duplicates'),
  
  findForPerson: (id: number) =>
    api.get(`/api/persons/${id}/duplicates`),
  
  merge: (id: number) =>
    api.post(`/api/duplicates/${id}/merge`),
  
  reject: (id: number) =>
    api.post(`/api/duplicates/${id}/reject`),
};

export const galleryApi = {
  getAll: () =>
    api.get('/gallery'),
};
