import { type FormEvent, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../api/client';
import { Field } from '../components/Field';
import { useLibraryUI } from '../state/LibraryUI';

interface Member {
  u_id: number;
  username: string;
  level: 'owner' | 'member';
}

const AVATAR_GRADIENTS = [
  'from-[#ff5e3a] to-[#ec4899]',
  'from-[#8b5cf6] to-[#3b82f6]',
  'from-[#10b981] to-[#3b82f6]',
  'from-[#fbbf24] to-[#ff5e3a]',
  'from-[#ec4899] to-[#8b5cf6]',
];

/** Pure content component — rendered inside ModalCard, no card chrome here. */
export function AddMemberModal({ l_id }: { l_id: number }) {
  const { openLibrary } = useLibraryUI();
  const [search, setSearch] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [myLevel, setMyLevel] = useState<'owner' | 'member' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function reloadMembers() {
    try {
      const d = await api<{ members?: Member[]; level?: 'owner' | 'member' }>(`/libraries/${l_id}`);
      setMembers(d.members ?? []);
      if (d.level) setMyLevel(d.level);
    } catch {
      /* sidebar already shows the error */
    }
  }

  useEffect(() => {
    let alive = true;
    api<{ members?: Member[]; level?: 'owner' | 'member' }>(`/libraries/${l_id}`)
      .then((d) => {
        if (!alive) return;
        setMembers(d.members ?? []);
        if (d.level) setMyLevel(d.level);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [l_id]);

  function handleClose() {
    setSearch('');
    setError(null);
    openLibrary(l_id);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (l_id == null || !search.trim()) return;
    setError(null);
    setBusy(true);
    try {
      await api(`/libraries/${l_id}/members`, {
        method: 'POST',
        body: JSON.stringify({ username: search }),
      });
      setSearch('');
      await reloadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add member');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl mx-auto pt-2">
        <div>
          <h2 className="font-display text-3xl font-extrabold text-zinc-100 tracking-tight">
            Manage members
          </h2>
          <p className="text-sm text-zinc-400 mt-2">
            Invite users by username, or review who already has access.
          </p>
        </div>

        <Field
          variant="pill"
          placeholder="Search by username…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />

        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500 font-medium mb-3">
            Current members
          </p>
          {members.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
              <p className="text-sm text-zinc-500">No members yet.</p>
            </div>
          ) : (
            <ul className="rounded-xl border border-white/[0.06] overflow-visible divide-y divide-white/[0.04]">
              {members.map((m, i) => (
                <MemberRow
                  key={m.u_id}
                  l_id={l_id}
                  member={m}
                  gradient={AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]}
                  canManage={myLevel === 'owner'}
                  onRemoved={reloadMembers}
                />
              ))}
            </ul>
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 text-sm font-medium transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !search.trim()}
            className="px-5 py-2.5 rounded-full bg-[#ff5e3a] text-white text-sm font-semibold hover:bg-[#ff7a5a] active:scale-95 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {busy ? 'Saving…' : 'Invite member'}
          </button>
        </div>
    </form>
  );
}

function MemberRow({
  l_id,
  member: m,
  gradient,
  canManage,
  onRemoved,
}: {
  l_id: number;
  member: Member;
  gradient: string;
  canManage: boolean;
  onRemoved: () => void | Promise<void>;
}) {
  const initial = m.username.charAt(0).toUpperCase();
  return (
    <li className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors">
      <div
        className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient} grid place-items-center text-white text-sm font-semibold shadow-md`}
      >
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-100 truncate">{m.username}</p>
        <p className="text-xs text-zinc-500 capitalize">{m.level}</p>
      </div>
      <div className="w-20 shrink-0">
        {m.level === 'owner' ? (
          <span className="px-2.5 py-1 rounded-full bg-[#ff5e3a]/15 text-[#ff8a6a] text-xs font-semibold">
            Owner
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full bg-white/[0.06] text-zinc-400 text-xs font-semibold">
            Member
          </span>
        )}
      </div>
      {canManage && m.level !== 'owner' ? (
        <MemberMenu l_id={l_id} member={m} onRemoved={onRemoved} />
      ) : (
        <div className="w-8" />
      )}
    </li>
  );
}

function MemberMenu({
  l_id,
  member: m,
  onRemoved,
}: {
  l_id: number;
  member: Member;
  onRemoved: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (
        !buttonRef.current?.contains(e.target as Node) &&
        !menuRef.current?.contains(e.target as Node)
      ) {
        close();
      }
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

  function handleToggle() {
    if (open) {
      close();
    } else {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) {
        setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
      }
      setOpen(true);
    }
  }

  function close() {
    setOpen(false);
    setError(null);
  }

  async function handleRemove() {
    setBusy(true);
    setError(null);
    try {
      await api(`/libraries/${l_id}/members/${m.u_id}`, { method: 'DELETE' });
      close();
      await onRemoved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove member');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        aria-label="Member options"
        aria-expanded={open}
        className="w-8 h-8 grid place-items-center rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-white/10 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="3" cy="8" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="13" cy="8" r="1.5" />
        </svg>
      </button>
      {open && menuPos && createPortal(
        <div
          ref={menuRef}
          style={{ top: menuPos.top, right: menuPos.right }}
          className="fixed z-[9999] w-52 rounded-xl border border-white/10 bg-zinc-900/95 backdrop-blur shadow-xl shadow-black/40 py-1"
        >
          <button
            type="button"
            onClick={handleRemove}
            disabled={busy}
            className="w-full text-left px-3 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
          >
            {busy ? 'Removing…' : 'Remove from library'}
          </button>
          {error && <p className="px-3 py-1 text-xs text-red-400 italic">{error}</p>}
        </div>,
        document.body,
      )}
    </div>
  );
}
