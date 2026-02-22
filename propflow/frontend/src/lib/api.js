// src/lib/api.js – Axios instance with auth + refresh interceptors
import axios from 'axios';
import { useAuthStore } from './store';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 – try refresh, else logout
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { refreshToken, setToken, logout } = useAuthStore.getState();
        if (!refreshToken) { logout(); return Promise.reject(error); }

        const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/auth/refresh`, { refresh_token: refreshToken });
        setToken(data.session.access_token);
        original.headers.Authorization = `Bearer ${data.session.access_token}`;
        return api(original);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

// ── API helpers ───────────────────────────────
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  register: (data) => api.post('/auth/register', data),
};

export const listingsApi = {
  getPublic: (params) => api.get('/listings', { params }),
  getById: (id) => api.get(`/listings/${id}`),
  getAdmin: (params) => api.get('/listings/admin/all', { params }),
  create: (data) => api.post('/listings', data),
  update: (id, data) => api.put(`/listings/${id}`, data),
  updateStatus: (id, status) => api.patch(`/listings/${id}/status`, { status }),
  assign: (id, agent_id) => api.patch(`/listings/${id}/assign`, { agent_id }),
  delete: (id) => api.delete(`/listings/${id}`),
};

export const enquiriesApi = {
  submit: (data) => api.post('/enquiries', data),
  getAll: (params) => api.get('/enquiries', { params }),
  updateStatus: (id, status) => api.patch(`/enquiries/${id}/status`, { status }),
};

export const analyticsApi = {
  dashboard: () => api.get('/analytics/dashboard'),
  topListings: () => api.get('/analytics/top-listings'),
};

export const agentsApi = {
  getAll: () => api.get('/agents'),
  updateStatus: (id, is_active) => api.patch(`/agents/${id}/status`, { is_active }),
  create: (data) => api.post('/auth/register', data),
};

export const chatApi = {
  send: (messages, listing_context) => api.post('/chat', { messages, listing_context }),
};

export default api;
