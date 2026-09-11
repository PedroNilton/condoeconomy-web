import axios from 'axios';

// Instância base do Axios apontando para a nossa API Java local
const api = axios.create({
  baseURL: `http://${window.location.hostname}:8080`,
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

// Interceptor para tratar token expirado (401/403)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Evitar loop de redirecionamento se já estiver na tela de login
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        localStorage.removeItem('@CondoEconomy:token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
