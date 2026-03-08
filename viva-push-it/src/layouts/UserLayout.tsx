import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/area-utente', label: 'Profilo', icon: '👤' },
  { path: '/area-utente/prossime-lezioni', label: 'Prossime Lezioni', icon: '📅' },
  { path: '/area-utente/pagamenti', label: 'Pagamenti', icon: '💳' },
  { path: '/area-utente/eventi', label: 'Prossimi Eventi', icon: '📌' },
];

export function UserLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header semplificato */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link to="/area-utente" className="font-bold text-xl text-primary-700">
              viva.push.it
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-slate-600 text-sm">{user?.fullName}</span>
              <button
                onClick={handleLogout}
                className="text-slate-500 hover:text-slate-700 text-sm"
              >
                Esci
              </button>
            </div>
          </div>

          <nav className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
