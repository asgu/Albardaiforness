import axios, { AxiosResponse } from 'axios';
import { Person, PersonSummary, PersonSearchResult, Server, Media, Category, Tag, GalleryMedia } from '@/types';

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

export const mediaApi = {
  getByPersonId: (personId: string): Promise<AxiosResponse<Media[]>> =>
    api.get<Media[]>(`/api/media/person/${personId}`),
  
  getById: (id: string): Promise<AxiosResponse<Media>> =>
    api.get<Media>(`/api/media/${id}`),
  
  getAvatarUrl: (personId: string): Promise<AxiosResponse<{ url: string }>> =>
    api.get<{ url: string }>(`/api/media/avatar/${personId}`),
  
  getAll: (params?: { categoryId?: string; tagId?: string; search?: string; page?: number; limit?: number }): Promise<AxiosResponse<{ data: GalleryMedia[]; pagination: any }>> =>
    api.get<{ data: GalleryMedia[]; pagination: any }>('/api/media', { params }),
  
  upload: (formData: FormData): Promise<AxiosResponse<Media[]>> =>
    api.post<Media[]>('/api/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
  update: (id: string, data: Partial<GalleryMedia>): Promise<AxiosResponse<GalleryMedia>> =>
    api.put<GalleryMedia>(`/api/media/${id}`, data),
  
  delete: (id: string): Promise<AxiosResponse<void>> =>
    api.delete<void>(`/api/media/${id}`),
  
  rotate: (id: string): Promise<AxiosResponse<void>> =>
    api.get<void>(`/api/media/${id}/rotate`),
  
  findDuplicates: (mediaIds: string[]): Promise<AxiosResponse<GalleryMedia[]>> =>
    api.post<GalleryMedia[]>('/api/media/duplicates', { mediaIds }),
  
  deleteMultiple: (mediaIds: string[]): Promise<AxiosResponse<void>> =>
    api.patch<void>('/api/media', { mediaIds }),
};

export const categoryApi = {
  getAll: (): Promise<AxiosResponse<Category[]>> =>
    api.get<Category[]>('/api/categories'),
  
  getById: (id: string): Promise<AxiosResponse<Category>> =>
    api.get<Category>(`/api/categories/${id}`),
  
  getMedia: (id: string): Promise<AxiosResponse<GalleryMedia[]>> =>
    api.get<GalleryMedia[]>(`/api/categories/${id}/media`),
  
  create: (data: { title: string; parentId?: string }): Promise<AxiosResponse<Category>> =>
    api.post<Category>('/api/categories', data),
  
  update: (id: string, data: { title: string; parentId?: string }): Promise<AxiosResponse<Category>> =>
    api.put<Category>(`/api/categories/${id}`, data),
  
  delete: (id: string): Promise<AxiosResponse<void>> =>
    api.delete<void>(`/api/categories/${id}`),
};

export const tagApi = {
  getAll: (): Promise<AxiosResponse<Tag[]>> =>
    api.get<Tag[]>('/api/tags'),
  
  getById: (id: string): Promise<AxiosResponse<Tag>> =>
    api.get<Tag>(`/api/tags/${id}`),
  
  getMedia: (id: string): Promise<AxiosResponse<GalleryMedia[]>> =>
    api.get<GalleryMedia[]>(`/api/tags/${id}/media`),
  
  create: (data: { title: string }): Promise<AxiosResponse<Tag>> =>
    api.post<Tag>('/api/tags', data),
  
  update: (id: string, data: { title: string }): Promise<AxiosResponse<Tag>> =>
    api.put<Tag>(`/api/tags/${id}`, data),
  
  delete: (id: string): Promise<AxiosResponse<void>> =>
    api.delete<void>(`/api/tags/${id}`),
};

export const galleryApi = {
  search: (query: string): Promise<AxiosResponse<GalleryMedia[]>> =>
    api.get<GalleryMedia[]>(`/api/media/search?query=${query}`),
  
  updateMedia: (id: string, data: { title?: string; description?: string; categoryId?: string; tags?: Tag[] }): Promise<AxiosResponse<GalleryMedia>> =>
    api.put<GalleryMedia>(`/api/media/${id}`, data),
  
  deleteMultiple: (ids: string[]): Promise<AxiosResponse<void>> =>
    api.post<void>('/api/media/delete-multiple', { ids }),
  
  findDuplicates: (ids: string[]): Promise<AxiosResponse<Array<{ id: string; duplicates: GalleryMedia[] }>>> =>
    api.post('/api/media/find-duplicates', { ids }),
};
