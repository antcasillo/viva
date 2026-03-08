import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { formatDate } from '../../utils/dateFormat';
import { AddressLink } from '../../components/AddressLink';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';

export function EventiPage() {
  const { events } = useData();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
  );

  const calendarEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.eventTime ? `${e.eventDate}T${e.eventTime}:00` : e.eventDate,
    allDay: !e.eventTime,
  }));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Prossimi Eventi</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-slate-100'}`}
          >
            Lista
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-lg ${viewMode === 'calendar' ? 'bg-primary-600 text-white' : 'bg-slate-100'}`}
          >
            Calendario
          </button>
        </div>
      </div>

      {viewMode === 'list' && (
        <ul className="space-y-4">
          {sortedEvents.map((e) => (
            <li key={e.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-semibold text-slate-800">{e.title}</h3>
              <p className="text-slate-600 mt-2">{e.description}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                <span>📅 {formatDate(e.eventDate)}</span>
                {e.eventTime && <span>🕐 {e.eventTime}</span>}
                {e.location && (
                  <AddressLink address={e.location} />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {viewMode === 'calendar' && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <FullCalendar
            plugins={[dayGridPlugin, listPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,listWeek' }}
            events={calendarEvents}
            locale="it"
            height="auto"
          />
        </div>
      )}
    </div>
  );
}
