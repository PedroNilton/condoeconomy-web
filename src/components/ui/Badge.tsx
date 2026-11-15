import type { ReactNode } from 'react';

export type BadgeTone = 'ok' | 'warn' | 'bad' | 'brand' | 'neutral';

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

const TONE_MAP: Record<BadgeTone, string> = {
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  bad: 'bg-bad-soft text-bad',
  brand: 'bg-brand-soft text-brand',
  neutral: 'bg-disabled text-dim',
};

export function Badge({ children, tone = 'neutral', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.04em] px-2 py-[3px] rounded-full whitespace-nowrap ${TONE_MAP[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
