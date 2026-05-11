import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Glass-style modal: blurred dark backdrop + elevated surface card with
 * subtle border. Sidebar and header remain visible behind the backdrop.
 */
export function Modal({ open, onClose, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* offset to leave sidebar (340px) visible */}
      <div className="w-[340px] shrink-0" />
      <div className="flex-1 flex flex-col pt-16">
        <div
          className="absolute inset-0 left-[340px] top-16 bg-black/50 backdrop-blur-md animate-backdrop-in"
          onClick={onClose}
        />
        <div className="relative flex-1 m-5 rounded-2xl bg-[#13131a] border border-white/[0.08] flex flex-col overflow-hidden shadow-2xl shadow-black/60 animate-modal-in">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 grid place-items-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-all z-10"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          <div className="flex-1 overflow-auto px-10 py-9">{children}</div>
        </div>
      </div>
    </div>
  );
}
