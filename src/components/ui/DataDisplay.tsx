import { useState, type ReactNode } from 'react';
import { Send } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  emphasis?: 'default' | 'brand' | 'warn' | 'bad' | 'ok';
  hero?: boolean;
  onClick?: () => void;
  className?: string;
}

const VALUE_TONES = {
  default: 'text-ink',
  brand: 'text-brand',
  warn: 'text-warn',
  bad: 'text-bad',
  ok: 'text-ok',
};

export function StatCard({
  label,
  value,
  icon,
  emphasis = 'default',
  hero = false,
  onClick,
  className = '',
}: StatCardProps) {
  const isZero = value === 0 || value === '0';
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`bg-surface border border-line rounded-[14px] p-3.5 text-left w-full ${
        onClick ? 'cursor-pointer hover:bg-canvas transition-colors' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[10.5px] font-bold uppercase tracking-[0.04em] text-dim truncate">
          {label}
        </span>
        {icon}
      </div>
      <div
        className={`font-mono ${
          hero ? 'text-[30px]' : 'text-[24px]'
        } font-semibold tracking-[-0.02em] leading-none ${
          isZero ? 'text-faint' : VALUE_TONES[emphasis]
        }`}
      >
        {value}
      </div>
    </Tag>
  );
}

interface ProgressBarProps {
  percent: number;
  secondaryPercent?: number;
  quorumPercent?: number;
  tone?: 'brand' | 'ok' | 'warn' | 'bad';
  height?: 'sm' | 'md';
}

export function ProgressBar({
  percent,
  secondaryPercent = 0,
  quorumPercent,
  tone = 'ok',
  height = 'md',
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const clampedSec = Math.max(0, Math.min(100 - clamped, secondaryPercent));
  const fillTone =
    tone === 'brand'
      ? 'bg-brand'
      : tone === 'warn'
      ? 'bg-warn'
      : tone === 'bad'
      ? 'bg-bad'
      : 'bg-ok';

  return (
    <div
      className={`relative w-full ${
        height === 'sm' ? 'h-[7px]' : 'h-[9px]'
      } rounded-full bg-line overflow-visible flex`}
    >
      <div
        className={`h-full ${fillTone} rounded-l-full ${
          clampedSec === 0 ? 'rounded-r-full' : ''
        } transition-all duration-250`}
        style={{ width: `${clamped}%` }}
      />
      {clampedSec > 0 && (
        <div
          className="h-full bg-bad transition-all duration-250"
          style={{ width: `${clampedSec}%` }}
        />
      )}
      {typeof quorumPercent === 'number' && (
        <span
          title={`Quórum mínimo: ${quorumPercent}%`}
          style={{ left: `${Math.max(0, Math.min(100, quorumPercent))}%` }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[2px] h-[14px] bg-ink rounded-full"
        />
      )}
    </div>
  );
}

export interface ThreadMessage {
  id?: string;
  senderRole: 'morador' | 'portaria' | 'sindico';
  senderLabel: string;
  text: string;
  timeLabel: string;
}

interface ThreadProps {
  messages: ThreadMessage[];
  onSend?: (text: string) => void;
  placeholder?: string;
  disabledNote?: string;
}

export function Thread({
  messages,
  onSend,
  placeholder = 'Escrever resposta…',
  disabledNote,
}: ThreadProps) {
  const [draft, setDraft] = useState('');

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed || !onSend) return;
    onSend(trimmed);
    setDraft('');
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-2.5 max-h-[38vh] overflow-y-auto py-1 pb-3">
        {messages.map((m, idx) => {
          const isMorador = m.senderRole === 'morador';
          const isSindico = m.senderRole === 'sindico';
          return (
            <div
              key={m.id || idx}
              className={`max-w-[86%] rounded-[14px] px-3 py-2.5 text-[13px] leading-relaxed ${
                isMorador
                  ? 'self-start bg-canvas border border-line text-ink'
                  : isSindico
                  ? 'self-end bg-brand-soft border border-brand-soft text-ink'
                  : 'self-end bg-surface border border-line text-ink'
              }`}
            >
              <div>{m.text}</div>
              <small
                className={`block font-mono text-[10px] mt-1 ${
                  isSindico ? 'text-brand opacity-85' : 'text-faint'
                }`}
              >
                {m.senderLabel} · {m.timeLabel}
              </small>
            </div>
          );
        })}
      </div>

      {disabledNote ? (
        <div className="text-[12px] text-ok bg-ok-soft rounded-[10px] px-3 py-2.5 leading-relaxed">
          {disabledNote}
        </div>
      ) : (
        onSend && (
          <div className="flex gap-2 pt-3 border-t border-line">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={placeholder}
              className="flex-1 h-[46px] px-3 rounded-[11px] border border-line bg-canvas text-ink text-[14px] placeholder:text-faint focus-visible:outline-2 focus-visible:outline-brand"
            />
            <button
              type="button"
              onClick={handleSend}
              className="h-[46px] px-4 rounded-[11px] bg-brand text-brand-ink font-bold text-[13.5px] inline-flex items-center gap-1.5 cursor-pointer hover:bg-brand-hover"
            >
              <Send className="w-4 h-4" />
              <span>Enviar</span>
            </button>
          </div>
        )
      )}
    </div>
  );
}
