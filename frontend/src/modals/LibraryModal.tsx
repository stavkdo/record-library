import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { useLibraryUI } from '../state/LibraryUI';

interface RecordItem {
  r_id: number;
  r_name: string;
  artist: string;
  year: number | null;
  thumb_url: string | null;
  added_by?: string;
}

interface LibraryDetail {
  l_id: number;
  l_name: string;
  creation_date: string;
  records?: RecordItem[];
}

const COVER_GRADIENTS = [
  'from-[#ff5e3a] to-[#ec4899]',
  'from-[#8b5cf6] to-[#3b82f6]',
  'from-[#fbbf24] to-[#ff5e3a]',
  'from-[#10b981] to-[#3b82f6]',
  'from-[#ec4899] to-[#8b5cf6]',
];

export function LibraryModal() {
  const { modal, close, openAddRecord, openAddMember } = useLibraryUI();
  const [lib, setLib] = useState<LibraryDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const open = modal.kind === 'library';
  const l_id = open ? modal.l_id : null;

  useEffect(() => {
    if (l_id == null) {
      setLib(null);
      setError(null);
      return;
    }
    let alive = true;
    api<LibraryDetail>(`/libraries/${l_id}`)
      .then((d) => alive && setLib(d))
      .catch((err) => alive && setError(err.message ?? 'Failed to load'));
    return () => {
      alive = false;
    };
  }, [l_id]);

  return (
    <Modal open={open} onClose={close}>
      <div className="flex items-end gap-5 mb-8">
        <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-[#ff5e3a] to-[#ec4899] shrink-0 shadow-xl shadow-pink-500/20" />
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 font-medium mb-2">
            Library
          </p>
          <h2 className="font-display text-4xl font-extrabold text-zinc-100 tracking-tight truncate">
            {lib?.l_name ?? 'Library'}
          </h2>
          {lib?.records && (
            <p className="text-sm text-zinc-400 mt-2">
              {lib.records.length} record{lib.records.length === 1 ? '' : 's'}
            </p>
          )}
        </div>
      </div>

      {lib && (
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => openAddRecord(lib.l_id)}
            className="px-5 py-2.5 rounded-full bg-[#ff5e3a] text-white text-sm font-semibold hover:bg-[#ff7a5a] active:scale-95 transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2"
          >
            <span className="text-base leading-none">+</span> Add record
          </button>
          <button
            onClick={() => openAddMember(lib.l_id)}
            className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-zinc-200 text-sm font-medium transition-all"
          >
            Manage members
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 italic">Could not load ({error}).</p>
      )}
      {!error && !lib && <p className="text-sm text-zinc-500">Loading…</p>}
      {lib && (
        <>
          {lib.records && lib.records.length > 0 ? (
            <ul className="rounded-xl border border-white/[0.06] overflow-hidden divide-y divide-white/[0.04]">
              <li className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-4 px-4 py-2 text-[11px] uppercase tracking-wider text-zinc-500 font-medium bg-white/[0.02]">
                <span className="text-center">#</span>
                <span>Title</span>
                <span>Added by</span>
              </li>
              {lib.records.map((r, i) => (
                <RecordRow
                  key={r.r_id}
                  record={r}
                  index={i + 1}
                  gradient={COVER_GRADIENTS[i % COVER_GRADIENTS.length]}
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
    </Modal>
  );
}

function RecordRow({
  record: r,
  index,
  gradient,
}: {
  record: RecordItem;
  index: number;
  gradient: string;
}) {
  return (
    <li className="group grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 hover:bg-white/[0.04] transition-colors">
      <div className="relative w-10 h-10 grid place-items-center text-zinc-500 text-sm font-medium">
        <span className="group-hover:opacity-0 transition-opacity">{index}</span>
        <button
          type="button"
          className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity text-zinc-100"
          aria-label="Play"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M3 1.5v11l9.5-5.5z" />
          </svg>
        </button>
      </div>
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-10 h-10 rounded-md bg-gradient-to-br ${gradient} overflow-hidden shrink-0`}
        >
          {r.thumb_url && (
            <img src={r.thumb_url} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-100 truncate">{r.r_name}</p>
          <p className="text-xs text-zinc-400 truncate">{r.artist}</p>
        </div>
      </div>
      <span className="text-xs text-zinc-400 font-medium">
        {r.added_by ?? '—'}
      </span>
    </li>
  );
}
