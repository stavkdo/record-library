import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Logo } from './Logo';
import { Sidebar } from './Sidebar';
import { LibraryUIProvider } from '../state/LibraryUI';
import { CreateLibraryModal } from '../modals/CreateLibraryModal';
import { LibraryModal } from '../modals/LibraryModal';
import { AddRecordModal } from '../modals/AddRecordModal';
import { AddMemberModal } from '../modals/AddMemberModal';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <LibraryUIProvider>
      <div className="min-h-screen flex flex-col bg-[#0a0a0d]">
        <header className="sticky top-0 z-30 bg-[#0a0a0d]/80 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="px-6 h-16 flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3 group">
              <Logo size={36} className="transition-transform group-hover:scale-105" />
              <span className="font-display text-2xl font-extrabold text-brand-gradient">
                Records Library
              </span>
            </Link>
            <div className="ml-auto flex items-center gap-3 text-sm">
              {user && (
                <>
                  <span className="text-zinc-400">
                    Welcome,{' '}
                    <span className="text-zinc-100 font-semibold">{user.username}</span>
                  </span>
                  <span className="w-px h-5 bg-white/10" />
                  <button
                    onClick={handleLogout}
                    className="text-zinc-400 hover:text-white font-medium transition-colors"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </header>
        <div className="flex flex-1 min-h-0">
          <Sidebar />
          <main className="flex-1 overflow-auto bg-[#0a0a0d]">
            <Outlet />
          </main>
        </div>
        <CreateLibraryModal />
        <LibraryModal />
        <AddRecordModal />
        <AddMemberModal />
      </div>
    </LibraryUIProvider>
  );
}
