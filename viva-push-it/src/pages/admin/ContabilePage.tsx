import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { formatDate, parseDateToISO } from '../../utils/dateFormat';
import type { Payment, PaymentStatus } from '../../types/database';

const STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: 'Pagato',
  pending: 'In attesa',
  expired: 'Scaduto',
  cancelled: 'Annullato',
};

export function ContabilePage() {
  const { students, payments, addPayment, updatePayment, deletePayment, updatePaymentStatus } = useData();
  const [filter, setFilter] = useState<PaymentStatus | 'all'>('all');
  const [editing, setEditing] = useState<Payment | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Payment>>({});

  const filtered = filter === 'all'
    ? payments
    : payments.filter((p) => p.status === filter);

  const getStudentName = (id: string) => {
    const s = students.find((x) => x.id === id);
    return s ? `${s.firstName} ${s.lastName}` : id;
  };

  const handleSave = async () => {
    if (editing) {
      const updates = { ...form };
      if (updates.dueDate && updates.dueDate.includes('-') && updates.dueDate.length <= 10) {
        const parts = updates.dueDate.split('-');
        if (parts[0]?.length <= 2 && parts[2]?.length === 4) {
          updates.dueDate = parseDateToISO(updates.dueDate);
        }
      }
      await updatePayment(editing.id, updates);
      setEditing(null);
      setForm({});
    } else if (creating && form.studentId && form.amount != null && form.description && form.dueDate) {
      await addPayment({
        studentId: form.studentId,
        amount: Number(form.amount),
        description: form.description,
        dueDate: parseDateToISO(form.dueDate),
        status: form.status ?? 'pending',
      });
      setCreating(false);
      setForm({});
    }
  };

  const handleDelete = async (p: Payment) => {
    if (!confirm(`Eliminare il pagamento "${p.description}" di € ${p.amount.toFixed(2)}?`)) return;
    await deletePayment(p.id);
    if (editing?.id === p.id) {
      setEditing(null);
      setForm({});
    }
  };

  const handleSetStatus = async (p: Payment, status: PaymentStatus, reference?: string) => {
    await updatePaymentStatus(p.id, status, reference);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Situazione Contabile</h1>
        <button
          onClick={() => { setCreating(true); setEditing(null); setForm({}); }}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          + Nuovo pagamento
        </button>
      </div>

      {(editing || creating) && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 mb-6">
          <h2 className="font-semibold text-slate-800 mb-4">{editing ? 'Modifica pagamento' : 'Nuovo pagamento'}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-600 mb-1">Allievo *</label>
              <select
                value={form.studentId ?? editing?.studentId ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
                disabled={!!editing}
              >
                <option value="">Seleziona allievo</option>
                {students.filter((s) => s.isActive).map((s) => (
                  <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Importo (€) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.amount ?? editing?.amount ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value ? parseFloat(e.target.value) : undefined }))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Scadenza (gg-mm-aaaa) *</label>
              <input
                value={form.dueDate ?? (editing ? formatDate(editing.dueDate) : '')}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                placeholder="gg-mm-aaaa"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-600 mb-1">Descrizione *</label>
              <input
                value={form.description ?? editing?.description ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Es. Retta mensile Marzo 2024"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            {creating && (
              <div>
                <label className="block text-sm text-slate-600 mb-1">Stato iniziale</label>
                <select
                  value={form.status ?? 'pending'}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as PaymentStatus }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="pending">In attesa</option>
                  <option value="paid">Pagato</option>
                  <option value="expired">Scaduto</option>
                  <option value="cancelled">Annullato</option>
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              Salva
            </button>
            <button onClick={() => { setEditing(null); setCreating(false); setForm({}); }} className="px-4 py-2 border rounded-lg">
              Annulla
            </button>
          </div>
        </div>
      )}

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
              <th className="text-left p-4">Azioni</th>
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
                      p.status === 'cancelled' ? 'bg-slate-100 text-slate-600' :
                      'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {STATUS_LABELS[p.status]}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2 flex-wrap">
                    {p.status !== 'paid' && (
                      <button
                        onClick={() => handleSetStatus(p, 'paid')}
                        className="text-green-600 hover:underline text-sm"
                      >
                        Segna pagato
                      </button>
                    )}
                    <button
                      onClick={() => { setEditing(p); setCreating(false); setForm({}); }}
                      className="text-primary-600 hover:underline text-sm"
                    >
                      Modifica
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Elimina
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
