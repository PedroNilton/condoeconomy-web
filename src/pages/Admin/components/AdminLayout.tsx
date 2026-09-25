import { useEffect } from 'react';
import { Home, Megaphone, LogOut, Calendar, MessageSquareWarning, Vote } from 'lucide-react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useNotification } from '../../../contexts/NotificationContext';
import { ThemeToggle } from '../../../components/ThemeToggle';

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { counts } = useNotification();

  useEffect(() => {
    const token = localStorage.getItem('@CondoEconomy:token');
    if (!token) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('@CondoEconomy:token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-black flex justify-center font-sans selection:bg-ds-primary-dim">
      {/* Container Mobile/Tablet */}
      <div className="w-full max-w-md bg-ds-bg h-screen shadow-[0_0_50px_-15px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden border-x border-ds-border">
        
        {/* Header Administração */}
        <header className="bg-ds-bg/80 backdrop-blur-xl border-b border-ds-border flex justify-between items-center px-6 h-20 shrink-0 z-20 sticky top-0">
          <div className="flex flex-col">
            <h2 className="text-xl font-extrabold text-ds-text tracking-tight">SÍNDICO</h2>
            <p className="text-[11px] font-bold text-ds-primary uppercase tracking-widest mt-0.5">Condomínio Mar Egeu</p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button 
              onClick={handleLogout}
              className="w-10 h-10 rounded-full bg-ds-card flex items-center justify-center text-ds-dim hover:bg-ds-danger-dim hover:text-ds-danger transition-all border border-ds-border"
            >
              <LogOut className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pb-28 pt-2 px-4 no-scrollbar bg-ds-bg">
          <Outlet />
        </main>

        {/* Floating Premium Tab Bar */}
        <div className="absolute bottom-6 w-full px-4 z-50">
          <nav className="bg-ds-card/90 backdrop-blur-2xl border border-ds-border rounded-[16px] flex justify-around items-center h-16 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] px-1">
            <NavLink 
              to="/admin" 
              end
              className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isActive ? 'text-ds-primary scale-110' : 'text-ds-dim hover:text-ds-text'}`}
            >
              <Megaphone className={`w-5 h-5 ${location.pathname === '/admin' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            </NavLink>

            <NavLink 
              to="/admin/reservas" 
              className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full relative transition-all duration-300 ${isActive ? 'text-ds-primary scale-110' : 'text-ds-dim hover:text-ds-text'}`}
            >
              <div className="relative">
                <Calendar className={`w-5 h-5 ${location.pathname.includes('/reservas') ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {counts.reservasAdmin > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-ds-warning text-ds-warning-dim text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                    {counts.reservasAdmin}
                  </span>
                )}
              </div>
            </NavLink>

            <NavLink 
              to="/admin/assembleia" 
              className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full relative transition-all duration-300 ${isActive ? 'text-ds-primary scale-110' : 'text-ds-dim hover:text-ds-text'}`}
            >
              <Vote className={`w-5 h-5 ${location.pathname.includes('/assembleia') ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            </NavLink>

            <NavLink 
              to="/admin/ouvidoria" 
              className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full relative transition-all duration-300 ${isActive ? 'text-ds-primary scale-110' : 'text-ds-dim hover:text-ds-text'}`}
            >
              <div className="relative">
                <MessageSquareWarning className={`w-5 h-5 ${location.pathname.includes('/ouvidoria') ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {counts.chamadosAdmin > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-ds-warning text-ds-warning-dim text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                    {counts.chamadosAdmin}
                  </span>
                )}
              </div>
            </NavLink>

            <NavLink 
              to="/admin/painel" 
              className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isActive ? 'text-ds-primary scale-110' : 'text-ds-dim hover:text-ds-text'}`}
            >
              <Home className={`w-5 h-5 ${location.pathname.includes('/painel') ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            </NavLink>
          </nav>
        </div>
      </div>
    </div>
  );
}
