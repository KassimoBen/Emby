import axios from 'axios';
import type { Media, ScanStatus, User, MediaStats, TokenResponse } from '../types';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login: (username: string, password: string) =>
    api.post<TokenResponse>('/auth/login', { username, password }).then((r) => r.data),
  register: (username: string, password: string, role: string = 'viewer') =>
    api.post('/auth/register', { username, password, role }).then((r) => r.data),
  me: () => api.get<User>('/auth/me').then((r) => r.data),
  listUsers: () => api.get<User[]>('/auth/users').then((r) => r.data),
};

export const mediaApi = {
  list: (params?: {
    media_type?: string;
    search?: string;
    genre?: string;
    sort?: string;
    page?: number;
    per_page?: number;
  }) => api.get<Media[]>('/media/', { params }).then((r) => r.data),
  get: (id: number) => api.get<Media>(`/media/${id}`).then((r) => r.data),
  types: () => api.get<string[]>('/media/types').then((r) => r.data),
  genres: () => api.get<string[]>('/media/genres').then((r) => r.data),
  stats: () => api.get<MediaStats>('/media/stats').then((r) => r.data),
  generateNfo: (id: number) => api.post(`/media/${id}/nfo`).then((r) => r.data),
};

export const scanApi = {
  start: (path: string) => api.post('/scan/start', { path }).then((r) => r.data),
  status: () => api.get<ScanStatus[]>('/scan/status').then((r) => r.data),
  delete: (id: number) => api.delete(`/scan/${id}`).then((r) => r.data),
  rescrape: () => api.post('/scan/rescrape').then((r) => r.data),
};

export const downloadApi = {
  url: (id: number) => {
    const token = localStorage.getItem('token');
    return `/api/download/${id}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },
};

export const configApi = {
  get: () => api.get('/config/').then((r) => r.data),
};

export default api;
