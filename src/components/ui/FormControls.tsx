import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { Check } from 'lucide-react';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  mono?: boolean;
  surface?: 'canvas' | 'surface';
}

export function Field({
  label,
  error,
  mono = false,
  surface = 'canvas',
  className = '',
  id,
  ...rest
}: FieldProps) {
  const bg = surface === 'surface' ? 'bg-surface' : 'bg-canvas';
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-[12px] font-bold uppercase tracking-[0.04em] text-dim mb-[6px]"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full h-[46px] px-[13px] rounded-[10px] border ${
          error ? 'border-bad' : 'border-line'
        } ${bg} text-ink ${
          mono ? 'font-mono' : 'font-sans'
        } text-[14px] placeholder:text-faint focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-1 ${className}`}
        {...rest}
      />
      {error && <p className="text-[11.5px] text-bad mt-1.5">{error}</p>}
    </div>
  );
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  surface?: 'canvas' | 'surface';
}

export function TextAreaField({
  label,
  error,
  surface = 'canvas',
  className = '',
  id,
  ...rest
}: TextAreaFieldProps) {
  const bg = surface === 'surface' ? 'bg-surface' : 'bg-canvas';
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-[12px] font-bold uppercase tracking-[0.04em] text-dim mb-[6px]"
        >
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`w-full min-h-[96px] p-[11px_13px] rounded-[10px] border ${
          error ? 'border-bad' : 'border-line'
        } ${bg} text-ink font-sans text-[14px] resize-none placeholder:text-faint focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-1 ${className}`}
        {...rest}
      />
      {error && <p className="text-[11.5px] text-bad mt-1.5">{error}</p>}
    </div>
  );
}

interface ChoiceChipsProps<T extends string = string> {
  label?: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function ChoiceChips<T extends string = string>({
  label,
  options,
  value,
  onChange,
  className = '',
}: ChoiceChipsProps<T>) {
  return (
    <div className={className}>
      {label && (
        <span className="block text-[12px] font-bold uppercase tracking-[0.04em] text-dim mb-[8px]">
          {label}
        </span>
      )}
      <div role="radiogroup" className="flex flex-wrap gap-[7px]">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt.value)}
              className={`rounded-[10px] px-3 py-[9px] text-[12.5px] font-semibold border cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-brand ${
                active
                  ? 'border-brand bg-brand-soft text-brand font-bold'
                  : 'border-line bg-canvas text-dim hover:text-ink'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export interface ColorSwatchOption {
  name: string;
  value: string;
  background: string;
  border?: string;
}

interface ColorSwatchPickerProps {
  label?: string;
  options: ColorSwatchOption[];
  value: string;
  onChange: (value: string) => void;
}

export function ColorSwatchPicker({
  label,
  options,
  value,
  onChange,
}: ColorSwatchPickerProps) {
  const selected = options.find((o) => o.value === value || o.name === value);

  return (
    <div>
      {label && (
        <span className="block text-[12px] font-bold uppercase tracking-[0.04em] text-dim mb-[8px]">
          {label}
        </span>
      )}
      <div role="radiogroup" className="flex flex-wrap gap-2.5">
        {options.map((swatch) => {
          const active = swatch.value === value || swatch.name === value;
          return (
            <button
              key={swatch.name}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={swatch.name}
              title={swatch.name}
              onClick={() => onChange(swatch.name)}
              style={{
                background: swatch.background,
                borderColor: active ? 'var(--primary)' : swatch.border || 'transparent',
              }}
              className={`w-[36px] h-[36px] rounded-full border-2 flex items-center justify-center cursor-pointer transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2`}
            >
              {active && (
                <Check
                  className={`w-4 h-4 stroke-[3] ${
                    swatch.name === 'Branco' ? 'text-ink' : 'text-white'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
      {selected && (
        <p className="text-[11.5px] text-dim mt-2">
          Selecionado: <strong className="text-ink">{selected.name}</strong>
        </p>
      )}
    </div>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description?: string;
  disabled?: boolean;
}

export function Toggle({
  checked,
  onChange,
  title,
  description,
  disabled = false,
}: ToggleProps) {
  return (
    <label
      className={`flex items-center justify-between gap-3 py-2 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      <div className="min-w-0">
        <div className="text-[13.5px] font-bold text-ink">{title}</div>
        {description && <div className="text-[11.5px] text-dim leading-snug mt-0.5">{description}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`w-[40px] h-[23px] rounded-full p-[2.5px] transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 ${
          checked ? 'bg-brand' : 'bg-line'
        }`}
      >
        <span
          className={`block w-[18px] h-[18px] rounded-full bg-white transition-transform duration-150 ${
            checked ? 'translate-x-[17px]' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
}
