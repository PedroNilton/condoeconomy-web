import axios from 'axios';

// Instância base do Axios apontando para a nossa API Java local
const api = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 10000,
});

// Interceptor para adicionar o token JWT nas requisições, caso ele exista
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@CondoEconomy:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
