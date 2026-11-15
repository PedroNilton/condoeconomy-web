import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Home, UserCheck, Package, CalendarDays, MessageSquare, Car } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { AppHeader, BottomNav, MobileFrame, type BottomNavItem } from '../ui';
import api from '../../services/api';

export function DashboardLayout() {
  const navigate = useNavigate();
  const { counts } = useNotification();
  const { theme, toggleTheme } = useTheme();
  const [condominioLabel] = useState(() => {
    try {
      const rawUser = localStorage.getItem('@HabitOS:user');
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        if (parsed?.condominioNome) {
          return String(parsed.condominioNome);
        }
        if (parsed?.nome) {
          return String(parsed.nome).split('(')[0].trim();
        }
      }
    } catch {
      // mantém padrão
    }
    return 'Condomínio';
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
      to: '/portaria',
      label: 'Início',
      end: true,
      icon: <Home className="w-5 h-5" />,
    },
    {
      to: '/portaria/visitantes',
      label: 'Visitantes',
      badge: counts.visitantesAguardando,
      icon: <UserCheck className="w-5 h-5" />,
    },
    {
      to: '/portaria/encomendas',
      label: 'Encomendas',
      badge: counts.encomendasPendentes,
      icon: <Package className="w-5 h-5" />,
    },
    {
      to: '/portaria/reservas',
      label: 'Reservas',
      icon: <CalendarDays className="w-5 h-5" />,
    },
    {
      to: '/portaria/chamados',
      label: 'Ouvidoria',
      badge: counts.chamadosPortaria,
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      to: '/portaria/veiculos',
      label: 'Veículos',
      icon: <Car className="w-5 h-5" />,
    },
  ];

  return (
    <MobileFrame>
      <AppHeader
        title="Portaria"
        subtitle={condominioLabel}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
      />

      <main className="flex-1 pt-[4px] px-[18px] pb-[110px] flex flex-col gap-[22px] [&_.page-head]:px-0">
        <Outlet />
      </main>

      <BottomNav items={navItems} />
    </MobileFrame>
  );
}
