import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost-danger' | 'mini';
export type ButtonSize = 'cta' | 'card' | 'portaria' | 'mini';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-brand border-brand text-brand-ink hover:bg-brand-hover',
  secondary: 'bg-surface border-line-strong text-ink hover:bg-canvas',
  danger: 'bg-bad border-bad text-white hover:brightness-105',
  'ghost-danger': 'bg-surface border-line text-bad hover:bg-bad-soft',
  mini: 'bg-canvas border-line text-ink hover:border-brand hover:text-brand',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  cta: 'h-[46px] px-4 rounded-[12px] text-[13.5px]',
  card: 'h-[44px] px-3.5 rounded-[11px] text-[13.5px]',
  portaria: 'h-[50px] px-4 rounded-[12px] text-[14.5px]',
  mini: 'py-[5px] px-[10px] rounded-[8px] text-[11.5px]',
};

export function Button({
  variant = 'secondary',
  size = variant === 'mini' ? 'mini' : 'cta',
  fullWidth = false,
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 font-sans font-bold border cursor-pointer transition-all active:translate-y-[1px] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:translate-y-0 focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 ${
        VARIANT_CLASSES[variant]
      } ${SIZE_CLASSES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: 'sm' | 'md';
  children: ReactNode;
}

export function IconButton({
  label,
  size = 'md',
  className = '',
  type = 'button',
  children,
  ...rest
}: IconButtonProps) {
  const dim = size === 'sm' ? 'w-[34px] h-[34px] rounded-[10px]' : 'w-10 h-10 rounded-[11px]';
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`${dim} border border-line bg-surface text-ink inline-grid place-items-center cursor-pointer hover:bg-canvas transition-colors focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
