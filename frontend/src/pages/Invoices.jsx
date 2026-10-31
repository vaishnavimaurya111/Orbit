import { useState, useEffect } from 'react';
import { invoiceAPI, customerAPI, paymentAPI } from '../../services/api';
import { Search, Receipt, Eye, CreditCard, X, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const statusColors = { draft: 'badge-gray', confirmed: 'badge-info', partially_paid: 'badge-warning', paid: 'badge-success', overdue: 'badge-danger', cancelled: 'badge-gray' };

const RecordPaymentModal = ({ open, invoice, onClose, onSave }) => {
  const [form, setForm] = useState({ amount: 0, payment_method: 'bank_transfer', payment_date: new Date().toISOString().split('T')[0], notes: '' });

  useEffect(() => {
    if (invoice) setForm(f => ({ ...f, amount: Number(invoice.outstanding_balance) || 0 }));
  }, [invoice]);

  if (!open || !invoice) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-bold">Record Payment</h2>
            <p className="text-sm text-gray-500">{invoice.invoice_number} · Outstanding: {fmt(invoice.outstanding_balance)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ invoice_id: invoice.id, ...form, amount: parseFloat(form.amount) }); }} className="p-6 space-y-4">
          <div>
            <label className="label">Amount (₹) *</label>
            <input className="input" type="number" min="0.01" step="0.01" max={invoice.outstanding_balance}
              value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
            <p className="text-xs text-gray-400 mt-1">Max: {fmt(invoice.outstanding_balance)}</p>
          </div>
          <div>
            <label className="label">Payment Method *</label>
            <select className="input" value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="cheque">Cheque</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Payment Date *</label>
            <input className="input" type="date" value={form.payment_date} onChange={e => setForm({ ...form, payment_date: e.target.value })} required />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Reference number, bank details, etc." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary"><CreditCard size={16} /> Record Payment</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [payModal, setPayModal] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const res = await invoiceAPI.list({ search: search || undefined, status: statusFilter || undefined });
      setInvoices(res.data.data || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, statusFilter]);

  const handlePayment = async (data) => {
    try {
      await paymentAPI.record(data);
      setPayModal(null);
      load();
      alert(`Payment recorded successfully!`);
    } catch (err) { alert(err.response?.data?.error || 'Payment failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="text-sm text-gray-500">{invoices.length} invoices</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="search-input" placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {['draft','confirmed','partially_paid','paid','overdue','cancelled'].map(s => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12">
            <Receipt size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No invoices found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100">
                <th className="table-header">Invoice</th>
                <th className="table-header">Customer</th>
                <th className="table-header">Subscription</th>
                <th className="table-header">Total</th>
                <th className="table-header">Paid</th>
                <th className="table-header">Balance</th>
                <th className="table-header">Due Date</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr></thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="table-cell">
                      <span className="font-semibold text-blue-600 cursor-pointer hover:underline" onClick={() => navigate(`/invoices/${inv.id}`)}>
                        {inv.invoice_number}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="font-medium text-sm">{inv.customer_name}</div>
                      {inv.company_name && <div className="text-xs text-gray-400">{inv.company_name}</div>}
                    </td>
                    <td className="table-cell text-gray-500 text-sm">{inv.subscription_number || '—'}</td>
                    <td className="table-cell font-semibold">{fmt(inv.total)}</td>
                    <td className="table-cell text-emerald-600 font-medium">{fmt(inv.amount_paid)}</td>
                    <td className="table-cell">
                      <span className={`font-semibold ${Number(inv.outstanding_balance) > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {fmt(inv.outstanding_balance)}
                      </span>
                    </td>
                    <td className="table-cell text-sm">
                      {inv.due_date ? (
                        <span className={new Date(inv.due_date) < new Date() && inv.status !== 'paid' ? 'text-red-600 font-medium' : 'text-gray-600'}>
                          {new Date(inv.due_date).toLocaleDateString('en-IN')}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="table-cell"><span className={statusColors[inv.status] || 'badge-gray'}>{inv.status?.replace('_', ' ')}</span></td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button onClick={() => navigate(`/invoices/${inv.id}`)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="View"><Eye size={15} /></button>
                        {['confirmed', 'partially_paid', 'overdue'].includes(inv.status) && (
                          <button onClick={() => setPayModal(inv)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Record Payment"><CreditCard size={15} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RecordPaymentModal open={!!payModal} invoice={payModal} onClose={() => setPayModal(null)} onSave={handlePayment} />
    </div>
  );
};

export default Invoices;
