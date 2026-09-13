import { useEffect } from 'react';
import { Home, CalendarDays, Package, MessageSquare, User, Users } from 'lucide-react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { usePushNotifications } from '../../../hooks/usePushNotifications';

export function MoradorLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  usePushNotifications();

  useEffect(() => {
    const token = localStorage.getItem('@CondoEconomy:token');
    if (!token) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex justify-center font-sans selection:bg-cyan-100 dark:selection:bg-cyan-900/30">
      {/* Container que simula a tela do celular (Max Width) */}
      <div className="w-full max-w-md bg-white dark:bg-slate-950 h-screen shadow-[0_0_50px_-15px_rgba(0,0,0,0.1)] flex flex-col relative overflow-hidden">
        
        {/* Conteúdo Principal (scrollável) */}
        <main className="flex-1 overflow-y-auto pb-28 no-scrollbar bg-slate-50/50 dark:bg-slate-900/20">
          <Outlet />
        </main>

        {/* Floating Premium Tab Bar */}
        <div className="absolute bottom-6 w-full px-4 z-50">
          <nav className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl border border-gray-100 dark:border-slate-700 rounded-3xl flex justify-around items-center h-16 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] px-1">
            
            <NavLink 
              to="/app" 
              end
              className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isActive ? 'text-cyan-600 dark:text-cyan-400 scale-110' : 'text-slate-400 hover:text-slate-600 dark:text-slate-400'}`}
            >
              <Home className={`w-5 h-5 ${location.pathname === '/app' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            </NavLink>

            <NavLink 
              to="/app/reservas" 
              className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isActive ? 'text-cyan-600 dark:text-cyan-400 scale-110' : 'text-slate-400 hover:text-slate-600 dark:text-slate-400'}`}
            >
              <CalendarDays className={`w-5 h-5 ${location.pathname.includes('/reservas') ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            </NavLink>

            <NavLink 
              to="/app/encomendas" 
              className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isActive ? 'text-cyan-600 dark:text-cyan-400 scale-110' : 'text-slate-400 hover:text-slate-600 dark:text-slate-400'}`}
            >
              <Package className={`w-5 h-5 ${location.pathname.includes('/encomendas') ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            </NavLink>

            <NavLink 
              to="/app/ouvidoria" 
              className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isActive ? 'text-cyan-600 dark:text-cyan-400 scale-110' : 'text-slate-400 hover:text-slate-600 dark:text-slate-400'}`}
            >
              <MessageSquare className={`w-5 h-5 ${location.pathname.includes('/ouvidoria') ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            </NavLink>

            <NavLink 
              to="/app/visitantes" 
              className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isActive ? 'text-cyan-600 dark:text-cyan-400 scale-110' : 'text-slate-400 hover:text-slate-600 dark:text-slate-400'}`}
            >
              <Users className={`w-5 h-5 ${location.pathname.includes('/visitantes') ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            </NavLink>

            <NavLink 
              to="/app/perfil" 
              className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isActive ? 'text-cyan-600 dark:text-cyan-400 scale-110' : 'text-slate-400 hover:text-slate-600 dark:text-slate-400'}`}
            >
              <User className={`w-5 h-5 ${location.pathname.includes('/perfil') ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            </NavLink>

          </nav>
        </div>
      </div>
    </div>
  );
}
