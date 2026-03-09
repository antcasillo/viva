import { useState } from 'react';
import { useData } from '../../context/DataContext';
import type { Course, CourseSchedule } from '../../types/database';

const GIORNI = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

function defaultSchedule(): CourseSchedule {
  return { dayOfWeek: 1, startTime: '09:00', endTime: '10:00' };
}

export function CorsiPage() {
  const { courses, enrollments, addCourse, updateCourse, deleteCourse } = useData();
  const [editing, setEditing] = useState<Course | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Course> & { schedules?: CourseSchedule[] }>({});

  const formSchedules =
    form.schedules ??
    (editing?.schedules?.length
      ? editing.schedules
      : editing
        ? [{ dayOfWeek: editing.dayOfWeek, startTime: editing.startTime, endTime: editing.endTime }]
        : [defaultSchedule()]);

  const handleSave = async () => {
    if (editing) {
      await updateCourse(editing.id, { ...form, schedules: formSchedules });
      setEditing(null);
      setForm({});
    } else if (creating && form.name && form.teacherName != null && formSchedules.length > 0) {
      const valid = formSchedules.every((s) => s.startTime && s.endTime);
      if (!valid) return;
      await addCourse({
        name: form.name,
        description: form.description,
        teacherName: form.teacherName,
        schedules: formSchedules,
        dayOfWeek: formSchedules[0].dayOfWeek,
        startTime: formSchedules[0].startTime,
        endTime: formSchedules[0].endTime,
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
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-600 mb-2">Giorni e orari *</label>
              <div className="space-y-3">
                {formSchedules.map((sched, idx) => (
                  <div key={idx} className="flex flex-wrap gap-2 items-end p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1 min-w-[120px]">
                      <label className="block text-xs text-slate-500 mb-1">Giorno</label>
                      <select
                        value={sched.dayOfWeek}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            schedules: formSchedules.map((s, i) =>
                              i === idx ? { ...s, dayOfWeek: parseInt(e.target.value, 10) } : s
                            ),
                          }))
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        {GIORNI.map((g, i) => (
                          <option key={i} value={i}>{g}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="block text-xs text-slate-500 mb-1">Inizio</label>
                      <input
                        type="time"
                        value={sched.startTime}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            schedules: formSchedules.map((s, i) =>
                              i === idx ? { ...s, startTime: e.target.value } : s
                            ),
                          }))
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-xs text-slate-500 mb-1">Fine</label>
                      <input
                        type="time"
                        value={sched.endTime}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            schedules: formSchedules.map((s, i) =>
                              i === idx ? { ...s, endTime: e.target.value } : s
                            ),
                          }))
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          schedules: formSchedules.filter((_, i) => i !== idx),
                        }))
                      }
                      disabled={formSchedules.length <= 1}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Rimuovi
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      schedules: [...formSchedules, defaultSchedule()],
                    }))
                  }
                  className="text-sm text-primary-600 hover:underline"
                >
                  + Aggiungi altro orario
                </button>
              </div>
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
              <th className="text-left p-4">Giorni e orari</th>
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
                  <td className="p-4">
                    {(c.schedules?.length ? c.schedules : [{ dayOfWeek: c.dayOfWeek, startTime: c.startTime, endTime: c.endTime }]).map(
                      (s, i) => (
                        <span key={i} className="block text-sm">
                          {GIORNI[s.dayOfWeek]} {s.startTime}-{s.endTime}
                        </span>
                      )
                    )}
                  </td>
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
