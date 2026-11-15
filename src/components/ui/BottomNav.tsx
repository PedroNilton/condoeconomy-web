import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

export interface BottomNavItem {
  to: string;
  label: string;
  icon: ReactNode;
  badge?: number;
  end?: boolean;
}

interface BottomNavProps {
  items: BottomNavItem[];
}

export function BottomNav({ items }: BottomNavProps) {
  const colsClass = items.length === 6 ? 'grid-cols-6' : 'grid-cols-5';

  return (
    <nav
      aria-label="Navegação principal"
      className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[412px] bg-surface border-t border-line pt-[9px] px-1 pb-[calc(9px+env(safe-area-inset-bottom,0px))] grid ${colsClass} z-40`}
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[9.5px] relative transition-colors focus-visible:outline-2 focus-visible:outline-brand rounded ${
              isActive ? 'text-brand font-bold' : 'text-faint font-semibold hover:text-ink'
            }`
          }
        >
          <div className="relative flex items-center justify-center w-5 h-5">
            {item.icon}
            {typeof item.badge === 'number' && item.badge > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-brand text-brand-ink font-mono text-[9px] font-bold min-w-[15px] h-[15px] rounded-full flex items-center justify-center px-1">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </div>
          <span className="truncate max-w-full">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
