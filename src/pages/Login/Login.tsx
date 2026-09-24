import { Mail, Lock, Eye, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/v1/auth/login', { email, senha });
      const { token, papel, nome } = response.data;
      
      localStorage.setItem('@CondoEconomy:token', token);
      if (nome) localStorage.setItem('@CondoEconomy:nome', nome);
      
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
    <div className="min-h-screen bg-[#09090b] flex justify-center items-center p-4 font-sans selection:bg-cyan-900/30">
      
      <div className="w-full max-w-[420px] bg-[#18181b] rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden border border-white/5">
        
        {/* LOGO */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center">
            {/* Custom Triangle Logo */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3L22 20H2L12 3Z" fill="#22d3ee"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-white">Condo</span>
            <span className="text-cyan-400">Economy</span>
          </h1>
        </div>

        {/* HEADERS */}
        <div className="mb-8">
          <p className="text-[10px] font-black text-cyan-400 tracking-widest uppercase mb-3">Bem-vindo de volta</p>
          <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Acesse sua conta</h2>
          <p className="text-slate-400 text-sm">Gestão inteligente na palma da mão.</p>
        </div>

        {/* FORM */}
        <form onSubmit={handleLogin} className="space-y-6">
          
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-white">E-mail</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-500" />
              </div>
              <input 
                type="text" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-[#27272a] border border-transparent rounded-2xl focus:ring-2 focus:ring-cyan-400/50 outline-none transition-all text-white placeholder:text-slate-500 text-sm"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-white">Senha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-500" />
              </div>
              <input 
                type={showPassword ? "text" : "password"} 
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-[#27272a] border border-transparent rounded-2xl focus:ring-2 focus:ring-cyan-400/50 outline-none transition-all text-white placeholder:text-slate-500 text-sm tracking-widest"
                placeholder="••••••••"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
              >
                <Eye className={`h-5 w-5 ${showPassword ? 'text-cyan-400' : 'text-slate-500'} hover:text-slate-300 transition-colors`} />
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <a href="#" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors">Esqueci minha senha</a>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-400 hover:bg-cyan-300 text-cyan-950 font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                Entrar <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

        </form>

        {/* FOOTER */}
        <div className="mt-10 flex items-center justify-center gap-2 text-xs">
          <KeyRound className="w-4 h-4 text-cyan-500" />
          <span className="text-slate-500">Precisa de ajuda? <a href="#" className="text-slate-300 hover:text-white font-medium transition-colors">Fale com o síndico</a></span>
        </div>

      </div>
    </div>
  );
}
