import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

type Role = 'sindico' | 'portaria' | 'morador';

const roleSubtitles = {
  sindico: 'Painel da administração — financeiro, reservas e ouvidoria.',
  portaria: 'Encomendas, visitantes e prestadores de serviço.',
  morador: 'Seus boletos, reservas e chamados em um só lugar.'
};

const demoCredentials = {
  sindico: 'sindico@condominio.com',
  portaria: 'porteiro@condominio.com',
  morador: 'carlos.silva@email.com'
};

export function Login() {
  const [activeRole, setActiveRole] = useState<Role>('sindico');
  const [email, setEmail] = useState(demoCredentials.sindico);
  const [senha, setSenha] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Auto-fill demo credentials when changing tabs (for testing convenience)
  useEffect(() => {
    setEmail(demoCredentials[activeRole]);
    setSenha('123456');
    setError('');
  }, [activeRole]);

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
    <div 
      className="min-h-screen flex items-center justify-center p-4 font-sans text-ds-text"
      style={{
        backgroundColor: 'var(--color-ds-bg)',
        backgroundImage: `linear-gradient(var(--color-ds-card) 1px, transparent 1px), linear-gradient(90deg, var(--color-ds-card) 1px, transparent 1px)`,
        backgroundSize: '34px 34px'
      }}
    >
      <main className="w-full max-w-[392px]">
        
        {/* Brand */}
        <div className="flex items-center gap-2 mb-7">
          <div className="w-[26px] h-[26px] rounded-[7px] bg-ds-primary grid place-items-center flex-none">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="6" width="4.5" height="9" fill="white"/>
              <rect x="6.2" y="1" width="4.5" height="14" fill="white" fillOpacity=".85"/>
              <rect x="11.4" y="4" width="3.6" height="11" fill="white" fillOpacity=".7"/>
            </svg>
          </div>
          <span className="font-extrabold text-[16px] tracking-tight text-ds-text">CondoEconomy</span>
        </div>

        {/* Card */}
        <div className="bg-ds-card border border-ds-border rounded-[16px] p-7 shadow-[0_1px_2px_rgba(0,0,0,0.1),0_20px_40px_-28px_rgba(0,0,0,0.3)]">
          <h1 className="text-[19px] font-bold m-0 mb-1 tracking-tight text-ds-text">Entrar</h1>
          <p className="text-ds-dim text-[13.5px] m-0 mb-5 min-h-[20px] leading-relaxed">
            {roleSubtitles[activeRole]}
          </p>

          <form onSubmit={handleLogin} noValidate>
            
            {/* Roles Picker */}
            <div className="grid grid-cols-3 bg-ds-bg border border-ds-border rounded-[10px] p-[3px] gap-[3px] mb-6">
              {(['sindico', 'portaria', 'morador'] as Role[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setActiveRole(role)}
                  className={`flex items-center justify-center text-[12.5px] font-semibold py-2 px-1 rounded-lg transition-colors capitalize ${
                    activeRole === role 
                      ? 'bg-ds-primary-dim text-ds-primary' 
                      : 'text-ds-dim hover:text-ds-text'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            {error && (
              <div className="bg-ds-danger-dim border border-ds-danger/20 text-ds-danger p-3 rounded-lg text-xs font-semibold mb-4 text-center">
                {error}
              </div>
            )}

            {/* Fields */}
            <div className="mb-4">
              <label className="block text-[12.5px] font-semibold mb-1.5 text-ds-text">E-mail</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-3 py-2.5 rounded-lg border border-ds-border bg-ds-bg text-ds-text text-[14px] focus:outline-none focus:ring-2 focus:ring-ds-primary focus:border-transparent placeholder:text-ds-dim transition-shadow"
                required
              />
            </div>

            <div className="mb-5">
              <label className="block text-[12.5px] font-semibold mb-1.5 text-ds-text">Senha</label>
              <input 
                type="password" 
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-lg border border-ds-border bg-ds-bg text-ds-text text-[14px] focus:outline-none focus:ring-2 focus:ring-ds-primary focus:border-transparent placeholder:text-ds-dim transition-shadow"
                required
              />
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between mt-0.5 mb-5 text-[12.5px]">
              <label className="flex items-center gap-2 text-ds-dim cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-ds-primary w-3.5 h-3.5 rounded-sm" /> 
                <span className="mt-[1px]">Lembrar de mim</span>
              </label>
              <a href="#" className="text-ds-primary font-semibold hover:underline">Esqueci minha senha</a>
            </div>

            {/* Submit */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full p-3 border-none rounded-lg bg-ds-primary text-ds-primary-ink font-bold text-[14.5px] cursor-pointer hover:brightness-110 active:translate-y-[1px] transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar'}
            </button>

            {/* Footer Status */}
            <div className="mt-5 pt-4 border-t border-ds-border flex items-center justify-between font-mono text-[11px] text-ds-dim">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-ds-success animate-pulse"></span>
                <span>Sincronização em tempo real ativa</span>
              </div>
              <a href="#" className="hover:text-ds-text transition-colors">Precisa de ajuda?</a>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}
