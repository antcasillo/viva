import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { formatDate, parseDateToISO } from '../../utils/dateFormat';
import { isBackendConfigured } from '../../lib/apiClient';
import { fetchAllProfilesBackend, createProfileBackend } from '../../services/apiBackend';
import { getUsers, addUser } from '../../store/usersStore';
import type { Student, User } from '../../types/database';

const NEW_PARENT_VALUE = '__new__';

export function AllieviPage() {
  const { students, enrollments, addStudent, updateStudent, setStudentActive } = useData();
  const [profiles, setProfiles] = useState<User[]>([]);
  const [showNewParentForm, setShowNewParentForm] = useState(false);
  const [newParentForm, setNewParentForm] = useState({ fullName: '', email: '', phone: '', password: 'user123' });

  const useBackend = isBackendConfigured();
  const parentProfiles = useBackend ? profiles.filter((p) => p.role === 'user') : getUsers().filter((u) => u.role === 'user');

  useEffect(() => {
    if (useBackend) fetchAllProfilesBackend().then(setProfiles);
  }, [useBackend]);

  const refreshProfiles = () => {
    if (useBackend) fetchAllProfilesBackend().then(setProfiles);
  };

  const [editing, setEditing] = useState<Student | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Student>>({});

  const handleSave = async () => {
    if (editing) {
      const updates = { ...form };
      if (updates.dateOfBirth && updates.dateOfBirth.includes('-')) {
        const parts = updates.dateOfBirth.split('-');
        if (parts[0]?.length <= 2 && parts[2]?.length === 4) {
          updates.dateOfBirth = parseDateToISO(updates.dateOfBirth);
        }
      }
      await updateStudent(editing.id, updates);
      setEditing(null);
    } else if (creating && form.userId && form.firstName && form.lastName && form.dateOfBirth && form.parentName && form.parentPhone && form.parentEmail) {
      await addStudent({
        userId: form.userId,
        firstName: form.firstName,
        lastName: form.lastName,
        dateOfBirth: parseDateToISO(form.dateOfBirth),
        parentName: form.parentName,
        parentPhone: form.parentPhone,
        parentEmail: form.parentEmail,
        notes: form.notes,
        isActive: true,
      });
      setCreating(false);
      setForm({});
      setShowNewParentForm(false);
    }
  };

  const handleCreateParent = async () => {
    if (!newParentForm.fullName.trim() || !newParentForm.email.trim()) return;
    try {
      let newUser: User;
      if (useBackend) {
        newUser = await createProfileBackend({
          fullName: newParentForm.fullName.trim(),
          email: newParentForm.email.trim(),
          phone: newParentForm.phone.trim() || undefined,
          password: newParentForm.password || 'user123',
        });
        refreshProfiles();
      } else {
        newUser = addUser(
          { email: newParentForm.email.trim(), fullName: newParentForm.fullName.trim(), phone: newParentForm.phone.trim() || undefined, role: 'user' },
          newParentForm.password || 'user123'
        );
      }
      setForm((f) => ({
        ...f,
        userId: newUser.id,
        parentName: newUser.fullName,
        parentEmail: newUser.email,
        parentPhone: newUser.phone ?? newParentForm.phone,
      }));
      setShowNewParentForm(false);
      setNewParentForm({ fullName: '', email: '', phone: '', password: 'user123' });
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Errore creazione genitore');
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setForm((f) => ({ ...f, photoUrl: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleParentSelect = (value: string) => {
    if (value === NEW_PARENT_VALUE) {
      setShowNewParentForm(true);
      setForm((f) => ({ ...f, userId: '' }));
    } else {
      setShowNewParentForm(false);
      const p = parentProfiles.find((x) => x.id === value);
      setForm((f) => ({
        ...f,
        userId: value,
        parentName: p?.fullName ?? f.parentName,
        parentEmail: p?.email ?? f.parentEmail,
        parentPhone: p?.phone ?? f.parentPhone,
      }));
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Gestione Allievi</h1>
        <button
          onClick={() => { setCreating(true); setEditing(null); setForm({}); setShowNewParentForm(false); }}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          + Nuovo allievo
        </button>
      </div>

      {(editing || creating) && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 mb-6">
          <h2 className="font-semibold text-slate-800 mb-4">{editing ? 'Modifica' : 'Nuovo allievo'}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Foto profilo</label>
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="text-sm" />
              {(form.photoUrl || editing?.photoUrl) && (
                <img src={form.photoUrl || editing?.photoUrl} alt="" className="mt-2 w-20 h-20 rounded-full object-cover" />
              )}
            </div>
            <div />
            <div>
              <label className="block text-sm text-slate-600 mb-1">Nome *</label>
              <input
                value={form.firstName ?? editing?.firstName ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Cognome *</label>
              <input
                value={form.lastName ?? editing?.lastName ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Data di nascita (dd-mm-yyyy) *</label>
              <input
                value={form.dateOfBirth ?? (editing ? formatDate(editing.dateOfBirth) : '') ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                placeholder="gg-mm-aaaa"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            {creating && (
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-600 mb-1">Genitore *</label>
                <select
                  value={showNewParentForm ? NEW_PARENT_VALUE : (form.userId ?? '')}
                  onChange={(e) => handleParentSelect(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Seleziona genitore esistente</option>
                  {parentProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.email})
                    </option>
                  ))}
                  <option value={NEW_PARENT_VALUE}>➕ Aggiungi nuovo genitore</option>
                </select>

                {showNewParentForm && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                    <p className="text-sm font-medium text-slate-700">Nuovo genitore</p>
                    <div className="grid md:grid-cols-2 gap-3">
                      <input
                        value={newParentForm.fullName}
                        onChange={(e) => setNewParentForm((f) => ({ ...f, fullName: e.target.value }))}
                        placeholder="Nome e cognome *"
                        className="px-3 py-2 border rounded-lg"
                      />
                      <input
                        type="email"
                        value={newParentForm.email}
                        onChange={(e) => setNewParentForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="Email *"
                        className="px-3 py-2 border rounded-lg"
                      />
                      <input
                        value={newParentForm.phone}
                        onChange={(e) => setNewParentForm((f) => ({ ...f, phone: e.target.value }))}
                        placeholder="Telefono"
                        className="px-3 py-2 border rounded-lg"
                      />
                      <input
                        type="password"
                        value={newParentForm.password}
                        onChange={(e) => setNewParentForm((f) => ({ ...f, password: e.target.value }))}
                        placeholder="Password (default: user123)"
                        className="px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateParent}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                    >
                      Crea e usa come genitore
                    </button>
                  </div>
                )}
              </div>
            )}
            <div>
              <label className="block text-sm text-slate-600 mb-1">Nome genitore *</label>
              <input
                value={form.parentName ?? editing?.parentName ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, parentName: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
                disabled={!!editing}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Telefono genitore *</label>
              <input
                value={form.parentPhone ?? editing?.parentPhone ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, parentPhone: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Email genitore *</label>
              <input
                type="email"
                value={form.parentEmail ?? editing?.parentEmail ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, parentEmail: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
                disabled={!!editing}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-600 mb-1">Note</label>
              <textarea
                value={form.notes ?? editing?.notes ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
                rows={2}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              Salva
            </button>
            <button onClick={() => { setEditing(null); setCreating(false); setShowNewParentForm(false); }} className="px-4 py-2 border rounded-lg">
              Annulla
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-4">Foto</th>
              <th className="text-left p-4">Nome</th>
              <th className="text-left p-4">Nascita</th>
              <th className="text-left p-4">Genitore</th>
              <th className="text-left p-4">Corsi</th>
              <th className="text-left p-4">Stato</th>
              <th className="text-left p-4">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => {
              const courseCount = enrollments.filter((e) => e.studentId === s.id && e.isActive).length;
              return (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="p-4">
                    {s.photoUrl ? (
                      <img src={s.photoUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                        {s.firstName.charAt(0)}
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-medium">{s.firstName} {s.lastName}</td>
                  <td className="p-4">{formatDate(s.dateOfBirth)}</td>
                  <td className="p-4 text-sm">{s.parentName}</td>
                  <td className="p-4">{courseCount} corso/i</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                      {s.isActive ? 'Attivo' : 'Disattivo'}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2">
                    <button
                      onClick={() => { setEditing(s); setCreating(false); setForm({}); }}
                      className="text-primary-600 hover:underline text-sm"
                    >
                      Modifica
                    </button>
                    <button
                      onClick={() => setStudentActive(s.id, !s.isActive)}
                      className="text-slate-600 hover:underline text-sm"
                    >
                      {s.isActive ? 'Disattiva' : 'Attiva'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
