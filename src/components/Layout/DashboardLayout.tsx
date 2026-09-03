import { useEffect } from 'react';
import { Home, UserCheck, Package, CalendarDays, MessageSquare } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

export function DashboardLayout() {
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-gray-100 flex justify-center">
      {/* Container que simula a tela do celular/tablet */}
      <div className="w-full max-w-md bg-gray-50 h-screen shadow-2xl flex flex-col relative overflow-hidden">
        
        {/* Header Fixo no Topo */}
        <header className="bg-blue-900 text-white flex justify-between items-center px-4 h-16 shrink-0 shadow-md z-10">
          <div>
            <h2 className="text-lg font-bold tracking-wider">PORTARIA</h2>
            <p className="text-[10px] text-blue-200 uppercase tracking-widest">Condomínio Jardins</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-10 h-10 bg-blue-800 rounded-full flex items-center justify-center text-blue-100 hover:bg-red-500 hover:text-white transition-colors"
          >
            <Home className="w-5 h-5 hidden" /> {/* Dummy para manter import */}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </header>

        {/* Conteúdo Principal (scrollável) */}
        <main className="flex-1 overflow-y-auto pb-20 p-4 no-scrollbar">
          <Outlet />
        </main>

        {/* Tab Bar (Menu Inferior Mobile) */}
        <nav className="absolute bottom-0 w-full bg-white border-t border-gray-200 flex justify-around items-center h-16 px-2 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] z-50">
          
          <NavLink 
            to="/portaria" 
            end
            className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-medium">Início</span>
          </NavLink>

          <NavLink 
            to="/portaria/visitantes" 
            className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <UserCheck className="w-6 h-6" />
            <span className="text-[10px] font-medium">Visitantes</span>
          </NavLink>

          <NavLink 
            to="/portaria/encomendas" 
            className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Package className="w-6 h-6" />
            <span className="text-[10px] font-medium">Encomendas</span>
          </NavLink>

          <NavLink 
            to="/portaria/reservas" 
            className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <CalendarDays className="w-6 h-6" />
            <span className="text-[10px] font-medium">Reservas</span>
          </NavLink>

          <NavLink 
            to="/portaria/chamados" 
            className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <MessageSquare className="w-6 h-6" />
            <span className="text-[10px] font-medium">Ouvidoria</span>
          </NavLink>

        </nav>
      </div>
    </div>
  );
}
