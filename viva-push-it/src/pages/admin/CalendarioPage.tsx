import { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import { useData } from '../../context/DataContext';
import type { EventClickArg } from '@fullcalendar/core';

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
  const { courses, enrollments, students, attendances } = useData();

  const calendarEvents = useMemo(() => {
    const evs: { id: string; title: string; start: string; end: string; extendedProps: { courseId: string } }[] = [];
    courses.forEach((c) => {
      getNextOccurrences(c, 14).forEach((e, i) => {
        evs.push({
          ...e,
          id: `${c.id}-${i}`,
          extendedProps: { courseId: c.id },
        });
      });
    });
    return evs;
  }, [courses]);

  const handleEventClick = (info: EventClickArg) => {
    const courseId = info.event.extendedProps.courseId;
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
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Calendario Corsi</h1>
      <p className="text-slate-600 mb-4">Clicca su una lezione per vedere i dettagli e gli iscritti.</p>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,listWeek' }}
          events={calendarEvents}
          locale="it"
          eventClick={handleEventClick}
          height="auto"
        />
      </div>
    </div>
  );
}
