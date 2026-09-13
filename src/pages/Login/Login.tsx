import { Waves, ArrowRight, Loader2, Mail, Lock } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
      const response = await api.post('/api/v1/auth/login', { email, senha });
      const { token, papel } = response.data;
      
      localStorage.setItem('@CondoEconomy:token', token);
      
      if (papel === 'ROLE_PORTEIRO') {
        navigate('/portaria');
      } else if (papel === 'ROLE_ADMIN' || papel === 'ROLE_SINDICO') {
        navigate('/admin');
      } else {
        navigate('/app');
      }
      
    } catch (err) {
      setError('Credenciais inválidas.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 flex justify-center items-center relative p-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-cyan-500 rounded-full mix-blend-overlay filter blur-[120px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600 rounded-full mix-blend-overlay filter blur-[150px] opacity-30"></div>
      </div>

      <div className="w-full max-w-md z-10 flex flex-col">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl shadow-xl flex items-center justify-center mb-5 border border-white/20">
            <Waves className="w-8 h-8 text-cyan-300" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Condomínio Mar Egeu</h1>
          <p className="text-cyan-100 text-sm mt-1 opacity-80 font-medium">Gestão Inteligente</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
            
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-100 p-3 rounded-xl text-sm text-center font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-cyan-100/80 pl-1">E-mail ou CPF</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-cyan-100/50" />
                </div>
                <input 
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 outline-none transition-all text-white placeholder:text-white/30"
                  placeholder="exemplo@email.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center pl-1 pr-1">
                <label className="text-sm font-semibold text-cyan-100/80">Senha</label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-cyan-100/50" />
                </div>
                <input 
                  type="password" 
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 outline-none transition-all text-white placeholder:text-white/30"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex justify-end pt-1">
                <a href="#" className="text-xs text-cyan-200/80 hover:text-cyan-100 font-medium transition-colors">Esqueceu a senha?</a>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-[0_8px_20px_-6px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Acessar Plataforma'}
            </button>

          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-cyan-100/60">
            Ainda não tem acesso? <br/>
            <a href="#" className="text-white font-semibold underline decoration-white/30 underline-offset-4 hover:decoration-white transition-all">Fale com a portaria</a>
          </p>
        </div>
      </div>
    </div>
  );
}
