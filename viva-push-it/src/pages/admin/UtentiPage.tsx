import { useState, useEffect } from 'react';
import { getUsers, addUser, updateUser, deleteUser, setUserPassword } from '../../store/usersStore';
import { isBackendConfigured } from '../../lib/apiClient';
import { fetchAllProfilesBackend, updateProfileBackend } from '../../services/apiBackend';
import type { User, UserRole } from '../../types/database';

export function UtentiPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [editing, setEditing] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<User> & { password?: string }>({});

  const useDb = isBackendConfigured();

  useEffect(() => {
    if (useDb) {
      fetchAllProfilesBackend().then(setUsers);
    } else {
      setUsers(getUsers());
    }
  }, [useDb]);

  const refresh = () => {
    if (useDb) fetchAllProfilesBackend().then(setUsers);
    else setUsers(getUsers());
  };

  const handleSave = async () => {
    if (editing) {
      if (useDb) {
        await updateProfileBackend(editing.id, {
          full_name: form.fullName ?? editing.fullName,
          role: form.role ?? editing.role,
        });
      } else {
        updateUser(editing.id, form);
        if (form.password) setUserPassword(editing.id, form.password);
      }
      setEditing(null);
      refresh();
    } else if (creating && form.email && form.fullName && form.role) {
      if (useDb) {
        // Con il backend i nuovi utenti si creano tramite la pagina Registrati o lo script di seed
        alert('Con il backend, usa "Registrati" nella pagina di login oppure lo script: npm run db:seed');
        return;
      }
      addUser(
        { email: form.email, fullName: form.fullName, role: form.role as UserRole },
        form.password ?? 'user123'
      );
      setCreating(false);
      setForm({});
      refresh();
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm('Eliminare questo utente?')) return;
    if (useDb) {
      alert('L\'eliminazione utenti va effettuata direttamente sul database.');
      return;
    }
    deleteUser(id);
    refresh();
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Gestione Utenti</h1>
        <button
          onClick={() => { setCreating(true); setEditing(null); setForm({}); }}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          + Nuovo utente
        </button>
      </div>

      {useDb && (
        <p className="mb-4 text-sm text-slate-600">
          Con il backend: i nuovi utenti si registrano dalla pagina di login. Per dati demo: <code className="bg-slate-100 px-1 rounded">npm run db:seed</code>
        </p>
      )}

      {(editing || creating) && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 mb-6">
          <h2 className="font-semibold text-slate-800 mb-4">{editing ? 'Modifica utente' : 'Nuovo utente'}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Email *</label>
              <input
                type="email"
                value={form.email ?? editing?.email ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                disabled={!!editing}
                className="w-full px-3 py-2 border rounded-lg disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Nome completo *</label>
              <input
                value={form.fullName ?? editing?.fullName ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Ruolo *</label>
              <select
                value={form.role ?? editing?.role ?? 'user'}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="admin">Admin</option>
                <option value="user">Utente (Genitore)</option>
              </select>
            </div>
            {!useDb && (
              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  {editing ? 'Nuova password (lascia vuoto per non cambiare)' : 'Password *'}
                </label>
                <input
                  type="password"
                  value={form.password ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder={editing ? 'Lascia vuoto per non cambiare' : 'user123'}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              Salva
            </button>
            <button onClick={() => { setEditing(null); setCreating(false); }} className="px-4 py-2 border rounded-lg">
              Annulla
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Nome</th>
              <th className="text-left p-4">Ruolo</th>
              <th className="text-left p-4">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="p-4">{u.email}</td>
                <td className="p-4 font-medium">{u.fullName}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${u.role === 'admin' ? 'bg-primary-100 text-primary-700' : 'bg-slate-100'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-4 flex gap-2">
                  <button
                    onClick={() => { setEditing(u); setCreating(false); setForm({}); }}
                    className="text-primary-600 hover:underline text-sm"
                  >
                    Modifica
                  </button>
                  {u.role !== 'admin' && (
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Elimina
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
