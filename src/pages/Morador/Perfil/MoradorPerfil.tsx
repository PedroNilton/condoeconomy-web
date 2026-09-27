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
  Moon,
  QrCode
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
        setNome('Carlos Silva'); // Mock fallback matching HTML
        setApto('01');
        setBloco('AMORGOS');
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('@HabitOS:token');
    navigate('/login');
  };

  const getInitials = (name: string) => {
    if (name === 'Carregando...') return '...';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const menuGroups = [
    {
      title: 'Minha unidade',
      items: [
        { icon: <UserCircle2 className="w-[18px] h-[18px]" strokeWidth={2.5} />, label: 'Dados pessoais', route: '/app/perfil/dados' },
        { icon: <Users className="w-[18px] h-[18px]" strokeWidth={2.5} />, label: 'Moradores adicionais', route: '/app/perfil/adicionais' },
        { icon: <PawPrint className="w-[18px] h-[18px]" strokeWidth={2.5} />, label: 'Meus pets', route: '/app/perfil/pets' },
        { icon: <Car className="w-[18px] h-[18px]" strokeWidth={2.5} />, label: 'Meus veículos', route: '/app/perfil/veiculos' },
      ]
    },
    {
      title: 'Configurações',
      items: [
        { 
          icon: <Moon className="w-[18px] h-[18px]" strokeWidth={2.5} />, 
          label: 'Modo escuro', 
          isToggle: true, 
          isActive: theme === 'dark',
          onClick: toggleTheme 
        },
        { icon: <Bell className="w-[18px] h-[18px]" strokeWidth={2.5} />, label: 'Notificações', route: '/app/perfil/notificacoes' },
        { icon: <ShieldCheck className="w-[18px] h-[18px]" strokeWidth={2.5} />, label: 'Segurança e senha', route: '/app/perfil/seguranca' },
      ]
    },
    {
      title: 'Suporte',
      items: [
        { icon: <HelpCircle className="w-[18px] h-[18px]" strokeWidth={2.5} />, label: 'Central de ajuda', route: '/app/perfil/ajuda' },
      ]
    }
  ];

  return (
    <div className="bg-ds-bg min-h-screen flex flex-col pb-6 text-ds-text animate-in fade-in duration-300">
      
      {/* Header com os cards de Perfil e QR Code */}
      <header className="px-5 pt-8 pb-4">
        
        {/* Profile Card */}
        <div className="bg-ds-card border border-ds-border rounded-[20px] p-5 shadow-sm mb-4 flex flex-col items-center justify-center relative">
          <div className="relative mb-3">
            <div className="w-[68px] h-[68px] bg-ds-primary text-ds-primary-ink rounded-full flex items-center justify-center text-xl font-bold font-mono tracking-wider overflow-hidden">
              {foto ? <img src={foto} alt="Avatar" className="w-full h-full object-cover" /> : getInitials(nome)}
            </div>
            <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-ds-success rounded-full border-2 border-ds-card z-10"></div>
          </div>
          <div className="text-[17px] font-bold tracking-tight text-ds-text text-center">{nome}</div>
          <span className="text-[9px] font-bold tracking-widest text-ds-primary uppercase bg-ds-primary-dim px-2 py-0.5 rounded-full mt-1.5 mb-1">
            Morador
          </span>
          <div className="text-[11px] font-mono text-ds-dim uppercase tracking-wider mt-1.5">
            BLOCO-{bloco || 'UNICO'} • APTO-{apto}
          </div>
        </div>

        {/* QR Card */}
        <div 
          onClick={() => navigate('/app/qr')}
          className="bg-ds-card border border-ds-border rounded-[16px] p-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform shadow-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-ds-bg flex items-center justify-center border border-ds-border">
              <QrCode className="w-5 h-5 text-ds-text" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-[14px] font-bold text-ds-text tracking-tight mb-0.5">Meu QR de acesso</div>
              <div className="text-[11px] font-medium text-ds-dim">Mostrar na portaria</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-ds-dim" strokeWidth={2.5} />
        </div>

      </header>

      {/* Menu Options */}
      <main className="px-5 space-y-6">
        {menuGroups.map((group, index) => (
          <section key={index}>
            <p className="text-[11px] font-bold text-ds-dim uppercase tracking-widest mb-3 pl-1">
              {group.title}
            </p>
            <div className="bg-ds-card border border-ds-border rounded-[18px] overflow-hidden shadow-sm">
              {group.items.map((item, idx) => {
                const isLast = idx === group.items.length - 1;
                return (
                  <div 
                    key={idx}
                    onClick={() => {
                      if (item.onClick) item.onClick();
                      else if (item.route) navigate(item.route);
                    }}
                    className={`flex items-center justify-between p-4 ${!item.isToggle ? 'cursor-pointer active:bg-ds-bg/50 transition-colors' : ''} ${!isLast ? 'border-b border-ds-border/50' : ''}`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="text-ds-text bg-ds-bg p-2 rounded-xl border border-ds-border/30 shadow-sm">
                        {item.icon}
                      </div>
                      <span className="text-[14px] font-bold tracking-tight text-ds-text">{item.label}</span>
                    </div>
                    
                    {item.isToggle ? (
                      <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={item.isActive}
                          onChange={() => item.onClick && item.onClick()}
                        />
                        <div className="w-11 h-6 bg-ds-bg border border-ds-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-ds-dim after:border-ds-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ds-primary peer-checked:after:bg-white peer-checked:border-ds-primary"></div>
                      </label>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-ds-dim" strokeWidth={2.5} />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {/* Botão Sair - Usando o estilo vermelho clean da screenshot */}
        <div 
          onClick={handleLogout}
          className="bg-ds-card border border-ds-danger/30 rounded-[16px] p-4 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-transform shadow-sm text-ds-danger font-bold text-[14px]"
        >
          <LogOut className="w-[18px] h-[18px]" strokeWidth={2.5} />
          Sair do aplicativo
        </div>

      </main>

    </div>
  );
}
