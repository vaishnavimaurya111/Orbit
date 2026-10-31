import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerAPI } from '../../services/api';
import { ArrowLeft, Mail, Phone, MapPin, Building, FileText, CreditCard, Zap, Calendar } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const statusColors = { active: 'badge-success', paused: 'badge-warning', closed: 'badge-danger', draft: 'badge-gray', paid: 'badge-success', partially_paid: 'badge-warning', overdue: 'badge-danger', confirmed: 'badge-info' };

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    (async () => {
      try { const res = await customerAPI.getById(id); setCustomer(res.data); }
      catch { navigate('/customers'); }
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!customer) return null;

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'subscriptions', label: `Subscriptions (${customer.subscriptions?.length || 0})` },
    { key: 'invoices', label: `Invoices (${customer.invoices?.length || 0})` },
    { key: 'payments', label: `Payments (${customer.payments?.length || 0})` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/customers')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ArrowLeft size={20} /></button>
        <div className="flex-1">
          <h1 className="page-title">{customer.name}</h1>
          <p className="text-sm text-gray-500">{customer.company_name || 'Individual Customer'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card">
            <h3 className="font-bold text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3"><Mail size={16} className="text-gray-400" /><div><p className="text-xs text-gray-500">Email</p><p className="font-medium text-sm">{customer.email}</p></div></div>
              <div className="flex items-center gap-3"><Phone size={16} className="text-gray-400" /><div><p className="text-xs text-gray-500">Phone</p><p className="font-medium text-sm">{customer.phone || '—'}</p></div></div>
              <div className="flex items-center gap-3"><Building size={16} className="text-gray-400" /><div><p className="text-xs text-gray-500">Company</p><p className="font-medium text-sm">{customer.company_name || '—'}</p></div></div>
              <div className="flex items-center gap-3"><FileText size={16} className="text-gray-400" /><div><p className="text-xs text-gray-500">GST</p><p className="font-medium text-sm">{customer.gst_number || '—'}</p></div></div>
              <div className="col-span-2 flex items-start gap-3"><MapPin size={16} className="text-gray-400 mt-0.5" /><div><p className="text-xs text-gray-500">Address</p><p className="font-medium text-sm">{[customer.billing_address, customer.city, customer.state, customer.pincode].filter(Boolean).join(', ') || '—'}</p></div></div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="card bg-blue-50 border-blue-100"><div className="flex items-center gap-3"><Zap size={20} className="text-blue-600" /><div><p className="text-xs text-gray-500">Subscriptions</p><p className="text-xl font-bold">{customer.subscriptions?.length || 0}</p></div></div></div>
            <div className="card bg-amber-50 border-amber-100"><div className="flex items-center gap-3"><FileText size={20} className="text-amber-600" /><div><p className="text-xs text-gray-500">Invoices</p><p className="text-xl font-bold">{customer.invoices?.length || 0}</p></div></div></div>
            <div className="card bg-emerald-50 border-emerald-100"><div className="flex items-center gap-3"><CreditCard size={20} className="text-emerald-600" /><div><p className="text-xs text-gray-500">Payments</p><p className="text-xl font-bold">{customer.payments?.length || 0}</p></div></div></div>
          </div>
        </div>
      )}

      {tab === 'subscriptions' && (
        <div className="card">
          {customer.subscriptions?.length ? (
            <table className="w-full"><thead><tr className="border-b border-gray-100">
              <th className="table-header">ID</th><th className="table-header">Plan</th><th className="table-header">Frequency</th>
              <th className="table-header">Amount</th><th className="table-header">Status</th><th className="table-header">Next Billing</th>
            </tr></thead><tbody>
              {customer.subscriptions.map(s => (
                <tr key={s.id} className="hover:bg-gray-50/80 cursor-pointer" onClick={() => navigate(`/subscriptions/${s.id}`)}>
                  <td className="table-cell font-semibold text-blue-600">{s.subscription_number}</td>
                  <td className="table-cell">{s.plan_name || '—'}</td>
                  <td className="table-cell capitalize">{s.billing_frequency}</td>
                  <td className="table-cell font-semibold">{fmt(s.recurring_amount)}</td>
                  <td className="table-cell"><span className={statusColors[s.status] || 'badge-gray'}>{s.status}</span></td>
                  <td className="table-cell">{s.next_billing_date ? new Date(s.next_billing_date).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody></table>
          ) : <p className="text-center py-8 text-gray-400 text-sm">No subscriptions</p>}
        </div>
      )}

      {tab === 'invoices' && (
        <div className="card">
          {customer.invoices?.length ? (
            <table className="w-full"><thead><tr className="border-b border-gray-100">
              <th className="table-header">Invoice</th><th className="table-header">Total</th><th className="table-header">Paid</th>
              <th className="table-header">Balance</th><th className="table-header">Status</th><th className="table-header">Due Date</th>
            </tr></thead><tbody>
              {customer.invoices.map(i => (
                <tr key={i.id} className="hover:bg-gray-50/80 cursor-pointer" onClick={() => navigate(`/invoices/${i.id}`)}>
                  <td className="table-cell font-semibold text-blue-600">{i.invoice_number}</td>
                  <td className="table-cell font-semibold">{fmt(i.total)}</td>
                  <td className="table-cell text-emerald-600">{fmt(i.amount_paid)}</td>
                  <td className="table-cell text-red-600">{fmt(i.outstanding_balance)}</td>
                  <td className="table-cell"><span className={statusColors[i.status] || 'badge-gray'}>{i.status}</span></td>
                  <td className="table-cell">{i.due_date ? new Date(i.due_date).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody></table>
          ) : <p className="text-center py-8 text-gray-400 text-sm">No invoices</p>}
        </div>
      )}

      {tab === 'payments' && (
        <div className="card">
          {customer.payments?.length ? (
            <table className="w-full"><thead><tr className="border-b border-gray-100">
              <th className="table-header">Reference</th><th className="table-header">Invoice</th><th className="table-header">Amount</th>
              <th className="table-header">Method</th><th className="table-header">Date</th>
            </tr></thead><tbody>
              {customer.payments.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/80">
                  <td className="table-cell font-semibold">{p.payment_reference}</td>
                  <td className="table-cell text-blue-600">{p.invoice_number}</td>
                  <td className="table-cell font-semibold text-emerald-600">{fmt(p.amount)}</td>
                  <td className="table-cell capitalize">{p.payment_method?.replace('_', ' ')}</td>
                  <td className="table-cell">{new Date(p.payment_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody></table>
          ) : <p className="text-center py-8 text-gray-400 text-sm">No payments</p>}
        </div>
      )}
    </div>
  );
};

export default CustomerDetail;
