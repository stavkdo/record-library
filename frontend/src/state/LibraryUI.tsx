import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, ApiError } from '../api/client';

export interface LibrarySummary {
  l_id: number;
  l_name: string;
  level?: 'owner' | 'member';
}

type ModalKind =
  | { kind: 'none' }
  | { kind: 'create' }
  | { kind: 'library'; l_id: number }
  | { kind: 'add-record'; l_id: number }
  | { kind: 'add-member'; l_id: number };

interface LibraryUIValue {
  libraries: LibrarySummary[];
  loading: boolean;
  loadError: string | null;
  refresh: () => Promise<void>;
  modal: ModalKind;
  openCreate: () => void;
  openLibrary: (l_id: number) => void;
  openAddRecord: (l_id: number) => void;
  openAddMember: (l_id: number) => void;
  close: () => void;
  renameLibrary: (l_id: number, l_name: string) => Promise<void>;
  deleteLibrary: (l_id: number) => Promise<void>;
}

const Ctx = createContext<LibraryUIValue | null>(null);

export function LibraryUIProvider({ children }: { children: ReactNode }) {
  const [libraries, setLibraries] = useState<LibrarySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalKind>({ kind: 'none' });

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const list = await api<LibrarySummary[]>('/libraries');
      setLibraries(list);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setLibraries([]);
      } else {
        setLoadError(err instanceof Error ? err.message : 'Failed to load');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const renameLibrary = useCallback(
    async (l_id: number, l_name: string) => {
      await api(`/libraries/${l_id}`, {
        method: 'PATCH',
        body: JSON.stringify({ l_name }),
      });
      await refresh();
    },
    [refresh],
  );

  const deleteLibrary = useCallback(
    async (l_id: number) => {
      await api(`/libraries/${l_id}`, { method: 'DELETE' });
      await refresh();
    },
    [refresh],
  );

  const value = useMemo<LibraryUIValue>(
    () => ({
      libraries,
      loading,
      loadError,
      refresh,
      modal,
      openCreate: () => setModal({ kind: 'create' }),
      openLibrary: (l_id) => setModal({ kind: 'library', l_id }),
      openAddRecord: (l_id) => setModal({ kind: 'add-record', l_id }),
      openAddMember: (l_id) => setModal({ kind: 'add-member', l_id }),
      close: () => setModal({ kind: 'none' }),
      renameLibrary,
      deleteLibrary,
    }),
    [libraries, loading, loadError, refresh, modal, renameLibrary, deleteLibrary],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLibraryUI() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLibraryUI must be used inside LibraryUIProvider');
  return ctx;
}
