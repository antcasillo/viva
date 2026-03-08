import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { formatDate, parseDateToISO } from '../../utils/dateFormat';
import type { Student } from '../../types/database';

export function AllieviPage() {
  const { students, enrollments, addStudent, updateStudent, setStudentActive } = useData();
  const [editing, setEditing] = useState<Student | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Student>>({});

  const handleSave = () => {
    if (editing) {
      const updates = { ...form };
      if (updates.dateOfBirth && updates.dateOfBirth.includes('-')) {
        const parts = updates.dateOfBirth.split('-');
        if (parts[0]?.length <= 2 && parts[2]?.length === 4) {
          updates.dateOfBirth = parseDateToISO(updates.dateOfBirth);
        }
      }
      updateStudent(editing.id, updates);
      setEditing(null);
    } else if (creating && form.userId && form.firstName && form.lastName && form.dateOfBirth && form.parentName && form.parentPhone && form.parentEmail) {
      addStudent({
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

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Gestione Allievi</h1>
        <button
          onClick={() => { setCreating(true); setEditing(null); setForm({}); }}
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
              <div>
                <label className="block text-sm text-slate-600 mb-1">ID Genitore (user-1, user-2, ...) *</label>
                <input
                  value={form.userId ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-slate-600 mb-1">Nome genitore *</label>
              <input
                value={form.parentName ?? editing?.parentName ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, parentName: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
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
