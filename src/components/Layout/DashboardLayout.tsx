import { Building2, Package, Users, CalendarDays, BarChart3, HelpCircle, LogOut } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

export function DashboardLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('@CondoEconomy:token');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      
      {/* Sidebar Lateral */}
      <aside className="w-64 bg-blue-950 text-white flex flex-col h-full shadow-xl">
        {/* Logo / Título */}
        <div className="p-6 flex items-center gap-3 border-b border-blue-900/50">
          <Building2 className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-lg font-bold tracking-wide">PORTARIA</h1>
            <p className="text-xs text-blue-300">Condomínio Jardins</p>
          </div>
        </div>

        {/* Menu de Navegação */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          
          <NavLink 
            to="/dashboard"
            end
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-blue-800/80 text-white font-medium' : 'text-blue-100 hover:bg-blue-900/50'
              }`
            }
          >
            <BarChart3 className="w-5 h-5" />
            Dashboard
          </NavLink>

          <NavLink 
            to="/dashboard/encomendas"
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-blue-800/80 text-white font-medium' : 'text-blue-100 hover:bg-blue-900/50'
              }`
            }
          >
            <Package className="w-5 h-5" />
            Encomendas
          </NavLink>

          <NavLink 
            to="/dashboard/visitantes"
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-blue-800/80 text-white font-medium' : 'text-blue-100 hover:bg-blue-900/50'
              }`
            }
          >
            <Users className="w-5 h-5" />
            Visitantes
          </NavLink>

          <div className="pt-4 pb-2">
            <p className="px-4 text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Administração
            </p>
          </div>

          <NavLink 
            to="/dashboard/reservas"
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-blue-800/80 text-white font-medium' : 'text-blue-100 hover:bg-blue-900/50'
              }`
            }
          >
            <CalendarDays className="w-5 h-5" />
            Reservas
          </NavLink>

        </nav>

        {/* Rodapé da Sidebar */}
        <div className="p-4 border-t border-blue-900/50 space-y-2">
          <button className="flex w-full items-center gap-3 px-4 py-2 rounded-lg text-blue-200 hover:bg-blue-900/50 transition-colors text-sm">
            <HelpCircle className="w-4 h-4" />
            Ajuda e Suporte
          </button>
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-2 rounded-lg text-red-300 hover:bg-red-900/30 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sair do Sistema
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
