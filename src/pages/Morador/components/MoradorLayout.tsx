import { useEffect } from 'react';
import { Home, CalendarDays, Receipt, Car, User } from 'lucide-react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { usePushNotifications } from '../../../hooks/usePushNotifications';
import { MobileFrame } from '../../../components/ui';

export function MoradorLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  usePushNotifications();

  useEffect(() => {
    const token = localStorage.getItem('@HabitOS:token');
    if (!token) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const isVeiculos = location.pathname.includes('/veiculos');
  const isPerfil = location.pathname.includes('/perfil') && !isVeiculos;

  return (
    <MobileFrame className="h-screen overflow-hidden">
      <main className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        <Outlet />
      </main>

      <nav
        aria-label="Navegação principal"
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[412px] bg-surface border-t border-line pt-[9px] px-1 pb-[calc(9px+env(safe-area-inset-bottom,0px))] grid grid-cols-5 z-40"
      >
        <NavLink
          to="/app"
          end
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[9.5px] transition-colors ${
              isActive ? 'text-brand font-bold' : 'text-faint font-semibold hover:text-ink'
            }`
          }
        >
          <Home className="w-5 h-5" />
          <span>Início</span>
        </NavLink>

        <NavLink
          to="/app/boletos"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[9.5px] transition-colors ${
              isActive ? 'text-brand font-bold' : 'text-faint font-semibold hover:text-ink'
            }`
          }
        >
          <Receipt className="w-5 h-5" />
          <span>Boletos</span>
        </NavLink>

        <NavLink
          to="/app/reservas"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[9.5px] transition-colors ${
              isActive ? 'text-brand font-bold' : 'text-faint font-semibold hover:text-ink'
            }`
          }
        >
          <CalendarDays className="w-5 h-5" />
          <span>Reservas</span>
        </NavLink>

        <NavLink
          to="/app/perfil/veiculos"
          className={() =>
            `flex flex-col items-center gap-1 text-[9.5px] transition-colors ${
              isVeiculos ? 'text-brand font-bold' : 'text-faint font-semibold hover:text-ink'
            }`
          }
        >
          <Car className="w-5 h-5" />
          <span>Veículos</span>
        </NavLink>

        <NavLink
          to="/app/perfil"
          className={() =>
            `flex flex-col items-center gap-1 text-[9.5px] transition-colors ${
              isPerfil ? 'text-brand font-bold' : 'text-faint font-semibold hover:text-ink'
            }`
          }
        >
          <User className="w-5 h-5" />
          <span>Perfil</span>
        </NavLink>
      </nav>
    </MobileFrame>
  );
}
