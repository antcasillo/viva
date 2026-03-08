import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { formatDate } from '../../utils/dateFormat';
import type { PaymentStatus } from '../../types/database';

const STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: 'Pagato',
  pending: 'In attesa',
  expired: 'Scaduto',
  cancelled: 'Annullato',
};

export function ContabilePage() {
  const { students, payments } = useData();
  const [filter, setFilter] = useState<PaymentStatus | 'all'>('all');

  const filtered = filter === 'all'
    ? payments
    : payments.filter((p) => p.status === filter);

  const getStudentName = (id: string) => {
    const s = students.find((x) => x.id === id);
    return s ? `${s.firstName} ${s.lastName}` : id;
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Situazione Contabile</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-slate-100'}`}
        >
          Tutte
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg ${filter === 'pending' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700'}`}
        >
          In attesa
        </button>
        <button
          onClick={() => setFilter('expired')}
          className={`px-4 py-2 rounded-lg ${filter === 'expired' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700'}`}
        >
          Scadute
        </button>
        <button
          onClick={() => setFilter('paid')}
          className={`px-4 py-2 rounded-lg ${filter === 'paid' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700'}`}
        >
          Pagate
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-4">Allievo</th>
              <th className="text-left p-4">Descrizione</th>
              <th className="text-left p-4">Importo</th>
              <th className="text-left p-4">Scadenza</th>
              <th className="text-left p-4">Stato</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="p-4 font-medium">{getStudentName(p.studentId)}</td>
                <td className="p-4">{p.description}</td>
                <td className="p-4">€ {p.amount.toFixed(2)}</td>
                <td className="p-4">{formatDate(p.dueDate)}</td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      p.status === 'paid' ? 'bg-green-100 text-green-700' :
                      p.status === 'expired' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {STATUS_LABELS[p.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
