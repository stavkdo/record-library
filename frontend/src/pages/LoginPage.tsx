import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Field } from '../components/Field';
import { Logo } from '../components/Logo';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen grid place-items-center px-6 bg-[#0a0a0d] overflow-hidden">
      <div className="absolute inset-0 bg-spotlight pointer-events-none" />
      <div className="relative w-full max-w-sm animate-fade-up">
        <div className="flex flex-col items-center gap-3 mb-8">
          <Logo size={48} />
          <h1 className="font-display text-3xl font-extrabold text-brand-gradient tracking-tight">
            Records Library
          </h1>
          <p className="text-zinc-400 text-sm">Sign in to your collection</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-[#13131a] border border-white/[0.08] rounded-2xl p-7 space-y-4 shadow-2xl shadow-black/40"
        >
          <Field
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            required
            autoComplete="username"
          />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-full bg-[#ff5e3a] text-white font-semibold text-sm hover:bg-[#ff7a5a] active:scale-[0.98] transition-all shadow-lg shadow-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="text-center text-sm text-zinc-400 mt-6">
          New here?{' '}
          <Link to="/register" className="text-zinc-100 font-medium hover:text-[#ff8a6a] transition-colors">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
