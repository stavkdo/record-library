import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Field } from '../components/Field';
import { Wordmark } from '../components/Wordmark';

export function RegisterPage() {
  const { register } = useAuth();
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
      await register(username, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen grid place-items-center px-6 bg-[#0a0a0d] overflow-hidden">
      <div className="absolute inset-0 bg-spotlight pointer-events-none" />
      <div className="relative w-full max-w-sm animate-fade-up">
        <div className="flex flex-col items-center gap-4 mb-8">
          <Link to="/" className="group">
            <Wordmark size={40} />
          </Link>
          <p className="text-zinc-400 text-sm">Create your account</p>
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
            minLength={3}
            maxLength={64}
            autoComplete="username"
          />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <p className="text-xs text-zinc-500">At least 8 characters.</p>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-full bg-[#ff5e3a] text-white font-semibold text-sm hover:bg-[#ff7a5a] active:scale-[0.98] transition-all shadow-lg shadow-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {busy ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <p className="text-center text-sm text-zinc-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-zinc-100 font-medium hover:text-[#ff8a6a] transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
