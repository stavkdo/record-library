import { type FormEvent, useState } from 'react';
import { api } from '../api/client';
import { Field } from '../components/Field';
import { useLibraryUI } from '../state/LibraryUI';

export function CreateLibraryModal() {
  const { modal, close, refresh, openLibrary } = useLibraryUI();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function handleClose() {
    setName('');
    setError(null);
    close();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const lib = await api<{ l_id: number }>('/libraries', {
        method: 'POST',
        body: JSON.stringify({ l_name: name }),
      });
      await refresh();
      setName('');
      openLibrary(lib.l_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create library');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-md mx-auto pt-4">
        <div>
          <h2 className="font-display text-3xl font-extrabold text-zinc-100 tracking-tight">
            New library
          </h2>
          <p className="text-sm text-zinc-400 mt-2">
            Name your collection. You'll be set as the owner.
          </p>
        </div>
        <Field
          variant="pill"
          placeholder="My favorite records"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
          maxLength={128}
        />
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
            {busy ? 'Creating…' : 'Create library'}
          </button>
        </div>
    </form>
  );
}
