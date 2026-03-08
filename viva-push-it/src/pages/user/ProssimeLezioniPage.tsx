import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/dateFormat';

const DAY_NAMES = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

export function ProssimeLezioniPage() {
  const { user } = useAuth();
  const { students, courses, enrollments, attendances, setAttendance } = useData();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [absenceModal, setAbsenceModal] = useState<{
    courseId: string;
    studentId: string;
    sessionDate: string;
    studentName: string;
    courseName: string;
  } | null>(null);
  const [absenceReason, setAbsenceReason] = useState('');

  const myStudents = students.filter((s) => s.userId === user?.id);
  const myEnrollments = enrollments.filter((e) => e.isActive && myStudents.some((s) => s.id === e.studentId));

  const today = new Date();
  const nextLessons: { course: typeof courses[0]; student: typeof students[0]; date: Date }[] = [];

  for (let i = 0; i < 21; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dayOfWeek = d.getDay();
    myEnrollments.forEach((enr) => {
      const course = courses.find((c) => c.id === enr.courseId);
      const student = students.find((s) => s.id === enr.studentId);
      if (course && student && course.dayOfWeek === dayOfWeek) {
        nextLessons.push({ course, student, date: new Date(d) });
      }
    });
  }

  nextLessons.sort((a, b) => a.date.getTime() - b.date.getTime());

  const handleSegnalaAssenza = async () => {
    if (!absenceModal) return;
    await setAttendance(
      absenceModal.courseId,
      absenceModal.studentId,
      absenceModal.sessionDate,
      'absent_preavvisato',
      absenceReason
    );
    setAbsenceModal(null);
    setAbsenceReason('');
  };

  const getAttendance = (courseId: string, studentId: string, sessionDate: string) => {
    return attendances.find(
      (a) => a.courseId === courseId && a.studentId === studentId && a.sessionDate === sessionDate
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Prossime Lezioni</h1>
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
        <div className="space-y-4">
          {nextLessons.slice(0, 15).map(({ course, student, date }) => {
            const sessionDate = date.toISOString().split('T')[0];
            const att = getAttendance(course.id, student.id, sessionDate);
            const isPreavvisato = att?.status === 'absent_preavvisato';
            return (
              <div
                key={`${course.id}-${student.id}-${sessionDate}`}
                className={`bg-white rounded-xl p-6 shadow-sm border ${isPreavvisato ? 'border-amber-200 bg-amber-50/50' : 'border-slate-100'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-800">{course.name}</h3>
                    <p className="text-slate-600 mt-1">
                      {DAY_NAMES[date.getDay()]} {formatDate(date)} • {course.startTime} - {course.endTime}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {student.firstName} {student.lastName}
                    </p>
                    {course.room && <p className="text-sm text-slate-500">Aula: {course.room}</p>}
                    {isPreavvisato && (
                      <p className="mt-2 text-amber-700 text-sm font-medium">
                        ✓ Assenza preavvisata: {att?.absenceReason}
                      </p>
                    )}
                  </div>
                  {!isPreavvisato && date >= today && (
                    <button
                      onClick={() =>
                        setAbsenceModal({
                          courseId: course.id,
                          studentId: student.id,
                          sessionDate,
                          studentName: `${student.firstName} ${student.lastName}`,
                          courseName: course.name,
                        })
                      }
                      className="px-4 py-2 border border-amber-500 text-amber-700 rounded-lg hover:bg-amber-50 text-sm"
                    >
                      Segnala assenza
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'calendar' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <p className="text-slate-600 mb-4">Vista calendario per le prossime lezioni.</p>
          <div className="grid grid-cols-7 gap-2">
            {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map((d) => (
              <div key={d} className="text-center text-sm font-medium text-slate-500 py-2">
                {d}
              </div>
            ))}
            {(() => {
              const first = new Date(nextLessons[0]?.date ?? today);
              const start = new Date(first);
              start.setDate(start.getDate() - start.getDay());
              const cells: React.ReactNode[] = [];
              for (let i = 0; i < 35; i++) {
                const d = new Date(start);
                d.setDate(d.getDate() + i);
                const dayLessons = nextLessons.filter(
                  (l) =>
                    l.date.getDate() === d.getDate() &&
                    l.date.getMonth() === d.getMonth() &&
                    l.date.getFullYear() === d.getFullYear()
                );
                cells.push(
                  <div
                    key={i}
                    className={`min-h-20 p-2 border rounded-lg ${
                      d.toDateString() === today.toDateString() ? 'bg-primary-50 border-primary-200' : 'bg-slate-50'
                    }`}
                  >
                    <span className="text-sm font-medium">{d.getDate()}</span>
                    {dayLessons.map((l) => (
                      <div key={`${l.course.id}-${l.student.id}`} className="mt-1 text-xs text-slate-600 truncate">
                        {l.course.name} • {l.student.firstName}
                      </div>
                    ))}
                  </div>
                );
              }
              return cells;
            })()}
          </div>
        </div>
      )}

      {absenceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="font-semibold text-slate-800 mb-2">Segnala assenza</h3>
            <p className="text-slate-600 text-sm mb-4">
              {absenceModal.courseName} • {absenceModal.studentName} • {formatDate(absenceModal.sessionDate)}
            </p>
            <label className="block text-sm text-slate-600 mb-2">Motivo (opzionale)</label>
            <input
              value={absenceReason}
              onChange={(e) => setAbsenceReason(e.target.value)}
              placeholder="Es. influenza, gita scolastica..."
              className="w-full px-3 py-2 border rounded-lg mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSegnalaAssenza}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                Conferma
              </button>
              <button
                onClick={() => { setAbsenceModal(null); setAbsenceReason(''); }}
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
