import { useData } from '../../context/DataContext';
import { formatDate } from '../../utils/dateFormat';

export function AdminDashboard() {
  const { students, courses, payments, events } = useData();
  const pendingPayments = payments.filter((p) => p.status === 'pending' || p.status === 'expired');
  const upcomingEvents = [...events].sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()).slice(0, 2);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-8">Dashboard</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm">Allievi attivi</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{students.filter((s) => s.isActive).length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm">Corsi attivi</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{courses.filter((c) => c.isActive).length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm">Rette in attesa</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">
            {payments.filter((p) => p.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm">Rette scadute</p>
          <p className="text-3xl font-bold text-red-600 mt-1">
            {payments.filter((p) => p.status === 'expired').length}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-slate-800 mb-4">Rette da seguire</h2>
          <ul className="space-y-3">
            {pendingPayments.map((p) => (
              <li key={p.id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                <span className="text-slate-700">{p.description}</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    p.status === 'expired' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {p.status === 'expired' ? 'Scaduta' : 'In attesa'}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-slate-800 mb-4">Prossimi eventi</h2>
          <ul className="space-y-3">
            {upcomingEvents.map((e) => (
              <li key={e.id} className="py-2 border-b border-slate-100 last:border-0">
                <p className="font-medium text-slate-800">{e.title}</p>
                <p className="text-sm text-slate-500">{formatDate(e.eventDate)} {e.eventTime && `• ${e.eventTime}`}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
