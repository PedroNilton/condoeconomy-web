import { useNavigate } from 'react-router-dom';
import { 
  UserCircle2, 
  Car, 
  Users, 
  Bell, 
  ShieldCheck, 
  HelpCircle, 
  LogOut, 
  ChevronRight,
  PawPrint
} from 'lucide-react';

export function MoradorPerfil() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Limpar auth tokens (simulação MVP)
    navigate('/app/login');
  };

  const menuGroups = [
    {
      title: 'Minha Unidade',
      items: [
        { icon: <UserCircle2 className="w-5 h-5" />, label: 'Dados Pessoais' },
        { icon: <Users className="w-5 h-5" />, label: 'Moradores Adicionais' },
        { icon: <PawPrint className="w-5 h-5" />, label: 'Meus Pets' },
        { icon: <Car className="w-5 h-5" />, label: 'Meus Veículos' },
      ]
    },
    {
      title: 'Configurações',
      items: [
        { icon: <Bell className="w-5 h-5" />, label: 'Notificações' },
        { icon: <ShieldCheck className="w-5 h-5" />, label: 'Segurança e Senha' },
      ]
    },
    {
      title: 'Suporte',
      items: [
        { icon: <HelpCircle className="w-5 h-5" />, label: 'Central de Ajuda' },
      ]
    }
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-20 overflow-y-auto">
      
      {/* Header Profile */}
      <div className="bg-blue-600 px-6 pt-12 pb-8 rounded-b-[40px] shadow-md">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mb-4 border-4 border-blue-500 relative">
            <UserCircle2 className="w-16 h-16 text-blue-300" />
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <h2 className="text-xl font-bold text-white text-center">Carlos Silva</h2>
          <p className="text-blue-200 text-sm font-medium mt-1">Apto 101 • Bloco B</p>
          <span className="mt-3 px-3 py-1 bg-blue-700/50 text-blue-100 text-xs font-semibold rounded-full border border-blue-500/50">
            Proprietário
          </span>
        </div>
      </div>

      {/* Menu Options */}
      <div className="px-5 mt-6 space-y-6">
        
        {menuGroups.map((group, index) => (
          <div key={index}>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">
              {group.title}
            </h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
              {group.items.map((item, idx) => (
                <button 
                  key={idx}
                  className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors active:bg-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-gray-400">
                      {item.icon}
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Botão Sair */}
        <div className="pt-2">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl transition-colors font-bold shadow-sm border border-red-100 active:scale-[0.98]"
          >
            <LogOut className="w-5 h-5" />
            Sair do Aplicativo
          </button>
        </div>

      </div>

    </div>
  );
}
