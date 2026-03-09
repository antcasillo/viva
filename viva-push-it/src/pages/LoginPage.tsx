import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = await login(email, password, rememberMe);

    if (result.success && result.user) {
      if (result.user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/area-utente', { replace: true });
      }
    } else {
      setError(result.error ?? 'Errore di accesso');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-800 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800">viva.push.it</h1>
            <p className="text-slate-600 mt-2">Scuola di Musica</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="login" className="block text-sm font-medium text-slate-700 mb-2">
                Nome utente
              </label>
              <input
                id="login"
                name="username"
                type="text"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="nome utente"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none"
                  title={showPassword ? 'Nascondi password' : 'Mostra password'}
                  aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-slate-700">Resta connesso per 30 giorni</span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {import.meta.env.VITE_API_URL || import.meta.env.DEV
              ? 'Admin: admin / admin123'
              : 'Demo mock: admin / admin123 — genitore.bianchi@gmail.com / user123'}
          </p>
        </div>
      </div>
    </div>
  );
}
