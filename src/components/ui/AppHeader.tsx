import type { ReactNode } from 'react';
import { Sun, Moon, LogOut } from 'lucide-react';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  variant?: 'default' | 'greeting';
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onLogout?: () => void;
  rightExtra?: ReactNode;
}

export function AppHeader({
  title,
  subtitle,
  variant = 'default',
  theme,
  onToggleTheme,
  onLogout,
  rightExtra,
}: AppHeaderProps) {
  return (
    <header className="pt-[calc(16px+env(safe-area-inset-top,0px))] px-[18px] pb-[6px] flex justify-between items-center bg-canvas/95 backdrop-blur-md z-30 sticky top-0 border-b border-line/50">
      <div className="min-w-0 pr-2">
        <div
          className={`${
            variant === 'greeting' ? 'text-[16.5px]' : 'text-[19px]'
          } font-extrabold tracking-[-0.01em] text-ink leading-tight truncate`}
        >
          {title}
        </div>
        {subtitle && (
          <div className="font-mono text-[10.5px] text-brand font-semibold mt-[2px] uppercase tracking-wide truncate max-w-[240px]">
            {subtitle}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {rightExtra}
        <button
          type="button"
          onClick={onToggleTheme}
          className="w-10 h-10 rounded-[11px] border border-line bg-surface flex items-center justify-center text-ink cursor-pointer hover:bg-canvas transition-colors focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
          aria-label="Alternar tema"
          title="Alternar tema"
        >
          {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
        </button>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="w-10 h-10 rounded-[11px] border border-line bg-surface flex items-center justify-center text-ink cursor-pointer hover:text-bad hover:border-bad transition-colors focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
            aria-label="Sair"
            title="Sair"
          >
            <LogOut className="w-[18px] h-[18px]" />
          </button>
        )}
      </div>
    </header>
  );
}
