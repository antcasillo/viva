import { useState } from 'react';
import { useData } from '../../context/DataContext';
import type { Course } from '../../types/database';

const GIORNI = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

export function CorsiPage() {
  const { courses, enrollments, addCourse, updateCourse, deleteCourse } = useData();
  const [editing, setEditing] = useState<Course | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Course>>({});

  const handleSave = async () => {
    if (editing) {
      await updateCourse(editing.id, form);
      setEditing(null);
      setForm({});
    } else if (creating && form.name && form.teacherName != null && form.dayOfWeek != null && form.startTime && form.endTime) {
      await addCourse({
        name: form.name,
        description: form.description,
        teacherName: form.teacherName,
        dayOfWeek: form.dayOfWeek,
        startTime: form.startTime,
        endTime: form.endTime,
        maxStudents: form.maxStudents ?? 10,
        room: form.room,
        isActive: form.isActive ?? true,
      });
      setCreating(false);
      setForm({});
    }
  };

  const handleDelete = async (c: Course) => {
    const count = enrollments.filter((e) => e.courseId === c.id && e.isActive).length;
    if (count > 0 && !confirm(`Il corso "${c.name}" ha ${count} iscritti attivi. Eliminare comunque?`)) return;
    await deleteCourse(c.id);
    if (editing?.id === c.id) {
      setEditing(null);
      setCreating(false);
      setForm({});
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Gestione Corsi</h1>
        <button
          onClick={() => { setCreating(true); setEditing(null); setForm({}); }}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          + Nuovo corso
        </button>
      </div>

      {(editing || creating) && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 mb-6">
          <h2 className="font-semibold text-slate-800 mb-4">{editing ? 'Modifica corso' : 'Nuovo corso'}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-600 mb-1">Nome *</label>
              <input
                value={form.name ?? editing?.name ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-600 mb-1">Descrizione</label>
              <textarea
                value={form.description ?? editing?.description ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Insegnante *</label>
              <input
                value={form.teacherName ?? editing?.teacherName ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, teacherName: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Giorno *</label>
              <select
                value={form.dayOfWeek ?? editing?.dayOfWeek ?? 1}
                onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: parseInt(e.target.value, 10) }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {GIORNI.map((g, i) => (
                  <option key={i} value={i}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Ora inizio *</label>
              <input
                type="time"
                value={form.startTime ?? editing?.startTime ?? '09:00'}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Ora fine *</label>
              <input
                type="time"
                value={form.endTime ?? editing?.endTime ?? '10:00'}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Max allievi</label>
              <input
                type="number"
                min={1}
                value={form.maxStudents ?? editing?.maxStudents ?? 10}
                onChange={(e) => setForm((f) => ({ ...f, maxStudents: parseInt(e.target.value, 10) || 10 }))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Aula</label>
              <input
                value={form.room ?? editing?.room ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive ?? editing?.isActive ?? true}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="isActive" className="text-sm text-slate-600">Corso attivo</label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              Salva
            </button>
            <button onClick={() => { setEditing(null); setCreating(false); setForm({}); }} className="px-4 py-2 border rounded-lg">
              Annulla
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-4">Nome</th>
              <th className="text-left p-4">Insegnante</th>
              <th className="text-left p-4">Giorno</th>
              <th className="text-left p-4">Orario</th>
              <th className="text-left p-4">Iscritti</th>
              <th className="text-left p-4">Stato</th>
              <th className="text-left p-4">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => {
              const count = enrollments.filter((e) => e.courseId === c.id && e.isActive).length;
              return (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="p-4 font-medium">{c.name}</td>
                  <td className="p-4">{c.teacherName}</td>
                  <td className="p-4">{GIORNI[c.dayOfWeek]}</td>
                  <td className="p-4">{c.startTime} - {c.endTime}</td>
                  <td className="p-4">{count} / {c.maxStudents}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                      {c.isActive ? 'Attivo' : 'Disattivo'}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2">
                    <button
                      onClick={() => { setEditing(c); setCreating(false); setForm({}); }}
                      className="text-primary-600 hover:underline text-sm"
                    >
                      Modifica
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Elimina
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
