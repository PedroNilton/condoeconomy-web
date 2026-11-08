import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useNotification } from '../../../contexts/NotificationContext';
import { useTheme } from '../../../contexts/ThemeContext';
import api from '../../../services/api';

export function AdminLayout() {
  const navigate = useNavigate();
  const { counts } = useNotification();
  const { theme, toggleTheme } = useTheme();
  const [subtitulo, setSubtitulo] = useState('Síndica');

  useEffect(() => {
    const token = localStorage.getItem('@HabitOS:token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    try {
      const rawUser = localStorage.getItem('@HabitOS:user');
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        if (parsed?.nome) {
          const papel = parsed?.papel === 'ROLE_SINDICO' || parsed?.papel === 'ROLE_ADMIN' ? 'síndico(a)' : parsed?.papel?.replace('ROLE_', '').toLowerCase() || 'síndico';
          setSubtitulo(`${parsed.nome} (${papel})`);
        }
      }
    } catch {
      // mantém subtítulo padrão
    }
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } catch {
      // Ignora erro de rede no logout
    }
    localStorage.removeItem('@HabitOS:token');
    localStorage.removeItem('@HabitOS:user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-black flex justify-center font-sans selection:bg-ds-primary-dim">
      {/* Container Mobile Phone (412px) */}
      <div className="w-full max-w-[412px] min-h-screen min-h-[100dvh] bg-ds-bg flex flex-col relative overflow-hidden border-x border-ds-border">
        
        {/* Header Top Síndico */}
        <header className="pt-[calc(16px+env(safe-area-inset-top,0px))] px-[18px] pb-[6px] flex justify-between items-center bg-ds-bg/95 backdrop-blur-md z-30 sticky top-0 border-b border-ds-border/50">
          <div>
            <div className="text-[19px] font-extrabold tracking-[-0.01em] text-ds-text leading-tight">Síndico</div>
            <div className="font-mono text-[10.5px] text-ds-primary font-semibold mt-[2px] uppercase tracking-wide truncate max-w-[240px]">
              {subtitulo}
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              id="themeBtn"
              onClick={toggleTheme}
              className="w-10 h-10 rounded-[11px] border border-ds-border bg-ds-card flex items-center justify-center text-ds-text cursor-pointer hover:bg-ds-bg transition-colors"
              aria-label="Alternar tema"
              title="Alternar tema"
            >
              {theme === 'dark' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-[18px] h-[18px]">
                  <circle cx="12" cy="12" r="4"/>
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
            <button 
              onClick={handleLogout}
              className="w-10 h-10 rounded-[11px] border border-ds-border bg-ds-card flex items-center justify-center text-ds-text cursor-pointer hover:text-ds-danger hover:border-ds-danger transition-colors"
              aria-label="Sair"
              title="Sair"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <path d="M16 17l5-5-5-5"/>
                <path d="M21 12H9"/>
              </svg>
            </button>
          </div>
        </header>

        {/* Conteúdo Principal Scrollável */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <Outlet />
        </div>

        {/* Bottom Navigation Síndico */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[412px] bg-ds-card border-t border-ds-border py-[9px] px-1 pb-[calc(9px+env(safe-area-inset-bottom,0px))] grid grid-cols-5 z-40">
          <NavLink 
            to="/admin" 
            end
            className={({ isActive }) => `flex flex-col items-center gap-1 text-[9.5px] font-semibold relative transition-colors ${isActive ? 'text-ds-primary font-bold' : 'text-ds-faint hover:text-ds-text'}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="m3 11 18-5v12L3 14v-3z"/>
              <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
            </svg>
            <span>Avisos</span>
          </NavLink>

          <NavLink 
            to="/admin/reservas" 
            className={({ isActive }) => `flex flex-col items-center gap-1 text-[9.5px] font-semibold relative transition-colors ${isActive ? 'text-ds-primary font-bold' : 'text-ds-faint hover:text-ds-text'}`}
          >
            <div className="relative">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <rect x="3" y="5" width="18" height="16" rx="2"/>
                <path d="M16 3v4M8 3v4M3 11h18"/>
              </svg>
              {counts.reservasAdmin > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-ds-primary text-white text-[9px] font-bold min-w-[15px] h-[15px] rounded-full flex items-center justify-center px-1 shadow-sm">
                  {counts.reservasAdmin}
                </span>
              )}
            </div>
            <span>Reservas</span>
          </NavLink>

          <NavLink 
            to="/admin/assembleia" 
            className={({ isActive }) => `flex flex-col items-center gap-1 text-[9.5px] font-semibold relative transition-colors ${isActive ? 'text-ds-primary font-bold' : 'text-ds-faint hover:text-ds-text'}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <rect x="8" y="2" width="8" height="4" rx="1"/>
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
              <path d="m9 14 2 2 4-4"/>
            </svg>
            <span>Assembleia</span>
          </NavLink>

          <NavLink 
            to="/admin/ouvidoria" 
            className={({ isActive }) => `flex flex-col items-center gap-1 text-[9.5px] font-semibold relative transition-colors ${isActive ? 'text-ds-primary font-bold' : 'text-ds-faint hover:text-ds-text'}`}
          >
            <div className="relative">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                <path d="M12 7v4M12 14h.01"/>
              </svg>
              {counts.chamadosAdmin > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-ds-primary text-white text-[9px] font-bold min-w-[15px] h-[15px] rounded-full flex items-center justify-center px-1 shadow-sm">
                  {counts.chamadosAdmin}
                </span>
              )}
            </div>
            <span>Ouvidoria</span>
          </NavLink>

          <NavLink 
            to="/admin/painel" 
            className={({ isActive }) => `flex flex-col items-center gap-1 text-[9.5px] font-semibold relative transition-colors ${isActive ? 'text-ds-primary font-bold' : 'text-ds-faint hover:text-ds-text'}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M3 10 12 3l9 7"/>
              <path d="M5 9v11h14V9"/>
            </svg>
            <span>Condomínio</span>
          </NavLink>
        </nav>

      </div>
    </div>
  );
}
