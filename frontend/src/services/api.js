import axios from 'axios';
import { useAuthStore } from '../store/auth.store.js';
export const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003/api', withCredentials:true });
api.interceptors.request.use((config)=>{ const token = useAuthStore.getState().accessToken; if (token) config.headers.Authorization = `Bearer ${token}`; return config; });
api.interceptors.response.use(r=>r, async err=>{ if(err.response?.status===401 && !err.config.__retried){ err.config.__retried=true; const { data } = await api.post('/auth/refresh'); useAuthStore.getState().setSession(data); err.config.headers.Authorization=`Bearer ${data.accessToken}`; return api(err.config); } throw err; });
