import { useState, useEffect } from 'react';
import { 
  Package, CalendarDays, 
  MessageSquare, LogOut, UserCheck, ChevronLeft, ChevronRight, Building2, HelpCircle
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

export function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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
    <div className="flex h-screen bg-gray-50 font-sans">
      
      {/* Sidebar Lateral */}
      <aside className={`bg-blue-950 text-white flex flex-col h-full shadow-xl transition-all duration-300 relative ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        
        {/* Botão de Toggle */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3.5 top-8 bg-blue-800 text-blue-200 p-1.5 rounded-full shadow-md hover:text-white hover:bg-blue-700 transition-colors z-10 border border-blue-900"
          title={isSidebarOpen ? "Recolher menu" : "Expandir menu"}
        >
          {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* Logo / Título */}
        <div className={`py-6 flex items-center border-b border-blue-900/50 ${isSidebarOpen ? 'px-6 gap-3' : 'px-4 justify-center'}`}>
          <Building2 className="w-8 h-8 text-blue-400 shrink-0" />
          {isSidebarOpen && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold tracking-wide">PORTARIA</h1>
              <p className="text-xs text-blue-300 whitespace-nowrap">Condomínio Jardins</p>
            </div>
          )}
        </div>

        {/* Menu de Navegação */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto overflow-x-hidden no-scrollbar">
          
          <NavLink 
            to="/dashboard"
            className={({ isActive }) => 
              `flex items-center py-3 rounded-lg transition-colors ${isSidebarOpen ? 'px-4 gap-3' : 'px-0 justify-center'} ${
                isActive ? 'bg-blue-800/80 text-white font-medium' : 'text-blue-100 hover:bg-blue-900/50'
              }`
            }
            title={!isSidebarOpen ? "Visão Geral" : undefined}
          >
            <Building2 className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="whitespace-nowrap">Visão Geral</span>}
          </NavLink>

          <NavLink 
            to="/dashboard/visitantes"
            className={({ isActive }) => 
              `flex items-center py-3 rounded-lg transition-colors ${isSidebarOpen ? 'px-4 gap-3' : 'px-0 justify-center'} ${
                isActive ? 'bg-blue-800/80 text-white font-medium' : 'text-blue-100 hover:bg-blue-900/50'
              }`
            }
            title={!isSidebarOpen ? "Visitantes" : undefined}
          >
            <UserCheck className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="whitespace-nowrap">Visitantes</span>}
          </NavLink>

          <NavLink 
            to="/dashboard/encomendas"
            className={({ isActive }) => 
              `flex items-center py-3 rounded-lg transition-colors ${isSidebarOpen ? 'px-4 gap-3' : 'px-0 justify-center'} ${
                isActive ? 'bg-blue-800/80 text-white font-medium' : 'text-blue-100 hover:bg-blue-900/50'
              }`
            }
            title={!isSidebarOpen ? "Encomendas" : undefined}
          >
            <Package className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="whitespace-nowrap">Encomendas</span>}
          </NavLink>

          <div className="pt-4 pb-2">
            <p className={`text-xs font-semibold text-blue-400 uppercase tracking-wider ${isSidebarOpen ? 'px-4' : 'text-center'}`}>
              {isSidebarOpen ? 'Administração' : '...'}
            </p>
          </div>

          <NavLink 
            to="/dashboard/reservas"
            className={({ isActive }) => 
              `flex items-center py-3 rounded-lg transition-colors ${isSidebarOpen ? 'px-4 gap-3' : 'px-0 justify-center'} ${
                isActive ? 'bg-blue-800/80 text-white font-medium' : 'text-blue-100 hover:bg-blue-900/50'
              }`
            }
            title={!isSidebarOpen ? "Reservas" : undefined}
          >
            <CalendarDays className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="whitespace-nowrap">Reservas</span>}
          </NavLink>

          <NavLink 
            to="/dashboard/chamados"
            className={({ isActive }) => 
              `flex items-center py-3 rounded-lg transition-colors ${isSidebarOpen ? 'px-4 gap-3' : 'px-0 justify-center'} ${
                isActive ? 'bg-blue-800/80 text-white font-medium' : 'text-blue-100 hover:bg-blue-900/50'
              }`
            }
            title={!isSidebarOpen ? "Ouvidoria" : undefined}
          >
            <MessageSquare className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="whitespace-nowrap">Ouvidoria</span>}
          </NavLink>

        </nav>

        {/* Rodapé da Sidebar */}
        <div className={`p-4 border-t border-blue-900/50 space-y-2 ${!isSidebarOpen && 'flex flex-col items-center px-2'}`}>
          <button 
            className={`flex items-center rounded-lg text-blue-200 hover:bg-blue-900/50 transition-colors text-sm ${isSidebarOpen ? 'w-full gap-3 px-4 py-2' : 'p-3 justify-center'}`}
            title={!isSidebarOpen ? "Ajuda e Suporte" : undefined}
          >
            <HelpCircle className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="whitespace-nowrap">Ajuda e Suporte</span>}
          </button>
          
          <button 
            onClick={handleLogout}
            className={`flex items-center rounded-lg text-red-300 hover:bg-red-900/30 transition-colors text-sm ${isSidebarOpen ? 'w-full gap-3 px-4 py-2' : 'p-3 justify-center'}`}
            title={!isSidebarOpen ? "Sair do Sistema" : undefined}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="whitespace-nowrap">Sair do Sistema</span>}
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal (Direita) */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Header Superior */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
          <h2 className="text-xl font-semibold text-gray-800">Painel de Gestão</h2>
          
          {/* Perfil do Usuário */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-gray-700">Carlos Silva</p>
              <p className="text-xs text-green-600 flex items-center gap-1 justify-end">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Porteiro Ativo
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
              CS
            </div>
          </div>
        </header>

        {/* Área renderizável das rotas filhas */}
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>

    </div>
  );
}
