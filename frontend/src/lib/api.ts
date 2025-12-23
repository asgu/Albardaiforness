import axios, { AxiosResponse } from 'axios';
import { Person, PersonSummary, PersonSearchResult, Server } from '@/types';

interface Duplicate {
  id: number;
  person1Id: number;
  person2Id: number;
  similarity: number;
  status: string;
}

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

// API methods with proper typing
export const authApi = {
  login: (username: string, password: string): Promise<AxiosResponse<{ token: string; user: any }>> =>
    api.post('/api/auth', { username, password }),
};

export interface PersonSearchParams {
  q?: string;
  id?: string;
  server?: string;
  firstName?: string;
  lastName?: string;
  nickName?: string;
  birthYear?: number;
  deathYear?: number;
  gender?: string;
  birthPlace?: string;
  occupation?: string;
  note?: string;
}

export const personApi = {
  search: (params: PersonSearchParams): Promise<AxiosResponse<PersonSearchResult[]>> =>
    api.get<PersonSearchResult[]>('/api/search', { params }),
  
  getById: (id: number | string): Promise<AxiosResponse<Person>> =>
    api.get<Person>(`/api/person/${id}`),
  
  getTodayBirthdays: (server?: string): Promise<AxiosResponse<Person[]>> =>
    api.get<Person[]>('/api/today', { params: { server } }),
  
  loadByIds: (ids: number[]): Promise<AxiosResponse<PersonSummary[]>> =>
    api.get<PersonSummary[]>('/api/persons/load', { params: { ids: ids.join(',') } }),
  
  update: (id: string, data: Partial<Person>): Promise<AxiosResponse<Person>> =>
    api.patch<Person>(`/api/person/${id}`, data),
  
  create: (data: Partial<Person>): Promise<AxiosResponse<Person>> =>
    api.post<Person>('/api/admin/person', data),
  
  addRelative: (
    personId: string, 
    relativeId: string, 
    relationType: 'father' | 'mother' | 'spouse' | 'child'
  ): Promise<AxiosResponse<{ message: string }>> =>
    api.post(`/api/person/${personId}/relative`, { relativeId, relationType }),
  
  removeRelative: (personId: string, relativeId: string): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/api/person/${personId}/relative/${relativeId}`),
};

export const serverApi = {
  getAll: (): Promise<AxiosResponse<Server[]>> =>
    api.get<Server[]>('/api/servers'),
  
  getByCode: (code: string): Promise<AxiosResponse<Server>> =>
    api.get<Server>(`/api/servers/${code}`),
  
  getPersons: (code: string, page = 1, limit = 50): Promise<AxiosResponse<{ data: Person[]; pagination: any }>> =>
    api.get(`/api/servers/${code}/persons`, { params: { page, limit } }),
};

export const duplicateApi = {
  getAll: (): Promise<AxiosResponse<Duplicate[]>> =>
    api.get<Duplicate[]>('/api/duplicates'),
  
  findForPerson: (id: number): Promise<AxiosResponse<Duplicate[]>> =>
    api.get<Duplicate[]>(`/api/persons/${id}/duplicates`),
  
  merge: (id: number): Promise<AxiosResponse<{ message: string }>> =>
    api.post(`/api/duplicates/${id}/merge`),
  
  reject: (id: number): Promise<AxiosResponse<{ message: string }>> =>
    api.post(`/api/duplicates/${id}/reject`),
};

export const galleryApi = {
  getAll: (): Promise<AxiosResponse<any[]>> =>
    api.get('/gallery'),
};
