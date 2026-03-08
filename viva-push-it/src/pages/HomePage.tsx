import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function HomePage() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-700">viva.push.it</h1>
          <nav className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
                    {user?.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2) ?? '?'}
                  </div>
                  <span className="text-slate-700 font-medium hidden sm:inline">{user?.fullName}</span>
                </div>
                <Link
                  to={user?.role === 'admin' ? '/admin' : '/area-utente'}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors text-sm"
                >
                  Area riservata
                </Link>
                <button
                  onClick={logout}
                  className="px-3 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-sm"
                >
                  Esci
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Accedi
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-16">
        <section className="text-center">
          <h2 className="text-4xl font-bold text-slate-800 mb-4">
            Benvenuti alla Scuola di Musica viva.push.it
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12">
            Un luogo dove la musica prende vita. Corsi di pianoforte, chitarra, canto e molto altro
            per bambini e ragazzi.
          </p>

          {!isAuthenticated && (
            <div className="flex gap-4 justify-center">
              <Link
                to="/login"
                className="px-8 py-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
              >
                Accedi al portale
              </Link>
            </div>
          )}
        </section>

        <section className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-2">Per i Genitori</h3>
            <p className="text-slate-600 text-sm">
              Visualizza i corsi, segnala assenze e gestisci i pagamenti delle rette online.
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-2">Per la Direzione</h3>
            <p className="text-slate-600 text-sm">
              Dashboard completa: allievi, presenze, contabilità e bacheca eventi.
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-2">Prossimi Eventi</h3>
            <p className="text-slate-600 text-sm">
              Saggi, concerti e chiusure: resta aggiornato su tutte le iniziative.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
