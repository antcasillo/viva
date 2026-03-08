import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: '📊' },
  { path: '/admin/allievi', label: 'Allievi', icon: '👥' },
  { path: '/admin/presenze', label: 'Registro Presenze', icon: '✅' },
  { path: '/admin/contabile', label: 'Situazione Contabile', icon: '💰' },
  { path: '/admin/calendario', label: 'Calendario Corsi', icon: '📅' },
  { path: '/admin/bacheca', label: 'Bacheca Eventi', icon: '📌' },
  { path: '/admin/utenti', label: 'Gestione Utenti', icon: '👤' },
];

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const { isLoading, error, refresh } = useData();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-800 text-white transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-700">
          <Link to="/admin" className="font-bold text-lg truncate">
            {sidebarOpen ? 'viva.push.it' : 'v.'}
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-700 rounded-lg"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive ? 'bg-primary-600 text-white' : 'hover:bg-slate-700'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className={`flex items-center gap-3 ${sidebarOpen ? '' : 'justify-center'}`}>
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-sm font-bold">
              {user?.fullName?.charAt(0) ?? 'A'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.fullName}</p>
                <p className="text-xs text-slate-400 truncate">Admin</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`mt-3 w-full py-2 text-sm text-slate-400 hover:text-white rounded-lg ${
              sidebarOpen ? '' : 'px-0'
            }`}
          >
            {sidebarOpen ? 'Esci' : '🚪'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
            <div className="animate-spin w-10 h-10 border-2 border-primary-600 border-t-transparent rounded-full" />
          </div>
        )}
        {error && (
          <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
            <span className="text-amber-800">{error}</span>
            <button onClick={refresh} className="text-amber-700 underline text-sm">Riprova</button>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
