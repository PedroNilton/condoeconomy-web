import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-[2px] p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-ds-card border-t sm:border border-ds-border rounded-t-[20px] sm:rounded-[18px] shadow-2xl w-full max-w-[412px] flex flex-col max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-[18px] py-[14px] border-b border-ds-border">
          <h2 className="text-[15.5px] font-extrabold text-ds-text tracking-[-0.01em] m-0">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="w-[32px] h-[32px] rounded-[9px] border border-ds-border bg-ds-bg grid place-items-center text-ds-dim hover:text-ds-text transition-colors cursor-pointer"
          >
            <X className="w-[16px] h-[16px]" />
          </button>
        </div>

        <div className="p-[18px] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
