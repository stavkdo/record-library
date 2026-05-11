import { type FormEvent, useState } from 'react';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { Field } from '../components/Field';
import { useLibraryUI } from '../state/LibraryUI';

export function AddRecordModal() {
  const { modal, close, openLibrary } = useLibraryUI();
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [artist, setArtist] = useState('');
  const [publishYear, setPublishYear] = useState('');
  const [genre, setGenre] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const open = modal.kind === 'add-record';
  const l_id = open ? modal.l_id : null;

  function reset() {
    setSearch('');
    setName('');
    setArtist('');
    setPublishYear('');
    setGenre('');
    setError(null);
  }

  function handleClose() {
    reset();
    close();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (l_id == null) return;
    setError(null);
    setBusy(true);
    try {
      await api(`/libraries/${l_id}/records`, {
        method: 'POST',
        body: JSON.stringify({
          r_name: name,
          artist,
          publish_year: publishYear ? Number(publishYear) : null,
          genre,
        }),
      });
      reset();
      openLibrary(l_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add record');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl mx-auto pt-2">
        <div>
          <h2 className="font-display text-3xl font-extrabold text-zinc-100 tracking-tight">
            Add a record
          </h2>
          <p className="text-sm text-zinc-400 mt-2">
            Search a catalog or enter the details manually.
          </p>
        </div>

        <Field
          variant="pill"
          placeholder="Search by record name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
            Or enter manually
          </span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field
            variant="pill"
            placeholder="Record name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Field
            variant="pill"
            placeholder="Artist"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
          />
          <Field
            variant="pill"
            placeholder="Year"
            type="number"
            value={publishYear}
            onChange={(e) => setPublishYear(e.target.value)}
          />
          <Field
            variant="pill"
            placeholder="Genre"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          />
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
            disabled={busy || !name.trim()}
            className="px-5 py-2.5 rounded-full bg-[#ff5e3a] text-white text-sm font-semibold hover:bg-[#ff7a5a] active:scale-95 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {busy ? 'Saving…' : 'Add record'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
