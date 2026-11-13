import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string> | null = null;
api.interceptors.response.use(undefined, async (error) => {
  const original = error.config;
  const excluded = ['/login', '/register', '/refresh', '/logout'];
  if (error.response?.status !== 401 || !original || original._retried || excluded.some((path) => original.url?.endsWith(path))) {
    return Promise.reject(error);
  }
  original._retried = true;
  refreshing ??= api.post('/refresh').then(({ data }) => {
    useAuthStore.getState().login(data.token, data.user);
    return data.token as string;
  }).finally(() => { refreshing = null; });
  try {
    original.headers.Authorization = `Bearer ${await refreshing}`;
    return api(original);
  } catch (refreshError) {
    useAuthStore.getState().logout();
    return Promise.reject(refreshError);
  }
});

export default api;
