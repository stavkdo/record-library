import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Wordmark } from './Wordmark';
import { Sidebar } from './Sidebar';
import { ModalBackdrop } from './Modal';
import { ModalCard } from './ModalCard';
import { LibraryUIProvider } from '../state/LibraryUI';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <LibraryUIProvider>
      <div className="min-h-screen flex flex-col bg-[#0a0a0d]">
        <header className="sticky top-0 z-40 bg-[#0a0a0d]/80 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="px-3 sm:px-6 h-16 flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Toggle sidebar"
              aria-expanded={sidebarOpen}
              className="md:hidden w-9 h-9 grid place-items-center rounded-lg text-zinc-300 hover:bg-white/10 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M2 4h14M2 9h14M2 14h14" />
              </svg>
            </button>
            <Link to="/" className="group">
              <Wordmark size={26} />
            </Link>
            <div className="ml-auto flex items-center gap-2 sm:gap-3 text-sm">
              {user && (
                <>
                  <span className="hidden sm:inline text-zinc-400">
                    Welcome,{' '}
                    <span className="text-zinc-100 font-semibold">{user.username}</span>
                  </span>
                  <span className="hidden sm:inline w-px h-5 bg-white/10" />
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
        <div className="flex flex-1 min-h-0 relative">
          {sidebarOpen && (
            <div
              className="md:hidden fixed inset-0 top-16 z-30 bg-black/50"
              onClick={() => setSidebarOpen(false)}
              aria-hidden
            />
          )}
          <Sidebar
            isOpen={sidebarOpen}
            onNavigate={() => setSidebarOpen(false)}
          />
          <main className="flex-1 overflow-auto bg-[#0a0a0d] min-w-0">
            <Outlet />
          </main>
        </div>
        <ModalBackdrop />
        <ModalCard />
      </div>
    </LibraryUIProvider>
  );
}
