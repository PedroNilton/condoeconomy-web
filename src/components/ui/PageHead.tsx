import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';

interface PageHeadProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  rightBadge?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  children?: ReactNode;
}

export function PageHead({
  eyebrow,
  title,
  subtitle,
  action,
  rightBadge,
  onBack,
  backLabel = 'Voltar',
  children,
}: PageHeadProps) {
  return (
    <div className="pt-[10px] px-[18px] pb-0">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-[13px] font-bold text-brand mb-2 cursor-pointer hover:opacity-80 focus-visible:outline-2 focus-visible:outline-brand rounded"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{backLabel}</span>
        </button>
      )}

      {(eyebrow || rightBadge) && (
        <div className="flex items-center justify-between gap-2">
          {eyebrow ? (
            <span className="text-[11px] font-bold text-faint uppercase tracking-[0.06em]">
              {eyebrow}
            </span>
          ) : (
            <span />
          )}
          {rightBadge}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 mt-[3px] mb-[12px]">
        <h1 className="text-[21px] font-extrabold tracking-[-0.01em] text-ink leading-tight truncate">
          {title}
        </h1>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {subtitle && <p className="text-[12.5px] text-dim -mt-2 mb-[14px] leading-relaxed">{subtitle}</p>}
      {children}
    </div>
  );
}
