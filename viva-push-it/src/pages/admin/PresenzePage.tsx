import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { formatDate } from '../../utils/dateFormat';

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

export function PresenzePage() {
  const { students, courses, enrollments, attendances, setAttendance } = useData();
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');

  const dayOfWeek = new Date(selectedDate).getDay();
  const relevantCourses = selectedCourse
    ? courses.filter((c) => c.id === selectedCourse)
    : courses.filter((c) => c.dayOfWeek === dayOfWeek);

  const getEnrolledStudents = (courseId: string) => {
    const ids = enrollments.filter((e) => e.courseId === courseId && e.isActive).map((e) => e.studentId);
    return students.filter((s) => ids.includes(s.id) && s.isActive);
  };

  const getAttendance = (courseId: string, studentId: string) => {
    return attendances.find(
      (a) => a.courseId === courseId && a.studentId === studentId && a.sessionDate === selectedDate
    );
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Registro Presenze Globale</h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Data</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Corso (opzionale)</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">Tutti i corsi del giorno</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-8">
        {relevantCourses.map((course) => {
          const enrolled = getEnrolledStudents(course.id);
          return (
            <div key={course.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b">
                <h2 className="font-semibold text-slate-800">{course.name}</h2>
                <p className="text-sm text-slate-500">
                  {DAY_NAMES[course.dayOfWeek]} {course.startTime} - {course.endTime} • {formatDate(selectedDate)}
                </p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left p-4">Allievo</th>
                    <th className="text-left p-4">Presenza</th>
                    <th className="text-left p-4">Assente</th>
                    <th className="text-left p-4">Preavvisato</th>
                    <th className="text-left p-4">Motivo (se preavvisato)</th>
                  </tr>
                </thead>
                <tbody>
                  {enrolled.map((student) => {
                    const att = getAttendance(course.id, student.id);
                    const status = att?.status ?? 'unknown';
                    const isPreavvisato = status === 'absent_preavvisato';
                    return (
                      <tr key={student.id} className={`border-t ${isPreavvisato ? 'bg-amber-50' : ''}`}>
                        <td className="p-4 font-medium">{student.firstName} {student.lastName}</td>
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={status === 'present'}
                            onChange={(e) =>
                              setAttendance(course.id, student.id, selectedDate, e.target.checked ? 'present' : 'unknown')
                            }
                            disabled={isPreavvisato}
                            className="rounded"
                          />
                        </td>
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={status === 'absent'}
                            onChange={(e) =>
                              setAttendance(course.id, student.id, selectedDate, e.target.checked ? 'absent' : 'unknown')
                            }
                            disabled={isPreavvisato}
                            className="rounded"
                          />
                        </td>
                        <td className="p-4">
                          <span className={isPreavvisato ? 'text-amber-700 font-medium' : ''}>
                            {isPreavvisato ? '✓ ' + (att?.absenceReason ?? '') : '-'}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-slate-500">{att?.absenceReason ?? '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
