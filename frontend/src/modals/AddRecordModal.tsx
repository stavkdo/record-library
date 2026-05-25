import { type FormEvent, useEffect, useState } from 'react';
import { api } from '../api/client';
import { Field } from '../components/Field';

interface DiscogsResult {
  discogs_id: number;
  title: string;
  artist: string | null;
  year: number | null;
  thumb_url: string | null;
  genres: string[];
}

// Mirror the backend Pydantic constraints so we fail fast in the UI.
const NAME_MAX = 255;
const GENRE_MAX = 64;
const YEAR_MIN = 1800;
const YEAR_MAX = 2100;

/** Pure content component — rendered inside ModalCard, no card chrome here. */
export function AddRecordModal({ l_id }: { l_id: number }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DiscogsResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<number | 'manual' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastAdded, setLastAdded] = useState<string | null>(null);

  // Manual-entry panel: collapsed by default.
  const [manualOpen, setManualOpen] = useState(false);
  const [name, setName] = useState('');
  const [artist, setArtist] = useState('');
  const [year, setYear] = useState('');
  const [genre, setGenre] = useState('');

  // Debounced search against /discogs/search.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      setError(null);
      return;
    }
    // Show "Searching…" immediately — before the debounce timer fires.
    setResults([]);
    setSearching(true);
    setError(null);
    const ctl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const data = await api<DiscogsResult[]>(
          `/discogs/search?q=${encodeURIComponent(q)}`,
          { signal: ctl.signal },
        );
        setResults(data);
        setSearching(false);
      } catch (err) {
        // Don't touch `searching` on abort — the next effect run will reset it.
        if ((err as { name?: string }).name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Search failed');
        setSearching(false);
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      ctl.abort();
    };
  }, [query]);

  async function handlePick(r: DiscogsResult) {
    setAdding(r.discogs_id);
    setError(null);
    try {
      await api(`/libraries/${l_id}/records`, {
        method: 'POST',
        body: JSON.stringify({ kind: 'discogs', discogs_id: r.discogs_id }),
      });
      setLastAdded(r.title);
      setQuery('');
      setResults([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add record');
    } finally {
      setAdding(null);
    }
  }

  async function handleManualSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedArtist = artist.trim();
    const trimmedGenre = genre.trim();
    if (!trimmedName || !trimmedArtist) return;
    let parsedYear: number | null = null;
    if (year.trim()) {
      const n = Number(year);
      if (!Number.isInteger(n) || n < YEAR_MIN || n > YEAR_MAX) {
        setError(`Year must be between ${YEAR_MIN} and ${YEAR_MAX}.`);
        return;
      }
      parsedYear = n;
    }
    setAdding('manual');
    setError(null);
    try {
      await api(`/libraries/${l_id}/records`, {
        method: 'POST',
        body: JSON.stringify({
          kind: 'manual',
          r_name: trimmedName,
          artist: trimmedArtist,
          year: parsedYear,
          genres: trimmedGenre ? [trimmedGenre] : [],
        }),
      });
      setLastAdded(trimmedName);
      setName('');
      setArtist('');
      setYear('');
      setGenre('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add record');
    } finally {
      setAdding(null);
    }
  }

  const manualReady =
    name.trim().length > 0 && artist.trim().length > 0 && adding === null;

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto pt-2">
      <div>
        <h2 className="font-display text-3xl font-extrabold text-zinc-100 tracking-tight">
          Add a record
        </h2>
        <p className="text-sm text-zinc-400 mt-2">
          Search the Discogs catalog or enter the details by hand.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Field
          variant="pill"
          placeholder="Search by artist or album…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          maxLength={200}
          autoFocus
        />
        {lastAdded && (
          <p className="text-xs text-zinc-300 px-2">
            Added <span className="font-semibold">{lastAdded}</span> to the library.
          </p>
        )}
      </div>

      <ResultsList
        query={query}
        results={results}
        searching={searching}
        adding={typeof adding === 'number' ? adding : null}
        disabled={adding !== null}
        onPick={handlePick}
      />

      {!manualOpen ? (
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-zinc-500">
            Can't find it on Discogs?
          </p>
          <button
            type="button"
            onClick={() => setManualOpen(true)}
            className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 text-sm font-medium transition-all"
          >
            Enter manually
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
              Manual entry
            </span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                variant="pill"
                placeholder="Record name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={NAME_MAX}
                autoFocus
              />
              <Field
                variant="pill"
                placeholder="Artist"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                maxLength={NAME_MAX}
              />
              <Field
                variant="pill"
                placeholder="Year"
                type="number"
                min={YEAR_MIN}
                max={YEAR_MAX}
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
              <Field
                variant="pill"
                placeholder="Genre"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                maxLength={GENRE_MAX}
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setManualOpen(false)}
                className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 text-sm font-medium transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!manualReady}
                className="px-5 py-2.5 rounded-full bg-[#ff5e3a] text-white text-sm font-semibold hover:bg-[#ff7a5a] active:scale-95 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {adding === 'manual' ? 'Saving…' : 'Add record'}
              </button>
            </div>
          </form>
        </>
      )}

      {!manualOpen && error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

function ResultsList({
  query,
  results,
  searching,
  adding,
  disabled,
  onPick,
}: {
  query: string;
  results: DiscogsResult[];
  searching: boolean;
  adding: number | null;
  disabled: boolean;
  onPick: (r: DiscogsResult) => void;
}) {
  const trimmed = query.trim();
  if (trimmed.length < 2) return null;
  if (searching && results.length === 0) {
    return <p className="text-sm text-zinc-500">Searching…</p>;
  }
  if (!searching && results.length === 0) {
    return <p className="text-sm text-zinc-500">No matches.</p>;
  }
  return (
    <ul className="rounded-xl border border-white/[0.06] overflow-hidden divide-y divide-white/[0.04] max-h-[320px] overflow-y-auto">
      {results.map((r) => (
        <ResultRow
          key={r.discogs_id}
          result={r}
          busy={adding === r.discogs_id}
          disabled={disabled}
          onPick={() => onPick(r)}
        />
      ))}
    </ul>
  );
}

function ResultRow({
  result: r,
  busy,
  disabled,
  onPick,
}: {
  result: DiscogsResult;
  busy: boolean;
  disabled: boolean;
  onPick: () => void;
}) {
  return (
    <li className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 hover:bg-white/[0.04] transition-colors">
      <div className="w-12 h-12 rounded-md bg-white/[0.04] overflow-hidden shrink-0">
        {r.thumb_url && (
          <img src={r.thumb_url} alt="" className="w-full h-full object-cover" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-zinc-100 truncate">{r.title}</p>
        <p className="text-xs text-zinc-400 truncate">
          {[r.artist, r.year].filter(Boolean).join(' · ') || '—'}
        </p>
      </div>
      <button
        type="button"
        onClick={onPick}
        disabled={disabled}
        className="px-3 py-1.5 rounded-full bg-[#ff5e3a] text-white text-xs font-semibold hover:bg-[#ff7a5a] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        {busy ? 'Adding…' : 'Add'}
      </button>
    </li>
  );
}
