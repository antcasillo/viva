import { useState, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction';
import { useData } from '../../context/DataContext';
import { parseDateToISO } from '../../utils/dateFormat';
import type { EventClickArg } from '@fullcalendar/core';
import type { Event } from '../../types/database';

function getNextOccurrences(course: { id: string; dayOfWeek: number; startTime: string; endTime: string; name: string }, count: number) {
  const events: { title: string; start: string; end: string; extendedProps: { courseId: string } }[] = [];
  const today = new Date();
  let found = 0;
  for (let i = 0; i < 60 && found < count; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    if (d.getDay() === course.dayOfWeek) {
      const dateStr = d.toISOString().split('T')[0];
      events.push({
        title: course.name,
        start: `${dateStr}T${course.startTime}:00`,
        end: `${dateStr}T${course.endTime}:00`,
        extendedProps: { courseId: course.id },
      });
      found++;
    }
  }
  return events;
}

export function CalendarioPage() {
  const { courses, enrollments, students, attendances, events, addEvent, updateEvent, deleteEvent } = useData();
  const [modalEvent, setModalEvent] = useState<Event | null>(null);
  const [modalNew, setModalNew] = useState<{ date: string; time?: string } | null>(null);
  const [form, setForm] = useState<Partial<Event>>({});

  const calendarEvents = useMemo(() => {
    const evs: { id: string; title: string; start: string; end: string; extendedProps: { courseId?: string; eventId?: string } }[] = [];
    courses.forEach((c) => {
      getNextOccurrences(c, 14).forEach((e, i) => {
        evs.push({
          ...e,
          id: `course-${c.id}-${i}`,
          extendedProps: { courseId: c.id },
        });
      });
    });
    events.forEach((e) => {
      const start = e.eventTime ? `${e.eventDate}T${e.eventTime}:00` : `${e.eventDate}T09:00:00`;
      const end = e.eventTime ? `${e.eventDate}T${e.eventTime}:00` : `${e.eventDate}T10:00:00`;
      evs.push({
        id: `event-${e.id}`,
        title: e.title,
        start,
        end,
        extendedProps: { eventId: e.id },
      });
    });
    return evs;
  }, [courses, events]);

  const handleEventClick = (info: EventClickArg) => {
    const { courseId, eventId } = info.event.extendedProps;
    if (eventId) {
      const ev = events.find((e) => e.id === eventId);
      if (ev) {
        setModalEvent(ev);
        setModalNew(null);
        setForm({});
      }
    } else if (courseId) {
      const course = courses.find((c) => c.id === courseId);
      const sessionDate = info.event.start?.toISOString().split('T')[0];
      if (!course || !sessionDate) return;
      const enrolled = enrollments.filter((e) => e.courseId === courseId && e.isActive).map((e) => e.studentId);
      const sessionAttendances = attendances.filter(
        (a) => a.courseId === courseId && a.sessionDate === sessionDate
      );
      const lines = enrolled.map((sid) => {
        const s = students.find((x) => x.id === sid);
        const a = sessionAttendances.find((x) => x.studentId === sid);
        return `${s?.firstName ?? ''} ${s?.lastName ?? ''}: ${a?.status === 'present' ? '✓ Presente' : a?.status === 'absent_preavvisato' ? '⚠ Preavvisato' : a?.status === 'absent' ? '✗ Assente' : '?'}`;
      });
      alert(`📅 ${course.name}\n${sessionDate}\n\nIscritti:\n${lines.join('\n')}\n\n(Vai al Registro Presenze per modificare)`);
    }
  };

  const handleDateClick = (arg: DateClickArg) => {
    const dateStr = arg.dateStr;
    setModalNew({ date: dateStr, time: arg.allDay ? undefined : arg.date.toTimeString().slice(0, 5) });
    setModalEvent(null);
    setForm({ eventDate: dateStr, eventTime: arg.allDay ? undefined : arg.date.toTimeString().slice(0, 5) });
  };

  const handleSaveEvent = async () => {
    if (modalEvent) {
      const updates = { ...form };
      if (updates.eventDate && updates.eventDate.includes('-') && updates.eventDate.length <= 10) {
        const parts = updates.eventDate.split('-');
        if (parts[0]?.length <= 2 && parts[2]?.length === 4) {
          updates.eventDate = parseDateToISO(updates.eventDate);
        }
      }
      await updateEvent(modalEvent.id, updates);
      setModalEvent(null);
      setForm({});
    } else if (modalNew && form.title && form.description && form.eventDate) {
      await addEvent({
        title: form.title,
        description: form.description,
        eventDate: parseDateToISO(form.eventDate),
        eventTime: form.eventTime || undefined,
        location: form.location,
        isPublic: form.isPublic ?? true,
      });
      setModalNew(null);
      setForm({});
    }
  };

  const handleDeleteEvent = async () => {
    if (modalEvent) {
      await deleteEvent(modalEvent.id);
      setModalEvent(null);
      setForm({});
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Calendario Corsi e Eventi</h1>
      <p className="text-slate-600 mb-4">Clicca su una data vuota per aggiungere un evento. Clicca su un evento per modificarlo.</p>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,listWeek' }}
          events={calendarEvents}
          locale="it"
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          height="auto"
          selectable
        />
      </div>

      {(modalEvent || modalNew) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 shadow-xl max-w-md w-full">
            <h2 className="font-semibold text-slate-800 mb-4">{modalEvent ? 'Modifica evento' : 'Nuovo evento'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Titolo *</label>
                <input
                  value={form.title ?? modalEvent?.title ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Descrizione *</label>
                <textarea
                  value={form.description ?? modalEvent?.description ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Data *</label>
                  <input
                    type="date"
                    value={form.eventDate ?? modalEvent?.eventDate ?? modalNew?.date ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Ora</label>
                  <input
                    type="time"
                    value={form.eventTime ?? modalEvent?.eventTime ?? modalNew?.time ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, eventTime: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Luogo</label>
                <input
                  value={form.location ?? modalEvent?.location ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={handleSaveEvent} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Salva
              </button>
              {modalEvent && (
                <button onClick={handleDeleteEvent} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  Elimina
                </button>
              )}
              <button
                onClick={() => { setModalEvent(null); setModalNew(null); setForm({}); }}
                className="px-4 py-2 border rounded-lg"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
