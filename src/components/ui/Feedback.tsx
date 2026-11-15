import type { ReactNode } from 'react';
import { Check, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface ToastProps {
  message: string | null;
  hasBottomNav?: boolean;
}

export function Toast({ message, hasBottomNav = true }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed left-1/2 -translate-x-1/2 ${
        hasBottomNav ? 'bottom-[84px]' : 'bottom-6'
      } bg-ink text-canvas text-[13px] font-semibold px-[18px] py-[11px] rounded-[10px] z-60 whitespace-nowrap max-w-[92%] truncate pointer-events-none transition-all duration-250 ${
        message ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
      }`}
    >
      {message}
    </div>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  tone?: 'ok' | 'neutral';
  action?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  tone = 'neutral',
  action,
}: EmptyStateProps) {
  return (
    <div className="text-center py-9 px-5 bg-surface border border-line rounded-[16px]">
      <div
        className={`w-14 h-14 rounded-full border-[3px] grid place-items-center mx-auto mb-3.5 ${
          tone === 'ok'
            ? 'border-ok text-ok opacity-90'
            : 'border-line text-faint'
        }`}
      >
        {icon || <Check className="w-[26px] h-[26px]" />}
      </div>
      <div className="text-[15px] font-extrabold text-ink mb-1">{title}</div>
      <div className="text-[12.5px] text-dim leading-relaxed max-w-[30ch] mx-auto">
        {description}
      </div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface InlineConfirmProps {
  label: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
}

export function InlineConfirm({
  label,
  onCancel,
  onConfirm,
  confirmLabel = 'Remover',
}: InlineConfirmProps) {
  return (
    <div className="mt-2.5 pt-2.5 border-t border-line flex items-center justify-between gap-2">
      <span className="text-[12.5px] font-semibold text-bad truncate">{label}</span>
      <div className="flex items-center gap-1.5 shrink-0">
        <Button variant="mini" onClick={onCancel}>
          Cancelar
        </Button>
        <button
          type="button"
          onClick={onConfirm}
          className="font-sans text-[11.5px] font-bold py-[5px] px-[10px] rounded-[8px] bg-bad text-white border border-bad cursor-pointer hover:brightness-105"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}

export type BannerTone = 'brand' | 'warn' | 'bad' | 'ok';

interface InfoBannerProps {
  tone?: BannerTone;
  children: ReactNode;
  className?: string;
}

const BANNER_STYLES: Record<BannerTone, string> = {
  brand: 'bg-brand-soft text-brand',
  warn: 'bg-warn-soft text-warn',
  bad: 'bg-bad-soft text-bad',
  ok: 'bg-ok-soft text-ok',
};

const BANNER_ICONS: Record<BannerTone, ReactNode> = {
  brand: <Info className="w-4 h-4 shrink-0 mt-0.5" />,
  warn: <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />,
  bad: <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />,
  ok: <Check className="w-4 h-4 shrink-0 mt-0.5" />,
};

export function InfoBanner({ tone = 'brand', children, className = '' }: InfoBannerProps) {
  return (
    <div
      className={`flex items-start gap-2.5 rounded-[12px] p-3 text-[12px] leading-relaxed font-medium ${BANNER_STYLES[tone]} ${className}`}
    >
      {BANNER_ICONS[tone]}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function LiveIndicator({ label = 'AO VIVO' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold text-ok tracking-[0.03em]">
      <span className="w-1.5 h-1.5 rounded-full bg-ok portaria-live-dot" />
      <span>{label}</span>
    </span>
  );
}
