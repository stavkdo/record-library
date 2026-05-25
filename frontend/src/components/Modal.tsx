import { useLibraryUI } from '../state/LibraryUI';

/**
 * Single backdrop shared across every modal. Fades via CSS opacity so
 * transitions between modals don't unmount/remount the blur layer.
 * Click handler is context-aware: clicking outside the AddRecord/AddMember
 * cards returns to the library modal rather than closing everything.
 */
export function ModalBackdrop() {
  const { modal, close, openLibrary } = useLibraryUI();
  const visible = modal.kind !== 'none';

  function handleClick() {
    if (modal.kind === 'add-record' || modal.kind === 'add-member') {
      openLibrary(modal.l_id);
    } else if (visible) {
      close();
    }
  }

  return (
    <div
      className={`fixed left-0 md:left-[340px] right-0 top-16 bottom-0 z-30 bg-black/50 backdrop-blur-md transition-opacity duration-300 ease-out ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={handleClick}
      aria-hidden={!visible}
    />
  );
}
