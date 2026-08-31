import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Lock, Mail, ArrowRight } from 'lucide-react';
import api from '../../services/api';

export function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Integração real com o endpoint do back-end Java
      const response = await api.post('/api/v1/auth/login', { email, senha });
      
      const { token } = response.data;
      localStorage.setItem('@CondoEconomy:token', token);
      
      // Redireciona para o painel principal após o login
      navigate('/dashboard');
    } catch (err) {
      setError('Credenciais inválidas. Verifique seu e-mail e senha.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        
        {/* Header/Logo */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="bg-blue-900 p-3 rounded-lg mb-4 shadow-md shadow-blue-200">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CondoEconomy</h1>
          <p className="text-sm text-gray-500 mt-1">Acesso à Portaria e Gestão</p>
        </div>

        {/* Formulário de Login */}
        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm text-center border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail corporativo</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-600 focus:border-blue-600 sm:text-sm transition-colors outline-none"
                placeholder="porteiro@condominio.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-600 focus:border-blue-600 sm:text-sm transition-colors outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Autenticando...' : 'Entrar no Sistema'}
            {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-gray-400">
          <p>© 2026 CondoEconomy. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
