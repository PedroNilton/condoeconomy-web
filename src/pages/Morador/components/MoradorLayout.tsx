import { useEffect } from 'react';
import { Home, CalendarDays, Package, MessageSquare, User, Users } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { usePushNotifications } from '../../../hooks/usePushNotifications';

export function MoradorLayout() {
  const navigate = useNavigate();

  usePushNotifications();

  useEffect(() => {
    const token = localStorage.getItem('@CondoEconomy:token');
    if (!token) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-800 flex justify-center">
      {/* Container que simula a tela do celular (Max Width) */}
      <div className="w-full max-w-md bg-gray-50 dark:bg-gray-900 h-screen shadow-2xl flex flex-col relative overflow-hidden">
        
        {/* Conteúdo Principal (scrollável) */}
        <main className="flex-1 overflow-y-auto pb-20 no-scrollbar">
          <Outlet />
        </main>

        {/* Tab Bar (Menu Inferior Mobile) */}
        <nav className="absolute bottom-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-around items-center h-16 px-2 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] z-50">
          
          <NavLink 
            to="/app" 
            end
            className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600 dark:text-gray-300'}`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Início</span>
          </NavLink>

          <NavLink 
            to="/app/reservas" 
            className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600 dark:text-gray-300'}`}
          >
            <CalendarDays className="w-5 h-5" />
            <span className="text-[10px] font-medium">Reservas</span>
          </NavLink>

          <NavLink 
            to="/app/encomendas" 
            className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600 dark:text-gray-300'}`}
          >
            <Package className="w-5 h-5" />
            <span className="text-[10px] font-medium">Encomendas</span>
          </NavLink>

          <NavLink 
            to="/app/ouvidoria" 
            className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600 dark:text-gray-300'}`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] font-medium">Ouvidoria</span>
          </NavLink>

          <NavLink 
            to="/app/visitantes" 
            className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600 dark:text-gray-300'}`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-medium">Visitantes</span>
          </NavLink>

          <NavLink 
            to="/app/perfil" 
            className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600 dark:text-gray-300'}`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">Perfil</span>
          </NavLink>

        </nav>
      </div>
    </div>
  );
}
