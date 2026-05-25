import { useEffect, useRef } from 'react';
import { useLibraryUI } from '../state/LibraryUI';
import { CreateLibraryModal } from '../modals/CreateLibraryModal';
import { LibraryModal } from '../modals/LibraryModal';
import { AddRecordModal } from '../modals/AddRecordModal';
import { AddMemberModal } from '../modals/AddMemberModal';

/**
 * Single always-mounted modal card. The card chrome (background, border,
 * shadow, close button) stays in the DOM at a constant opacity=1 whenever
 * ANY modal is open. Only the content inside switches when modal.kind changes.
 * This eliminates the double-background blending and content-clear flash that
 * occurred when four separate opacity-transitioning cards overlapped.
 *
 * Open/close animation is applied only to the card+backdrop together (via
 * ModalBackdrop in Layout) — not to individual sub-modal transitions.
 */
export function ModalCard() {
  const { modal, close, openLibrary } = useLibraryUI();
  const open = modal.kind !== 'none';

  // Stable ref so the Escape-key effect never goes stale when modal.kind changes.
  const handleCloseRef = useRef<() => void>(() => {});
  handleCloseRef.current = () => {
    if (modal.kind === 'add-record' || modal.kind === 'add-member') {
      openLibrary(modal.l_id);
    } else {
      close();
    }
  };

  const handleClose = () => handleCloseRef.current();

  // Bind Escape once; re-bind only when open flips.
  // handleCloseRef.current is always fresh — no stale closure risk.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleCloseRef.current();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div
      className={`fixed inset-0 z-40 flex pointer-events-none transition-opacity duration-200 ease-out ${
        open ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden={!open}
    >
      <div className="hidden md:block w-[340px] shrink-0" />
      <div className="flex-1 flex flex-col pt-16 min-w-0">
        <div
          className={`relative flex-1 m-2 md:m-5 rounded-xl md:rounded-2xl bg-[#13131a] border border-white/[0.08] flex flex-col overflow-hidden shadow-2xl shadow-black/60 ${
            open ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
        >
          {/* Single close/back button — context-aware */}
          <button
            onClick={handleClose}
            tabIndex={open ? 0 : -1}
            className="absolute top-4 right-4 w-8 h-8 grid place-items-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-all z-10"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M1 1L13 13M13 1L1 13"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {/*
           * key={modal.kind} remounts this div on every kind change, which:
           * 1. Restarts animate-modal-in so each sub-modal slides in fresh.
           * 2. Automatically resets scroll position.
           * The card itself doesn't animate — only the content inside does.
           */}
          <div
            key={modal.kind}
            className="flex-1 overflow-auto px-4 sm:px-6 md:px-10 py-6 md:py-9 animate-modal-in"
          >
            {modal.kind === 'create' && <CreateLibraryModal />}
            {modal.kind === 'library' && <LibraryModal l_id={modal.l_id} />}
            {modal.kind === 'add-record' && <AddRecordModal l_id={modal.l_id} />}
            {modal.kind === 'add-member' && <AddMemberModal l_id={modal.l_id} />}
          </div>
        </div>
      </div>
    </div>
  );
}
