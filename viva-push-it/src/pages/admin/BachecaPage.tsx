import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { formatDate } from '../../utils/dateFormat';
import { AddressLink } from '../../components/AddressLink';
import { parseDateToISO } from '../../utils/dateFormat';
import type { Event } from '../../types/database';

export function BachecaPage() {
  const { events, addEvent, updateEvent, deleteEvent } = useData();
  const [editing, setEditing] = useState<Event | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Event>>({});

  const handleSave = async () => {
    if (editing) {
      const updates = { ...form };
      if (updates.eventDate && updates.eventDate.includes('-')) {
        const parts = updates.eventDate.split('-');
        if (parts[0]?.length <= 2 && parts[2]?.length === 4) {
          updates.eventDate = parseDateToISO(updates.eventDate);
        }
      }
      await updateEvent(editing.id, updates);
      setEditing(null);
    } else if (creating && form.title && form.description && form.eventDate) {
      await addEvent({
        title: form.title,
        description: form.description,
        eventDate: parseDateToISO(form.eventDate),
        eventTime: form.eventTime || undefined,
        location: form.location,
        isPublic: form.isPublic ?? true,
      });
      setCreating(false);
      setForm({});
    }
  };

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Gestione Bacheca Eventi</h1>
        <button
          onClick={() => { setCreating(true); setEditing(null); setForm({}); }}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          + Nuovo evento
        </button>
      </div>

      {(editing || creating) && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 mb-6">
          <h2 className="font-semibold text-slate-800 mb-4">{editing ? 'Modifica evento' : 'Nuovo evento'}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-600 mb-1">Titolo *</label>
              <input
                value={form.title ?? editing?.title ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-600 mb-1">Descrizione *</label>
              <textarea
                value={form.description ?? editing?.description ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Data (dd-mm-yyyy) *</label>
              <input
                value={form.eventDate ?? (editing ? formatDate(editing.eventDate) : '')}
                onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))}
                placeholder="gg-mm-aaaa"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Ora</label>
              <input
                type="time"
                value={form.eventTime ?? editing?.eventTime ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, eventTime: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-600 mb-1">Luogo (cliccabile per Maps/Waze)</label>
              <input
                value={form.location ?? editing?.location ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="Via Roma 15, Milano"
                className="w-full px-3 py-2 border rounded-lg"
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

      <div className="space-y-4">
        {sortedEvents.map((e) => (
          <div key={e.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-slate-800">{e.title}</h3>
                <p className="text-slate-600 mt-2">{e.description}</p>
                <div className="mt-4 space-y-2 text-sm text-slate-500">
                  <div className="flex gap-4">
                    <span>📅 {formatDate(e.eventDate)}</span>
                    {e.eventTime && <span>🕐 {e.eventTime}</span>}
                  </div>
                  {e.location && (
                    <AddressLink address={e.location} />
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditing(e); setCreating(false); setForm({}); }}
                  className="text-primary-600 hover:underline text-sm"
                >
                  Modifica
                </button>
                <button
                  onClick={() => deleteEvent(e.id)}
                  className="text-red-600 hover:underline text-sm"
                >
                  Elimina
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
