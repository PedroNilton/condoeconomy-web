import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { 
  UserCircle2, 
  Car, 
  Users, 
  Bell, 
  ShieldCheck, 
  HelpCircle, 
  LogOut, 
  ChevronRight,
  PawPrint,
  Moon
} from 'lucide-react';

import { useTheme } from '../../../contexts/ThemeContext';

export function MoradorPerfil() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [nome, setNome] = useState('Carregando...');
  const [apto, setApto] = useState('');
  const [bloco, setBloco] = useState('');
  const [foto, setFoto] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/api/v1/perfil/dados');
        setNome(res.data.nome || 'Usuário');
        setApto(res.data.apartamento || 'S/N');
        setBloco(res.data.bloco || '');
        setFoto(res.data.foto || '');
      } catch (err) {
        console.error(err);
        setNome('Erro ao carregar');
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    // Limpar auth tokens
    localStorage.removeItem('@CondoEconomy:token');
    navigate('/login');
  };

  const menuGroups = [
    {
      title: 'Minha Unidade',
      items: [
        { icon: <UserCircle2 className="w-5 h-5" />, label: 'Dados Pessoais', route: '/app/perfil/dados' },
        { icon: <Users className="w-5 h-5" />, label: 'Moradores Adicionais', route: '/app/perfil/adicionais' },
        { icon: <PawPrint className="w-5 h-5" />, label: 'Meus Pets', route: '/app/perfil/pets' },
        { icon: <Car className="w-5 h-5" />, label: 'Meus Veículos', route: '/app/perfil/veiculos' },
      ]
    },
    {
      title: 'Configurações',
      items: [
        { icon: <Moon className="w-5 h-5" />, label: theme === 'light' ? 'Modo Escuro' : 'Modo Claro', onClick: toggleTheme },
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
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 pb-20 overflow-y-auto">
      
      {/* Header Profile */}
      <div className="bg-blue-600 px-6 pt-12 pb-8 rounded-b-[40px] shadow-md">
        <div className="flex flex-col items-center">
          <div className="relative mb-4 shadow-lg rounded-full">
            <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center border-4 border-blue-500 overflow-hidden">
              {foto ? (
                <img src={foto} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <UserCircle2 className="w-16 h-16 text-blue-300" />
              )}
            </div>
            <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-sm z-10"></div>
          </div>
          <h2 className="text-xl font-bold text-white text-center">{nome}</h2>
          <p className="text-blue-200 text-sm font-medium mt-1">Apto {apto} {bloco ? `• Bloco ${bloco}` : ''}</p>
        </div>
      </div>

      {/* Menu Options */}
      <div className="px-5 mt-6 space-y-6">
        
        {menuGroups.map((group, index) => (
          <div key={index}>
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">
              {group.title}
            </h3>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
              {group.items.map((item, idx) => (
                <button 
                  key={idx}
                  onClick={() => {
                    if ((item as any).onClick) (item as any).onClick();
                    else if ((item as any).route) navigate((item as any).route);
                  }}
                  className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-700 transition-colors active:bg-gray-100 dark:bg-gray-800 dark:active:bg-gray-600"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-gray-400 dark:text-gray-500 dark:text-gray-400">
                      {item.icon}
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-500 dark:text-gray-400" />
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
