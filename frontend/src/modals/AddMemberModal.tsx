import { type FormEvent, useEffect, useState } from 'react';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
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

export function AddMemberModal() {
  const { modal, close, openLibrary } = useLibraryUI();
  const [search, setSearch] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const open = modal.kind === 'add-member';
  const l_id = open ? modal.l_id : null;

  useEffect(() => {
    if (l_id == null) {
      setMembers([]);
      return;
    }
    let alive = true;
    api<{ members?: Member[] }>(`/libraries/${l_id}`)
      .then((d) => alive && setMembers(d.members ?? []))
      .catch(() => {
        /* sidebar already shows the error */
      });
    return () => {
      alive = false;
    };
  }, [l_id]);

  function handleClose() {
    setSearch('');
    setError(null);
    close();
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
      openLibrary(l_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add member');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose}>
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
            <ul className="rounded-xl border border-white/[0.06] overflow-hidden divide-y divide-white/[0.04]">
              {members.map((m, i) => (
                <MemberRow
                  key={m.u_id}
                  member={m}
                  gradient={AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]}
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
    </Modal>
  );
}

function MemberRow({
  member: m,
  gradient,
}: {
  member: Member;
  gradient: string;
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
        <p className="text-sm font-semibold text-zinc-100 truncate">
          {m.username}
        </p>
        <p className="text-xs text-zinc-500 capitalize">{m.level}</p>
      </div>
      {m.level === 'owner' ? (
        <span className="px-2.5 py-1 rounded-full bg-[#ff5e3a]/15 text-[#ff8a6a] text-xs font-semibold">
          Owner
        </span>
      ) : (
        <button
          type="button"
          className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-xs font-medium transition-all"
        >
          Remove
        </button>
      )}
    </li>
  );
}
