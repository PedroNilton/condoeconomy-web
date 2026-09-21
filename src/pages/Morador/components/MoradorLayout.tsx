import { useEffect } from 'react';
import { Home, CalendarDays, Receipt, Car, User } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-950 flex justify-center font-sans selection:bg-cyan-900/30">
      {/* Container que simula a tela do celular (Max Width) */}
      <div className="w-full max-w-[390px] bg-[#09090b] h-screen shadow-[0_0_50px_-15px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden ring-1 ring-white/5">
        
        {/* Conteúdo Principal (scrollável) */}
        <main className="flex-1 overflow-y-auto pb-24 no-scrollbar">
          <Outlet />
        </main>

        {/* Bottom Navigation Bar (OLED Style) */}
        <div className="absolute bottom-0 w-full z-50">
          <nav className="bg-[#09090b] border-t border-white/5 flex justify-around items-center h-[88px] px-2 pb-6 pt-2">
            
            <NavLink 
              to="/app" 
              end
              className={({ isActive }) => `flex flex-col items-center justify-center w-full gap-1 transition-all ${isActive ? 'text-white' : 'text-slate-500 hover:text-slate-400'}`}
            >
              <Home className={`w-6 h-6 ${location.pathname === '/app' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[10px] font-medium tracking-wide">Início</span>
            </NavLink>

            <NavLink 
              to="/app/boletos" 
              className={({ isActive }) => `flex flex-col items-center justify-center w-full gap-1 transition-all ${isActive ? 'text-white' : 'text-slate-500 hover:text-slate-400'}`}
            >
              <Receipt className={`w-6 h-6 ${location.pathname.includes('/boletos') ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[10px] font-medium tracking-wide">Boletos</span>
            </NavLink>

            <NavLink 
              to="/app/reservas" 
              className={({ isActive }) => `flex flex-col items-center justify-center w-full gap-1 transition-all ${isActive ? 'text-white' : 'text-slate-500 hover:text-slate-400'}`}
            >
              <CalendarDays className={`w-6 h-6 ${location.pathname.includes('/reservas') ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[10px] font-medium tracking-wide">Reservas</span>
            </NavLink>

            <NavLink 
              to="/app/perfil/veiculos" 
              className={({ isActive }) => `flex flex-col items-center justify-center w-full gap-1 transition-all ${isActive ? 'text-white' : 'text-slate-500 hover:text-slate-400'}`}
            >
              <Car className={`w-6 h-6 ${location.pathname.includes('/veiculos') ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[10px] font-medium tracking-wide">Veículos</span>
            </NavLink>

            <NavLink 
              to="/app/perfil" 
              className={({ isActive }) => `flex flex-col items-center justify-center w-full gap-1 transition-all ${isActive ? 'text-white' : 'text-slate-500 hover:text-slate-400'}`}
            >
              <User className={`w-6 h-6 ${location.pathname.includes('/perfil') && !location.pathname.includes('/veiculos') ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[10px] font-medium tracking-wide">Perfil</span>
            </NavLink>

          </nav>
        </div>
      </div>
    </div>
  );
}
