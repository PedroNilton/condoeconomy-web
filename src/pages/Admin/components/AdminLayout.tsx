import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Megaphone, CalendarDays, ClipboardCheck, MessageSquare, Home } from 'lucide-react';
import { useNotification } from '../../../contexts/NotificationContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { AppHeader, BottomNav, MobileFrame, type BottomNavItem } from '../../../components/ui';
import api from '../../../services/api';

export function AdminLayout() {
  const navigate = useNavigate();
  const { counts } = useNotification();
  const { theme, toggleTheme } = useTheme();
  const [subtitulo] = useState(() => {
    try {
      const rawUser = localStorage.getItem('@HabitOS:user');
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        if (parsed?.nome) {
          if (String(parsed.nome).includes('(')) {
            return String(parsed.nome);
          }
          const papel =
            parsed?.papel === 'ROLE_SINDICO' || parsed?.papel === 'ROLE_ADMIN'
              ? 'síndico(a)'
              : parsed?.papel?.replace('ROLE_', '').toLowerCase() || 'síndico';
          return `${parsed.nome} (${papel})`;
        }
      }
    } catch {
      // mantém subtítulo padrão
    }
    return 'Síndico(a)';
  });

  useEffect(() => {
    const token = localStorage.getItem('@HabitOS:token');
    if (!token) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } catch {
      // Ignora erro de rede no logout
    }
    localStorage.removeItem('@HabitOS:token');
    localStorage.removeItem('@HabitOS:user');
    navigate('/login');
  };

  const navItems: BottomNavItem[] = [
    {
      to: '/admin',
      label: 'Avisos',
      end: true,
      icon: <Megaphone className="w-5 h-5" />,
    },
    {
      to: '/admin/reservas',
      label: 'Reservas',
      badge: counts.reservasAdmin,
      icon: <CalendarDays className="w-5 h-5" />,
    },
    {
      to: '/admin/assembleia',
      label: 'Assembleia',
      icon: <ClipboardCheck className="w-5 h-5" />,
    },
    {
      to: '/admin/ouvidoria',
      label: 'Ouvidoria',
      badge: counts.chamadosAdmin,
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      to: '/admin/painel',
      label: 'Condomínio',
      icon: <Home className="w-5 h-5" />,
    },
  ];

  return (
    <MobileFrame className="overflow-hidden">
      <AppHeader
        title="Síndico"
        subtitle={subtitulo}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
      />

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <Outlet />
      </div>

      <BottomNav items={navItems} />
    </MobileFrame>
  );
}
