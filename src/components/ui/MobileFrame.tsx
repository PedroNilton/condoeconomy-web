import type { ReactNode } from 'react';

interface MobileFrameProps {
  children: ReactNode;
  className?: string;
}

export function MobileFrame({ children, className = '' }: MobileFrameProps) {
  return (
    <div className="min-h-screen bg-black/95 flex justify-center font-sans selection:bg-brand-soft">
      <div
        className={`w-full max-w-[412px] min-h-screen min-h-[100dvh] bg-canvas text-ink flex flex-col relative border-x border-line ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
