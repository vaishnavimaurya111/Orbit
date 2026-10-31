import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subscriptionAPI } from '../../services/api';
import { ArrowLeft, Play, Pause, StopCircle, RefreshCw, CheckCircle, Calendar, Package, Receipt, Clock } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const statusColors = { draft: 'badge-gray', quotation: 'badge-purple', confirmed: 'badge-info', active: 'badge-success', paused: 'badge-warning', closed: 'badge-danger' };
const invStatusColors = { draft: 'badge-gray', confirmed: 'badge-info', partially_paid: 'badge-warning', paid: 'badge-success', overdue: 'badge-danger', cancelled: 'badge-gray' };

const SubscriptionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('details');
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const res = await subscriptionAPI.getById(id); setSub(res.data); }
    catch { navigate('/subscriptions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const doAction = async (action) => {
    if (action === 'close' && !window.confirm('Are you sure you want to close this subscription?')) return;
    setActionLoading(true);
    try { await subscriptionAPI.transition(id, action); await load(); }
    catch (err) { alert(err.response?.data?.error || 'Action failed'); }
    finally { setActionLoading(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!sub) return null;

  const actions = [];
  if (sub.status === 'draft') actions.push({ label: 'Confirm', action: 'confirm', icon: CheckCircle, color: 'bg-indigo-600 hover:bg-indigo-700' });
  if (sub.status === 'confirmed') actions.push({ label: 'Activate', action: 'activate', icon: Play, color: 'bg-emerald-600 hover:bg-emerald-700' });
  if (sub.status === 'active') actions.push({ label: 'Pause', action: 'pause', icon: Pause, color: 'bg-amber-500 hover:bg-amber-600' });
  if (sub.status === 'paused') actions.push({ label: 'Resume', action: 'resume', icon: Play, color: 'bg-emerald-600 hover:bg-emerald-700' });
  if (!['closed'].includes(sub.status)) actions.push({ label: 'Close', action: 'close', icon: StopCircle, color: 'bg-red-600 hover:bg-red-700' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate('/subscriptions')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ArrowLeft size={20} /></button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="page-title">{sub.subscription_number}</h1>
            <span className={statusColors[sub.status] || 'badge-gray'}>{sub.status}</span>
          </div>
          <p className="text-sm text-gray-500">{sub.customer_name} {sub.company_name ? `· ${sub.company_name}` : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          {actions.map(a => (
            <button key={a.action} onClick={() => doAction(a.action)} disabled={actionLoading}
              className={`${a.color} text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors`}>
              <a.icon size={15} /> {a.label}
            </button>
          ))}
          <button onClick={load} className="btn-secondary"><RefreshCw size={15} /></button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: 'details', label: 'Details' },
          { key: 'invoices', label: `Invoices (${sub.invoices?.length || 0})` },
          { key: 'activity', label: 'Activity' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4">Subscription Details</h3>
              <div className="grid grid-cols-2 gap-5">
                <div><p className="text-xs text-gray-500">Customer</p><p className="font-semibold">{sub.customer_name}</p></div>
                <div><p className="text-xs text-gray-500">Email</p><p className="font-medium text-sm">{sub.customer_email}</p></div>
                <div><p className="text-xs text-gray-500">Plan</p><p className="font-semibold">{sub.plan_name || 'Custom'}</p></div>
                <div><p className="text-xs text-gray-500">Billing Frequency</p><p className="font-semibold capitalize">{sub.billing_frequency}</p></div>
                <div><p className="text-xs text-gray-500">Start Date</p><p className="font-semibold">{new Date(sub.start_date).toLocaleDateString('en-IN')}</p></div>
                <div><p className="text-xs text-gray-500">End Date</p><p className="font-semibold">{sub.end_date ? new Date(sub.end_date).toLocaleDateString('en-IN') : 'Ongoing'}</p></div>
                <div><p className="text-xs text-gray-500">Recurring Amount</p><p className="font-bold text-xl text-blue-700">{fmt(sub.recurring_amount)}</p></div>
                <div><p className="text-xs text-gray-500">Payment Terms</p><p className="font-semibold">{sub.payment_terms} days</p></div>
                {sub.tax_name && <div><p className="text-xs text-gray-500">Tax</p><p className="font-semibold">{sub.tax_name} ({sub.tax_rate}%)</p></div>}
                {sub.notes && <div className="col-span-2"><p className="text-xs text-gray-500">Notes</p><p className="text-sm text-gray-700">{sub.notes}</p></div>}
              </div>
            </div>

            {/* Products */}
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Package size={17} className="text-blue-600" /> Products</h3>
              {sub.items?.length ? (
                <table className="w-full">
                  <thead><tr className="border-b border-gray-100">
                    <th className="table-header">Product</th>
                    <th className="table-header text-right">Qty</th>
                    <th className="table-header text-right">Unit Price</th>
                    <th className="table-header text-right">Total</th>
                  </tr></thead>
                  <tbody>
                    {sub.items.map(item => (
                      <tr key={item.id} className="border-b border-gray-50 last:border-0">
                        <td className="py-3">
                          <div className="font-medium text-sm">{item.product_name}</div>
                          {item.variant_name && <div className="text-xs text-gray-400">{item.variant_name}</div>}
                        </td>
                        <td className="py-3 text-right text-sm">{item.quantity}</td>
                        <td className="py-3 text-right text-sm">{fmt(item.unit_price)}</td>
                        <td className="py-3 text-right font-semibold text-sm">{fmt(item.total_price)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-gray-200">
                      <td colSpan="3" className="py-3 text-right font-bold text-gray-900">Total</td>
                      <td className="py-3 text-right font-bold text-lg text-blue-700">{fmt(sub.recurring_amount)}</td>
                    </tr>
                  </tbody>
                </table>
              ) : <p className="text-gray-400 text-sm">No items</p>}
            </div>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-4">
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4">Billing Info</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Calendar size={18} className="text-blue-600" />
                  <div><p className="text-xs text-gray-500">Next Billing</p><p className="font-bold text-sm">{sub.next_billing_date ? new Date(sub.next_billing_date).toLocaleDateString('en-IN') : '—'}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Clock size={18} className="text-gray-500" />
                  <div><p className="text-xs text-gray-500">Last Billed</p><p className="font-bold text-sm">{sub.last_billing_date ? new Date(sub.last_billing_date).toLocaleDateString('en-IN') : '—'}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                  <Receipt size={18} className="text-emerald-600" />
                  <div><p className="text-xs text-gray-500">Total Invoices</p><p className="font-bold text-sm">{sub.invoices?.length || 0}</p></div>
                </div>
              </div>
            </div>
            <div className="card bg-gradient-to-br from-blue-600 to-blue-700 text-white">
              <p className="text-blue-200 text-xs font-medium">Recurring Amount</p>
              <p className="text-3xl font-bold mt-1">{fmt(sub.recurring_amount)}</p>
              <p className="text-blue-200 text-xs mt-1 capitalize">per {sub.billing_frequency}</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'invoices' && (
        <div className="card">
          {sub.invoices?.length ? (
            <table className="w-full">
              <thead><tr className="border-b border-gray-100">
                <th className="table-header">Invoice #</th>
                <th className="table-header">Period</th>
                <th className="table-header">Total</th>
                <th className="table-header">Paid</th>
                <th className="table-header">Balance</th>
                <th className="table-header">Status</th>
                <th className="table-header">Due Date</th>
              </tr></thead>
              <tbody>
                {sub.invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50/80 cursor-pointer" onClick={() => navigate(`/invoices/${inv.id}`)}>
                    <td className="table-cell font-semibold text-blue-600">{inv.invoice_number}</td>
                    <td className="table-cell text-xs text-gray-500">
                      {inv.billing_period_start ? `${new Date(inv.billing_period_start).toLocaleDateString('en-IN')} – ${new Date(inv.billing_period_end).toLocaleDateString('en-IN')}` : '—'}
                    </td>
                    <td className="table-cell font-semibold">{fmt(inv.total)}</td>
                    <td className="table-cell text-emerald-600">{fmt(inv.amount_paid)}</td>
                    <td className="table-cell text-red-600">{fmt(inv.outstanding_balance)}</td>
                    <td className="table-cell"><span className={invStatusColors[inv.status] || 'badge-gray'}>{inv.status?.replace('_', ' ')}</span></td>
                    <td className="table-cell">{inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-gray-400 text-sm">No invoices yet. Activate subscription and run billing cycle.</div>
          )}
        </div>
      )}

      {tab === 'activity' && (
        <div className="card">
          {sub.activity?.length ? (
            <div className="space-y-3">
              {sub.activity.map(log => (
                <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-blue-700 text-xs font-bold">{log.user_name?.charAt(0) || '?'}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{log.action}</p>
                    <p className="text-xs text-gray-500">{log.user_name || 'System'} · {new Date(log.created_at).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 text-sm">No activity logged yet.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubscriptionDetail;
