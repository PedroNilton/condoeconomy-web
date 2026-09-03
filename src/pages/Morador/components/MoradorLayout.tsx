import { useEffect } from 'react';
import { Home, CalendarDays, FileText, MessageSquare, User } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

export function MoradorLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('@CondoEconomy:token');
    if (!token) {
      navigate('/app/login', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      {/* Container que simula a tela do celular (Max Width) */}
      <div className="w-full max-w-md bg-gray-50 h-screen shadow-2xl flex flex-col relative overflow-hidden">
        
        {/* Conteúdo Principal (scrollável) */}
        <main className="flex-1 overflow-y-auto pb-20 no-scrollbar">
          <Outlet />
        </main>

        {/* Tab Bar (Menu Inferior Mobile) */}
        <nav className="absolute bottom-0 w-full bg-white border-t border-gray-200 flex justify-around items-center h-16 px-2 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] z-50">
          
          <NavLink 
            to="/app" 
            end
            className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-medium">Início</span>
          </NavLink>

          <NavLink 
            to="/app/reservas" 
            className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <CalendarDays className="w-6 h-6" />
            <span className="text-[10px] font-medium">Reservas</span>
          </NavLink>

          <NavLink 
            to="/app/boletos" 
            className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <FileText className="w-6 h-6" />
            <span className="text-[10px] font-medium">Boletos</span>
          </NavLink>

          <NavLink 
            to="/app/ouvidoria" 
            className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <MessageSquare className="w-6 h-6" />
            <span className="text-[10px] font-medium">Ouvidoria</span>
          </NavLink>

          <NavLink 
            to="/app/perfil" 
            className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <User className="w-6 h-6" />
            <span className="text-[10px] font-medium">Perfil</span>
          </NavLink>

        </nav>
      </div>
    </div>
  );
}
