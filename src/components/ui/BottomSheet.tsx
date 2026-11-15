import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function BottomSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-[rgba(10,10,14,0.45)] transition-opacity duration-200 z-50 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`fixed left-1/2 bottom-0 -translate-x-1/2 w-full max-w-[412px] bg-surface border-t border-line rounded-t-[20px] p-5 pb-[calc(20px+env(safe-area-inset-bottom,0px))] z-51 transition-transform duration-250 ease-out max-h-[92vh] overflow-y-auto shadow-[0_-10px_40px_rgba(0,0,0,0.15)] ${
          open ? 'translate-y-0' : 'translate-y-full pointer-events-none'
        }`}
      >
        <div className="flex items-start justify-between gap-3 mb-1">
          <h2 className="text-[17px] font-extrabold text-ink m-0 leading-snug">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="w-[34px] h-[34px] rounded-[10px] border border-line bg-canvas text-ink grid place-items-center shrink-0 cursor-pointer hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand"
          >
            <X className="w-[15px] h-[15px]" />
          </button>
        </div>

        {subtitle && <p className="text-[12.5px] text-dim mb-3.5">{subtitle}</p>}

        <div>{children}</div>

        {footer && (
          <div className="grid grid-cols-[1fr_1.4fr] gap-2.5 mt-4">{footer}</div>
        )}
      </div>
    </>
  );
}

interface ConfirmSheetProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  note?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  disabled?: boolean;
  children?: ReactNode;
}

export function ConfirmSheet({
  open,
  onClose,
  onConfirm,
  title,
  description,
  note,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Voltar',
  destructive = false,
  disabled = false,
  children,
}: ConfirmSheetProps) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={title}
      subtitle={description}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            disabled={disabled}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
      {note && (
        <p className="text-[12px] text-dim leading-relaxed mt-2 bg-canvas border border-line rounded-[10px] p-2.5">
          {note}
        </p>
      )}
    </BottomSheet>
  );
}
