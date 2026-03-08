import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

export function UserProfilePage() {
  const { user } = useAuth();
  const { students, courses, enrollments } = useData();
  const myStudents = students.filter((s) => s.userId === user?.id);
  const studentIds = myStudents.map((s) => s.id);

  const myEnrollments = enrollments.filter(
    (e) => e.isActive && studentIds.includes(e.studentId)
  );
  const courseIds = [...new Set(myEnrollments.map((e) => e.courseId))];
  const myCourses = courses.filter((c) => courseIds.includes(c.id));

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Profilo Personale</h1>

      {/* Foto profilo e recap */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 mb-8">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-3xl font-bold text-primary-700">
            {user?.fullName?.charAt(0) ?? 'U'}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">{user?.fullName}</h2>
            <p className="text-slate-600">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Corsi attivi */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h2 className="font-semibold text-slate-800 mb-4">Corsi attivi</h2>
        {myCourses.length === 0 ? (
          <p className="text-slate-500">Nessun corso attivo.</p>
        ) : (
          <ul className="space-y-4">
            {myCourses.map((c) => (
              <li key={c.id} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
                <div>
                  <p className="font-medium text-slate-800">{c.name}</p>
                  <p className="text-sm text-slate-500">
                    {dayNames[c.dayOfWeek]} {c.startTime} - {c.endTime} • {c.room}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Allievi collegati */}
      {myStudents.length > 0 && (
        <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-slate-800 mb-4">I tuoi allievi</h2>
          <div className="flex gap-4 flex-wrap">
            {myStudents.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-bold">
                  {s.firstName.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-slate-800">{s.firstName} {s.lastName}</p>
                  <p className="text-sm text-slate-500">
                    {myEnrollments.filter((e) => e.studentId === s.id).length} corso/i
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
