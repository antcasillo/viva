import { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { isBackendConfigured } from '../../lib/apiClient';
import { changePasswordBackend, uploadAvatarBackend, removeAvatarBackend } from '../../services/apiBackend';
import { Avatar } from '../../components/Avatar';

export function AdminProfilePage() {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const useDb = isBackendConfigured();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !useDb) return;
    setAvatarError('');
    setAvatarLoading(true);
    try {
      await uploadAvatarBackend(file);
      await refreshUser();
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Errore upload');
    } finally {
      setAvatarLoading(false);
      e.target.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (!useDb) return;
    setAvatarError('');
    setAvatarLoading(true);
    try {
      await removeAvatarBackend();
      await refreshUser();
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Errore');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);
    if (pwForm.new !== pwForm.confirm) {
      setPwError('Le password non coincidono');
      return;
    }
    if (pwForm.new.length < 6) {
      setPwError('La password deve essere di almeno 6 caratteri');
      return;
    }
    try {
      if (useDb) {
        await changePasswordBackend(pwForm.current, pwForm.new);
      } else {
        setPwError('Cambio password disponibile solo con backend attivo');
        return;
      }
      setPwSuccess(true);
      setPwForm({ current: '', new: '', confirm: '' });
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Errore durante il cambio password');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Profilo Admin</h1>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 mb-8 max-w-md">
        <div className="flex items-center gap-6 mb-6">
          <div className="relative">
            <Avatar avatarUrl={user?.avatarUrl} fullName={user?.fullName} size="lg" />
            {useDb && (
              <div className="mt-2 flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarLoading}
                  className="text-sm text-primary-600 hover:underline disabled:opacity-50"
                >
                  {avatarLoading ? 'Caricamento...' : 'Carica foto'}
                </button>
                {user?.avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={avatarLoading}
                    className="text-sm text-slate-500 hover:underline disabled:opacity-50"
                  >
                    Rimuovi
                  </button>
                )}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">{user?.fullName}</h2>
            <p className="text-slate-600">{user?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded">Admin</span>
            {avatarError && <p className="mt-1 text-sm text-red-600">{avatarError}</p>}
          </div>
        </div>

        <h2 className="font-semibold text-slate-800 mb-4">Cambia password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          {pwError && (
            <div className="text-red-600 text-sm">{pwError}</div>
          )}
          {pwSuccess && (
            <div className="text-green-600 text-sm">Password aggiornata con successo.</div>
          )}
          <div>
            <label className="block text-sm text-slate-600 mb-1">Password attuale</label>
            <input
              type="password"
              value={pwForm.current}
              onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
              required
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Nuova password</label>
            <input
              type="password"
              value={pwForm.new}
              onChange={(e) => setPwForm((f) => ({ ...f, new: e.target.value }))}
              required
              minLength={6}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Almeno 6 caratteri"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Conferma nuova password</label>
            <input
              type="password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
              required
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            Aggiorna password
          </button>
        </form>
      </div>
    </div>
  );
}
