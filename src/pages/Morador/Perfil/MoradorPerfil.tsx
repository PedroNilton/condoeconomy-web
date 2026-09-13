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
        { icon: <Bell className="w-5 h-5" />, label: 'Notificações', route: '/app/perfil/notificacoes' },
        { icon: <ShieldCheck className="w-5 h-5" />, label: 'Segurança e Senha', route: '/app/perfil/seguranca' },
      ]
    },
    {
      title: 'Suporte',
      items: [
        { icon: <HelpCircle className="w-5 h-5" />, label: 'Central de Ajuda', route: '/app/perfil/ajuda' },
      ]
    }
  ];

  return (
    <div className="flex flex-col h-full">
      
      {/* Header Profile */}
      <div className="px-6 pt-12 pb-8">
        <div className="flex flex-col items-center">
          <div className="relative mb-4 shadow-lg rounded-full">
            <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center overflow-hidden border-2 border-slate-200 dark:border-slate-700">
              {foto ? (
                <img src={foto} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <UserCircle2 className="w-16 h-16 text-cyan-600 dark:text-cyan-400" />
              )}
            </div>
            <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm z-10"></div>
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white text-center">{nome}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Apto {apto} {bloco ? `• Bloco ${bloco}` : ''}</p>
        </div>
      </div>

      {/* Menu Options */}
      <div className="px-5 mt-2 space-y-6">
        
        {menuGroups.map((group, index) => (
          <div key={index}>
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-2">
              {group.title}
            </h3>
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700/50 overflow-hidden divide-y divide-slate-50 dark:divide-slate-700/50">
              {group.items.map((item, idx) => (
                <button 
                  key={idx}
                  onClick={() => {
                    if ((item as any).onClick) (item as any).onClick();
                    else if ((item as any).route) navigate((item as any).route);
                  }}
                  className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors active:bg-slate-100 dark:active:bg-slate-700/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700/30 p-2 rounded-xl">
                      {item.icon}
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-500" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Botão Sair */}
        <div className="pt-2">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-4 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-3xl transition-colors font-bold shadow-sm border border-rose-100 dark:border-rose-500/20 active:scale-[0.98]"
          >
            <LogOut className="w-5 h-5" />
            Sair do Aplicativo
          </button>
        </div>

      </div>

    </div>
  );
}
