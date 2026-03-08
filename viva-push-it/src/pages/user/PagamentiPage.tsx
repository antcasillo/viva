import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/dateFormat';
import type { Payment } from '../../types/database';

const STATUS_LABELS: Record<Payment['status'], string> = {
  paid: 'Pagato',
  pending: 'In attesa',
  expired: 'Scaduto',
  cancelled: 'Annullato',
};

export function PagamentiPage() {
  const { user } = useAuth();
  const { students, payments, updatePaymentStatus } = useData();
  const [paying, setPaying] = useState<Payment | null>(null);
  const [simulating, setSimulating] = useState(false);

  const myStudents = students.filter((s) => s.userId === user?.id);
  const myPayments = payments
    .filter((p) => myStudents.some((s) => s.id === p.studentId))
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  const getStudentName = (id: string) => {
    const s = students.find((x) => x.id === id);
    return s ? `${s.firstName} ${s.lastName}` : id;
  };

  const handlePagaOra = (p: Payment) => {
    setPaying(p);
  };

  const simulateSumUpPayment = () => {
    if (!paying) return;
    setSimulating(true);
    setTimeout(() => {
      updatePaymentStatus(paying.id, 'paid', 'SUMUP-DEMO-' + Date.now());
      setPaying(null);
      setSimulating(false);
    }, 1500);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Pagamenti e Rette</h1>

      <div className="space-y-4">
        {myPayments.map((p) => (
          <div
            key={p.id}
            className={`bg-white rounded-xl p-6 shadow-sm border ${
              p.status === 'expired' ? 'border-red-200' : p.status === 'pending' ? 'border-amber-200' : 'border-slate-100'
            }`}
          >
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <h3 className="font-semibold text-slate-800">{p.description}</h3>
                <p className="text-slate-600 mt-1">{getStudentName(p.studentId)}</p>
                <p className="text-sm text-slate-500 mt-1">
                  Scadenza: {formatDate(p.dueDate)} • € {p.amount.toFixed(2)}
                </p>
                <span
                  className={`inline-block mt-2 px-2 py-1 rounded text-xs ${
                    p.status === 'paid' ? 'bg-green-100 text-green-700' :
                    p.status === 'expired' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}
                >
                  {STATUS_LABELS[p.status]}
                </span>
              </div>
              {(p.status === 'pending' || p.status === 'expired') && (
                <button
                  onClick={() => handlePagaOra(p)}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                >
                  Paga ora
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {paying && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="font-semibold text-slate-800 mb-2">Pagamento con SumUp</h3>
            <p className="text-slate-600 text-sm mb-4">
              {paying.description} • € {paying.amount.toFixed(2)}
            </p>
            <p className="text-sm text-slate-500 mb-4">
              In produzione verresti reindirizzato al checkout SumUp. Questa è una simulazione.
            </p>
            <div className="flex gap-2">
              <button
                onClick={simulateSumUpPayment}
                disabled={simulating}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {simulating ? 'Elaborazione...' : 'Simula pagamento'}
              </button>
              <button
                onClick={() => setPaying(null)}
                disabled={simulating}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
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
