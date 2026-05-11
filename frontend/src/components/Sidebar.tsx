import { useLibraryUI, type LibrarySummary } from '../state/LibraryUI';

const TILE_GRADIENTS = [
  'from-[#ff5e3a] to-[#ec4899]',
  'from-[#8b5cf6] to-[#3b82f6]',
  'from-[#fbbf24] to-[#ff5e3a]',
  'from-[#10b981] to-[#3b82f6]',
  'from-[#ec4899] to-[#8b5cf6]',
  'from-[#f97316] to-[#ef4444]',
];

export function Sidebar() {
  const { libraries, loading, loadError, openCreate, openLibrary } = useLibraryUI();

  return (
    <aside className="w-[340px] shrink-0 bg-[#0a0a0d] border-r border-white/[0.06] flex flex-col px-5 py-6 gap-6 overflow-y-auto">
      <section>
        <div className="flex items-center gap-3 mb-4 px-1">
          <h3 className="text-zinc-100 font-display font-bold text-base tracking-tight">
            Your Libraries
          </h3>
          <button
            onClick={openCreate}
            className="ml-auto whitespace-nowrap px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-zinc-200 text-xs font-medium transition-all flex items-center gap-1.5"
          >
            <span className="text-base leading-none">+</span> New
          </button>
        </div>

        {loading && (
          <p className="text-xs text-zinc-500 px-1">Loading…</p>
        )}
        {loadError && (
          <p className="text-xs text-zinc-500 italic px-1">Backend unavailable</p>
        )}
        {!loading && !loadError && libraries.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/10 p-5 text-center">
            <p className="text-xs text-zinc-500">No libraries yet.</p>
            <p className="text-xs text-zinc-600 mt-1">Click + New to create one.</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          {libraries.map((lib, i) => (
            <LibraryTile
              key={lib.l_id}
              lib={lib}
              gradient={TILE_GRADIENTS[i % TILE_GRADIENTS.length]}
              onClick={() => openLibrary(lib.l_id)}
            />
          ))}
        </div>
      </section>

      <section className="card-surface rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff5e3a] animate-pulse" />
          <h3 className="text-zinc-100 font-display font-bold text-base tracking-tight">
            Weekly Record
          </h3>
        </div>
        <div className="flex gap-3 items-start">
          <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#ec4899] shrink-0 shadow-lg shadow-purple-500/20" />
          <div className="text-sm leading-relaxed min-w-0">
            <p className="text-zinc-100 font-semibold truncate">Record name</p>
            <p className="text-zinc-400 truncate">Artist</p>
            <p className="text-zinc-500 text-xs mt-1">— · genre</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-white/10 py-6 px-5 text-center">
        <p className="text-zinc-500 text-sm">More features soon</p>
      </section>
    </aside>
  );
}

interface LibraryTileProps {
  lib: LibrarySummary;
  gradient: string;
  onClick: () => void;
}

function LibraryTile({ lib, gradient, onClick }: LibraryTileProps) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.14] hover:-translate-y-0.5 transition-all text-left"
    >
      <div
        className={`w-9 h-9 rounded-md bg-gradient-to-br ${gradient} shrink-0 shadow-md group-hover:shadow-lg transition-shadow`}
      />
      <span className="text-sm font-medium text-zinc-100 truncate">
        {lib.l_name}
      </span>
    </button>
  );
}
