import { Building2, ArrowRight, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

export function MoradorLogin() {
  const [email, setEmail] = useState('carlos.silva@email.com');
  const [senha, setSenha] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/v1/auth/login', { email, senha });
      localStorage.setItem('@CondoEconomy:token', response.data.token);
      navigate('/app');
    } catch (err) {
      setError('Credenciais inválidas.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-md bg-white h-screen flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Background Decorativo */}
        <div className="absolute top-0 w-full h-64 bg-gradient-to-br from-blue-700 to-blue-950 rounded-b-[40px] shadow-lg"></div>

        <div className="relative z-10 flex flex-col h-full px-8 pt-20">
          
          <div className="flex flex-col items-center mb-12">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-4">
              <Building2 className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">CondoEconomy</h1>
            <p className="text-blue-100 text-sm mt-1">O app do seu condomínio</p>
          </div>

          <div className="flex-1">
            <form onSubmit={handleLogin} className="space-y-5 mt-10">
              
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-100 p-3 rounded-lg text-sm text-center">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">E-mail ou CPF</label>
                <input 
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-gray-700">Senha</label>
                  <a href="#" className="text-xs text-blue-600 font-medium">Esqueceu?</a>
                </div>
                <input 
                  type="password" 
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all"
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    Entrar
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

            </form>
          </div>

          <div className="pb-8 text-center">
            <p className="text-sm text-gray-500">
              Ainda não tem acesso? <br/>
              <a href="#" className="text-blue-600 font-semibold underline decoration-2 underline-offset-2">Fale com a portaria</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
