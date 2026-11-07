import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';

export function DashboardLayout() {
  const navigate = useNavigate();
  const { counts } = useNotification();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const token = localStorage.getItem('@HabitOS:token');
    if (!token) {
      navigate('/login', { replace: true });
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

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative flex flex-col items-center gap-[4px] no-underline text-[9.5px] font-semibold transition-colors ${
      isActive ? 'text-ds-primary' : 'text-ds-faint hover:text-ds-dim'
    }`;

  return (
    <div className="min-h-screen bg-ds-bg text-ds-text font-sans flex justify-center selection:bg-ds-primary-dim">
      <div className="w-full max-w-[412px] min-h-screen min-h-dvh flex flex-col bg-ds-bg">
        {/* Header Superior */}
        <header className="pt-[calc(16px+env(safe-area-inset-top,0px))] px-[18px] pb-[12px] flex justify-between items-center">
          <div>
            <div className="text-[19px] font-extrabold tracking-[-0.01em] text-ds-text leading-tight">
              Portaria
            </div>
            <div className="font-mono text-[10.5px] text-ds-primary font-semibold mt-[2px] uppercase">
              Condomínio Mar Egeu
            </div>
          </div>

          <div className="flex gap-[8px]">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Alternar tema"
              title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
              className="w-[40px] h-[40px] rounded-[11px] border border-ds-border bg-ds-card grid place-items-center text-ds-text cursor-pointer hover:border-ds-border-strong transition-colors"
            >
              {theme === 'dark' ? (
                <svg
                  className="w-[18px] h-[18px]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              ) : (
                <svg
                  className="w-[18px] h-[18px]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              aria-label="Sair"
              title="Sair"
              className="w-[40px] h-[40px] rounded-[11px] border border-ds-border bg-ds-card grid place-items-center text-ds-text cursor-pointer hover:border-ds-danger/40 hover:text-ds-danger transition-colors"
            >
              <svg
                className="w-[18px] h-[18px]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="M16 17l5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
            </button>
          </div>
        </header>

        {/* Conteúdo Principal */}
        <main className="flex-1 pt-[4px] px-[18px] pb-[110px] flex flex-col gap-[22px]">
          <Outlet />
        </main>

        {/* Barra de Navegação Inferior Fixa */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[412px] bg-ds-card border-t border-ds-border pt-[9px] px-[4px] pb-[calc(9px+env(safe-area-inset-bottom,0px))] grid grid-cols-6 z-[5]">
          <NavLink to="/portaria" end className={navLinkClass}>
            <svg
              className="w-[20px] h-[20px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 10 12 3l9 7" />
              <path d="M5 9v11h14V9" />
            </svg>
            <span>Início</span>
          </NavLink>

          <NavLink to="/portaria/visitantes" className={navLinkClass}>
            <svg
              className="w-[20px] h-[20px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="m16 11 2 2 4-4" />
            </svg>
            <span>Visitantes</span>
            {counts.visitantesAguardando > 0 && (
              <span className="absolute -top-[5px] left-[calc(50%+4px)] bg-ds-primary text-white text-[9px] font-bold min-w-[15px] h-[15px] rounded-full grid place-items-center px-[4px]">
                {counts.visitantesAguardando}
              </span>
            )}
          </NavLink>

          <NavLink to="/portaria/encomendas" className={navLinkClass}>
            <svg
              className="w-[20px] h-[20px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
              <path d="M3 8l9 5 9-5M12 13v8" />
            </svg>
            <span>Encomendas</span>
            {counts.encomendasPendentes > 0 && (
              <span className="absolute -top-[5px] left-[calc(50%+4px)] bg-ds-primary text-white text-[9px] font-bold min-w-[15px] h-[15px] rounded-full grid place-items-center px-[4px]">
                {counts.encomendasPendentes}
              </span>
            )}
          </NavLink>

          <NavLink to="/portaria/reservas" className={navLinkClass}>
            <svg
              className="w-[20px] h-[20px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M16 3v4M8 3v4M3 11h18" />
            </svg>
            <span>Reservas</span>
            {counts.reservasAdmin > 0 && (
              <span className="absolute -top-[5px] left-[calc(50%+4px)] bg-ds-primary text-white text-[9px] font-bold min-w-[15px] h-[15px] rounded-full grid place-items-center px-[4px]">
                {counts.reservasAdmin}
              </span>
            )}
          </NavLink>

          <NavLink to="/portaria/chamados" className={navLinkClass}>
            <svg
              className="w-[20px] h-[20px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>Ouvidoria</span>
            {counts.chamadosPortaria > 0 && (
              <span className="absolute -top-[5px] left-[calc(50%+4px)] bg-ds-primary text-white text-[9px] font-bold min-w-[15px] h-[15px] rounded-full grid place-items-center px-[4px]">
                {counts.chamadosPortaria}
              </span>
            )}
          </NavLink>

          <NavLink to="/portaria/veiculos" className={navLinkClass}>
            <svg
              className="w-[20px] h-[20px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 13l2-5a2 2 0 0 1 2-1.3h10a2 2 0 0 1 2 1.3l2 5v5H3z" />
              <circle cx="7.5" cy="18" r="1.5" />
              <circle cx="16.5" cy="18" r="1.5" />
            </svg>
            <span>Veículos</span>
          </NavLink>
        </nav>
      </div>
    </div>
  );
}
