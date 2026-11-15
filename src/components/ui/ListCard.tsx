import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

export type IconChipTone = 'neutral' | 'brand' | 'ok' | 'warn' | 'bad';

const CHIP_TONES: Record<IconChipTone, string> = {
  neutral: 'bg-canvas border-line text-dim',
  brand: 'bg-brand-soft border-brand-soft text-brand',
  ok: 'bg-ok-soft border-ok-soft text-ok',
  warn: 'bg-warn-soft border-warn-soft text-warn',
  bad: 'bg-bad-soft border-bad-soft text-bad',
};

interface IconChipProps {
  children: ReactNode;
  tone?: IconChipTone;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function IconChip({
  children,
  tone = 'neutral',
  size = 'md',
  className = '',
}: IconChipProps) {
  const sizeClass =
    size === 'sm'
      ? 'w-8 h-8 rounded-[9px]'
      : size === 'lg'
      ? 'w-[42px] h-[42px] rounded-[12px]'
      : 'w-9 h-9 rounded-[10px]';
  return (
    <div
      className={`${sizeClass} border flex items-center justify-center shrink-0 ${CHIP_TONES[tone]} ${className}`}
    >
      {children}
    </div>
  );
}

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'md' | 'lg' | 'xl';
  online?: boolean;
}

export function Avatar({ name, src, size = 'md', online = false }: AvatarProps) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');

  const sizeClass =
    size === 'xl'
      ? 'w-[76px] h-[76px] text-[24px]'
      : size === 'lg'
      ? 'w-16 h-16 text-[20px]'
      : 'w-10 h-10 text-[13px]';

  return (
    <div className="relative inline-flex shrink-0">
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeClass} rounded-full object-cover border border-line`}
        />
      ) : (
        <div
          className={`${sizeClass} rounded-full bg-brand-soft text-brand font-extrabold flex items-center justify-center border border-line`}
        >
          {initials || '?'}
        </div>
      )}
      {online && (
        <span className="w-3 h-3 rounded-full bg-ok border-2 border-surface absolute bottom-0 right-0" />
      )}
    </div>
  );
}

interface ListCardProps {
  children: ReactNode;
  tone?: 'default' | 'warn' | 'bad' | 'ok';
  className?: string;
}

const CARD_TONES = {
  default: 'border-line',
  warn: 'border-warn',
  bad: 'border-bad',
  ok: 'border-ok',
};

export function ListCard({ children, tone = 'default', className = '' }: ListCardProps) {
  return (
    <div
      className={`bg-surface border ${CARD_TONES[tone]} rounded-[14px] p-[14px] ${className}`}
    >
      {children}
    </div>
  );
}

interface GroupedListProps {
  children: ReactNode;
  className?: string;
}

export function GroupedList({ children, className = '' }: GroupedListProps) {
  return (
    <div
      className={`bg-surface border border-line rounded-[14px] overflow-hidden divide-y divide-line ${className}`}
    >
      {children}
    </div>
  );
}

interface ListRowProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  meta?: string;
  right?: ReactNode;
  showChevron?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ListRow({
  icon,
  title,
  subtitle,
  meta,
  right,
  showChevron = false,
  onClick,
  className = '',
}: ListRowProps) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`w-full text-left flex items-center gap-3 px-[14px] py-[12px] ${
        onClick
          ? 'cursor-pointer hover:bg-canvas transition-colors focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-[-2px]'
          : ''
      } ${className}`}
    >
      {icon}
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-bold text-ink truncate">{title}</div>
        {subtitle && <div className="text-[12px] text-dim truncate mt-[1px]">{subtitle}</div>}
        {meta && <div className="font-mono text-[11px] text-faint mt-[2px]">{meta}</div>}
      </div>
      {right && <div className="shrink-0 flex items-center gap-2">{right}</div>}
      {showChevron && <ChevronRight className="w-4 h-4 text-faint shrink-0" />}
    </Tag>
  );
}
