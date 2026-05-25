import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { useLibraryUI } from '../state/LibraryUI';

interface RecordItem {
  r_id: number;
  r_name: string;
  artist: string;
  year: number | null;
  thumb_url: string | null;
  owner?: string;
}

interface MemberItem {
  u_id: number;
  username: string;
  level: 'owner' | 'member';
}

interface LibraryDetail {
  l_id: number;
  l_name: string;
  creation_date: string;
  level: 'owner' | 'member';
  members?: MemberItem[];
  records?: RecordItem[];
}

const COVER_GRADIENTS = [
  'from-[#ff5e3a] to-[#ec4899]',
  'from-[#8b5cf6] to-[#3b82f6]',
  'from-[#fbbf24] to-[#ff5e3a]',
  'from-[#10b981] to-[#3b82f6]',
  'from-[#ec4899] to-[#8b5cf6]',
];

/** Pure content component — rendered inside ModalCard, no card chrome here. */
export function LibraryModal({ l_id }: { l_id: number }) {
  const { close, openAddRecord, openAddMember } = useLibraryUI();
  const [lib, setLib] = useState<LibraryDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const reload = useCallback(async () => {
    try {
      const d = await api<LibraryDetail>(`/libraries/${l_id}`);
      setLib(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  }, [l_id]);

  useEffect(() => {
    let alive = true;
    api<LibraryDetail>(`/libraries/${l_id}`)
      .then((d) => alive && setLib(d))
      .catch((err) => alive && setError(err.message ?? 'Failed to load'));
    return () => {
      alive = false;
    };
  }, [l_id]);

  function handleRenamed(newName: string) {
    setLib((prev) => (prev ? { ...prev, l_name: newName } : prev));
  }

  return (
    <>
      <div className="flex items-end gap-4 sm:gap-5 mb-6 sm:mb-8">
        <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl bg-gradient-to-br from-[#ff5e3a] to-[#ec4899] shrink-0 shadow-xl shadow-pink-500/20" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.18em] text-zinc-500 font-medium mb-1 sm:mb-2">
            Library
          </p>
          <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-zinc-100 tracking-tight truncate">
            {lib?.l_name ?? 'Library'}
          </h2>
          {lib?.records && (
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 sm:mt-2">
              {lib.records.length} record{lib.records.length === 1 ? '' : 's'}
            </p>
          )}
        </div>
      </div>

      {lib && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6">
          <button
            onClick={() => openAddRecord(lib.l_id)}
            className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#ff5e3a] text-white text-xs sm:text-sm font-semibold hover:bg-[#ff7a5a] active:scale-95 transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2"
          >
            <span className="text-base leading-none">+</span> Add record
          </button>
          <button
            onClick={() => openAddMember(lib.l_id)}
            className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-zinc-200 text-xs sm:text-sm font-medium transition-all"
          >
            Manage members
          </button>
          {lib.level === 'owner' && (
            <button
              onClick={() => setSettingsOpen((v) => !v)}
              className={`ml-auto w-9 h-9 sm:w-10 sm:h-10 grid place-items-center rounded-full border transition-all ${
                settingsOpen
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-zinc-300'
              }`}
              aria-label="Library settings"
              aria-expanded={settingsOpen}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          )}
        </div>
      )}

      {lib && settingsOpen && (
        <SettingsPanel
          lib={lib}
          onRenamed={handleRenamed}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {error && (
        <p className="text-sm text-red-400 italic">Could not load ({error}).</p>
      )}
      {!error && !lib && <p className="text-sm text-zinc-500">Loading…</p>}
      {lib && (
        <>
          {lib.records && lib.records.length > 0 ? (
            <ul className="rounded-xl border border-white/[0.06] overflow-visible divide-y divide-white/[0.04]">
              <li className="grid grid-cols-[40px_minmax(0,1fr)_36px] sm:grid-cols-[40px_40px_minmax(0,1fr)_auto_36px] items-center gap-3 px-4 py-2 text-[11px] uppercase tracking-wider text-zinc-500 font-medium bg-white/[0.02]">
                <span className="hidden sm:block text-center">#</span>
                <span className="hidden sm:block" />
                <span>Title</span>
                <span className="hidden sm:block">Owner</span>
                <span />
              </li>
              {lib.records.map((r, i) => (
                <RecordRow
                  key={r.r_id}
                  l_id={lib.l_id}
                  record={r}
                  index={i + 1}
                  gradient={COVER_GRADIENTS[i % COVER_GRADIENTS.length]}
                  members={lib.members ?? []}
                  canManage={lib.level === 'owner'}
                  onChanged={reload}
                />
              ))}
            </ul>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 p-10 text-center">
              <p className="text-zinc-400">No records yet.</p>
              <p className="text-zinc-500 text-sm mt-1">
                Add your first record to get started.
              </p>
            </div>
          )}
        </>
      )}
    </>
  );
}

function RecordRow({
  l_id,
  record: r,
  index,
  gradient,
  members,
  canManage,
  onChanged,
}: {
  l_id: number;
  record: RecordItem;
  index: number;
  gradient: string;
  members: MemberItem[];
  canManage: boolean;
  onChanged: () => void | Promise<void>;
}) {
  return (
    <li className="grid grid-cols-[40px_minmax(0,1fr)_36px] sm:grid-cols-[40px_40px_minmax(0,1fr)_auto_36px] items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors">
      <div className="hidden sm:grid h-10 place-items-center text-zinc-500 text-sm font-medium">
        {index}
      </div>
      <div
        className={`w-10 h-10 rounded-md bg-gradient-to-br ${gradient} overflow-hidden shrink-0`}
      >
        {r.thumb_url && (
          <img src={r.thumb_url} alt="" className="w-full h-full object-cover" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-zinc-100 truncate">{r.r_name}</p>
        <p className="text-xs text-zinc-500 truncate">{r.artist}</p>
        <p className="sm:hidden text-xs text-zinc-400 truncate mt-0.5">{r.owner ?? '—'}</p>
      </div>
      <p className="hidden sm:block text-xs text-zinc-400 shrink-0">{r.owner ?? '—'}</p>
      {canManage ? (
        <RecordMenu l_id={l_id} record={r} members={members} onChanged={onChanged} />
      ) : (
        <span />
      )}
    </li>
  );
}

function RecordMenu({
  l_id,
  record: r,
  members,
  onChanged,
}: {
  l_id: number;
  record: RecordItem;
  members: MemberItem[];
  onChanged: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'root' | 'owner' | 'confirm-delete'>('root');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function close() {
    setOpen(false);
    setView('root');
    setError(null);
  }

  async function handleChangeOwner(u_id: number) {
    setBusy(true);
    setError(null);
    try {
      await api(`/libraries/${l_id}/records/${r.r_id}`, {
        method: 'PATCH',
        body: JSON.stringify({ u_id }),
      });
      close();
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change owner');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    setError(null);
    try {
      await api(`/libraries/${l_id}/records/${r.r_id}`, { method: 'DELETE' });
      close();
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-label="Record options"
        aria-expanded={open}
        className="w-8 h-8 grid place-items-center rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-white/10 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="3" cy="8" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="13" cy="8" r="1.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-20 w-56 rounded-xl border border-white/10 bg-zinc-900/95 backdrop-blur shadow-xl shadow-black/40 py-1 animate-modal-in">
          {view === 'root' && (
            <>
              <MenuItem onClick={() => setView('owner')}>Change owner…</MenuItem>
              <div className="h-px bg-white/[0.06] my-1" />
              <MenuItem danger onClick={() => setView('confirm-delete')}>
                Delete from library
              </MenuItem>
            </>
          )}
          {view === 'owner' && (
            <>
              <p className="px-3 py-2 text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
                Assign to
              </p>
              {members.length === 0 ? (
                <p className="px-3 py-2 text-xs text-zinc-500 italic">No members.</p>
              ) : (
                <ul className="max-h-56 overflow-y-auto">
                  {members.map((m) => {
                    const current = m.username === r.owner;
                    return (
                      <li key={m.u_id}>
                        <button
                          type="button"
                          onClick={() => !current && !busy && handleChangeOwner(m.u_id)}
                          disabled={current || busy}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm text-zinc-200 hover:bg-white/[0.06] disabled:opacity-50 disabled:cursor-default transition-colors"
                        >
                          <span className="truncate">{m.username}</span>
                          {current && (
                            <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                              current
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="h-px bg-white/[0.06] my-1" />
              <MenuItem onClick={() => setView('root')}>Back</MenuItem>
            </>
          )}
          {view === 'confirm-delete' && (
            <div className="px-3 py-2">
              <p className="text-xs text-zinc-300 mb-2">
                Remove <span className="font-semibold">{r.r_name}</span> from this library?
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setView('root')}
                  disabled={busy}
                  className="px-3 py-1.5 rounded-md text-xs text-zinc-300 hover:bg-white/[0.06] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={busy}
                  className="px-3 py-1.5 rounded-md bg-red-500/90 hover:bg-red-500 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
                >
                  {busy ? 'Removing…' : 'Remove'}
                </button>
              </div>
            </div>
          )}
          {error && (
            <p className="px-3 py-2 text-xs text-red-400 italic">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  children,
  danger,
  onClick,
}: {
  children: React.ReactNode;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
        danger
          ? 'text-red-300 hover:bg-red-500/10'
          : 'text-zinc-200 hover:bg-white/[0.06]'
      }`}
    >
      {children}
    </button>
  );
}

function SettingsPanel({
  lib,
  onRenamed,
  onClose,
}: {
  lib: LibraryDetail;
  onRenamed: (newName: string) => void;
  onClose: () => void;
}) {
  const { renameLibrary, deleteLibrary, close } = useLibraryUI();
  const [name, setName] = useState(lib.l_name);
  const [renaming, setRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const trimmed = name.trim();
  const dirty = trimmed.length > 0 && trimmed !== lib.l_name;

  async function handleRename(e: FormEvent) {
    e.preventDefault();
    if (!dirty) return;
    setRenameError(null);
    setRenaming(true);
    try {
      await renameLibrary(lib.l_id, trimmed);
      onRenamed(trimmed);
    } catch (err) {
      setRenameError(err instanceof Error ? err.message : 'Could not rename');
    } finally {
      setRenaming(false);
    }
  }

  async function handleDelete() {
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteLibrary(lib.l_id);
      close();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not delete');
      setDeleting(false);
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 animate-modal-in">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
          Library settings
        </h3>
        <button
          onClick={onClose}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Close
        </button>
      </div>

      <form onSubmit={handleRename} className="mb-6">
        <label className="block text-xs uppercase tracking-wider text-zinc-500 font-medium mb-2">
          Name
        </label>
        <div className="flex items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={128}
            className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 focus:border-white/30 focus:outline-none text-sm text-zinc-100"
          />
          <button
            type="submit"
            disabled={!dirty || renaming}
            className="px-4 py-2 rounded-lg bg-[#ff5e3a] text-white text-sm font-semibold hover:bg-[#ff7a5a] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {renaming ? 'Saving…' : 'Save'}
          </button>
        </div>
        {renameError && (
          <p className="text-xs text-red-400 italic mt-2">{renameError}</p>
        )}
      </form>

      <div className="pt-5 border-t border-white/[0.06]">
        <p className="text-xs uppercase tracking-wider text-zinc-500 font-medium mb-2">
          Delete library
        </p>
        <p className="text-sm text-zinc-400 mb-3">
          Removes this library for all members along with every record in it.
          This cannot be undone.
        </p>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-300 text-sm font-medium transition-all"
          >
            Delete library
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold active:scale-95 transition-all disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Yes, delete forever'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-sm font-medium transition-all"
            >
              Cancel
            </button>
          </div>
        )}
        {deleteError && (
          <p className="text-xs text-red-400 italic mt-2">{deleteError}</p>
        )}
      </div>
    </div>
  );
}
