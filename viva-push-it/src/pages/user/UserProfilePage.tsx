import { useRef, useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { isBackendConfigured } from '../../lib/apiClient';
import { changePasswordBackend, uploadAvatarBackend, removeAvatarBackend, updateOwnProfileBackend } from '../../services/apiBackend';
import { Avatar } from '../../components/Avatar';

export function UserProfilePage() {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileForm, setProfileForm] = useState({ fullName: '', phone: '' });
  useEffect(() => {
    if (user) setProfileForm({ fullName: user.fullName, phone: user.phone ?? '' });
  }, [user?.id, user?.fullName, user?.phone]);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const useDb = isBackendConfigured();
  const { students, courses, enrollments } = useData();

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
  const myStudents = students.filter((s) => s.userId === user?.id);
  const studentIds = myStudents.map((s) => s.id);

  const myEnrollments = enrollments.filter(
    (e) => e.isActive && studentIds.includes(e.studentId)
  );
  const courseIds = [...new Set(myEnrollments.map((e) => e.courseId))];
  const myCourses = courses.filter((c) => courseIds.includes(c.id));

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.fullName.trim() || !useDb) return;
    setProfileError('');
    setProfileSaving(true);
    try {
      const updated = await updateOwnProfileBackend(profileForm.fullName.trim(), profileForm.phone || undefined);
      refreshUser();
      setProfileForm({ fullName: updated.fullName, phone: updated.phone ?? '' });
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Errore aggiornamento');
    } finally {
      setProfileSaving(false);
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
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Profilo Personale</h1>

      {/* Foto profilo e recap */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 mb-8">
        <div className="flex items-center gap-6">
          <div>
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
            {avatarError && <p className="mt-1 text-sm text-red-600">{avatarError}</p>}
          </div>
          <div className="flex-1">
            <form onSubmit={handleUpdateProfile} className="space-y-3">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Nome</label>
                <input
                  type="text"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm((f) => ({ ...f, fullName: e.target.value }))}
                  placeholder="Nome completo"
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Telefono</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+39 333 1234567"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <p className="text-slate-600 text-sm">{user?.email}</p>
              {profileError && <p className="text-sm text-red-600">{profileError}</p>}
              {useDb && (
                <button type="submit" disabled={profileSaving} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                  {profileSaving ? 'Salvataggio...' : 'Salva modifiche'}
                </button>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Cambia password */}
      {useDb && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 mb-8">
          <h2 className="font-semibold text-slate-800 mb-4">Cambia password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
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
      )}

      {/* Corsi attivi */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h2 className="font-semibold text-slate-800 mb-4">Corsi attivi</h2>
        {myCourses.length === 0 ? (
          <p className="text-slate-500">Nessun corso attivo.</p>
        ) : (
          <ul className="space-y-4">
            {myCourses.map((c) => (
              <li key={c.id} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
                <div>
                  <p className="font-medium text-slate-800">{c.name}</p>
                  <p className="text-sm text-slate-500">
                    {dayNames[c.dayOfWeek]} {c.startTime} - {c.endTime} • {c.room}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Allievi collegati */}
      {myStudents.length > 0 && (
        <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-slate-800 mb-4">I tuoi allievi</h2>
          <div className="flex gap-4 flex-wrap">
            {myStudents.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-bold">
                  {s.firstName.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-slate-800">{s.firstName} {s.lastName}</p>
                  <p className="text-sm text-slate-500">
                    {myEnrollments.filter((e) => e.studentId === s.id).length} corso/i
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
