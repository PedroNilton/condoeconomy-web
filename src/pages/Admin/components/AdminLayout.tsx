import { useEffect } from 'react';
import { Home, Megaphone, LogOut, Calendar, MessageSquareWarning } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

export function AdminLayout() {
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
      {/* Container Mobile/Tablet */}
      <div className="w-full max-w-md bg-gray-50 h-screen shadow-2xl flex flex-col relative overflow-hidden">
        
        {/* Header Administração */}
        <header className="bg-red-900 text-white flex justify-between items-center px-4 h-16 shrink-0 shadow-md z-10">
          <div>
            <h2 className="text-lg font-bold tracking-wider">SÍNDICO</h2>
            <p className="text-[10px] text-red-200 uppercase tracking-widest">Condomínio Jardins</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-10 h-10 bg-red-800 rounded-full flex items-center justify-center text-red-100 hover:bg-red-700 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-0 no-scrollbar relative">
          <Outlet />
        </main>

        {/* Tab Bar (Menu Inferior) */}
        <nav className="absolute bottom-0 w-full bg-white border-t border-gray-200 flex justify-around items-center h-16 px-1 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] z-50">
          <NavLink 
            to="/admin" 
            end
            className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Megaphone className="w-5 h-5" />
            <span className="text-[10px] font-medium">Mural</span>
          </NavLink>

          <NavLink 
            to="/admin/reservas" 
            className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] font-medium">Reservas</span>
          </NavLink>

          <NavLink 
            to="/admin/ouvidoria" 
            className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <MessageSquareWarning className="w-5 h-5" />
            <span className="text-[10px] font-medium">Ouvidoria</span>
          </NavLink>

          <NavLink 
            to="/admin/painel" 
            className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Finanças</span>
          </NavLink>
        </nav>
      </div>
    </div>
  );
}
