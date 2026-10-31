import { useState, useEffect } from 'react';
import { subscriptionAPI, invoiceAPI, paymentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Zap, Receipt, CreditCard, User, LogOut, TrendingUp, Bell } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const statusColors = { active: 'badge-success', paused: 'badge-warning', closed: 'badge-danger', confirmed: 'badge-info', draft: 'badge-gray' };
const invStatusColors = { paid: 'badge-success', partially_paid: 'badge-warning', overdue: 'badge-danger', confirmed: 'badge-info' };

const CustomerPortal = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    (async () => {
      try {
        const [subs, invs, pays] = await Promise.all([
          subscriptionAPI.list({ limit: 50 }),
          invoiceAPI.list({ limit: 50 }),
          paymentAPI.list({ limit: 50 }),
        ]);
        setSubscriptions(subs.data.data || []);
        setInvoices(invs.data.data || []);
        setPayments(pays.data.data || []);
      } catch { } finally { setLoading(false); }
    })();
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const totalOutstanding = invoices.filter(i => ['confirmed','partially_paid','overdue'].includes(i.status)).reduce((a, i) => a + Number(i.outstanding_balance), 0);
  const activeCount = subscriptions.filter(s => s.status === 'active').length;
  const overdueCount = invoices.filter(i => i.status === 'overdue').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Portal Header */}
      <header style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }} className="px-6 py-4 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-lg">S</span>
            </div>
            <div>
              <div className="text-white font-bold">SubscriptIQ</div>
              <div className="text-blue-300 text-xs">Customer Portal</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">{user?.name?.charAt(0)}</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-white text-sm font-medium">{user?.name}</div>
                <div className="text-blue-300 text-xs">{user?.email}</div>
              </div>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
          <h2 className="text-2xl font-bold mb-1">Welcome back, {user?.name?.split(' ')[0]}! 👋</h2>
          <p className="text-blue-200">Here's an overview of your subscriptions and invoices.</p>
          {overdueCount > 0 && (
            <div className="mt-3 flex items-center gap-2 bg-red-500/30 border border-red-400/40 rounded-lg p-3 text-sm">
              <Bell size={16} className="shrink-0" />
              <span>You have {overdueCount} overdue invoice{overdueCount > 1 ? 's' : ''}. Please settle them to avoid service interruption.</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="card text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3"><Zap size={22} className="text-blue-600" /></div>
            <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
            <p className="text-sm text-gray-500">Active Subscriptions</p>
          </div>
          <div className="card text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-3"><Receipt size={22} className="text-amber-600" /></div>
            <p className="text-2xl font-bold text-gray-900">{fmt(totalOutstanding)}</p>
            <p className="text-sm text-gray-500">Outstanding Balance</p>
          </div>
          <div className="card text-center col-span-2 sm:col-span-1">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3"><CreditCard size={22} className="text-emerald-600" /></div>
            <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
            <p className="text-sm text-gray-500">Total Payments</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {['overview','subscriptions','invoices','payments'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
        ) : (
          <>
            {tab === 'overview' && (
              <div className="space-y-4">
                {/* Recent Invoices needing attention */}
                <div className="card">
                  <h3 className="font-bold text-gray-900 mb-4">Invoices Requiring Attention</h3>
                  {invoices.filter(i => ['confirmed','partially_paid','overdue'].includes(i.status)).length ? (
                    <div className="space-y-3">
                      {invoices.filter(i => ['confirmed','partially_paid','overdue'].includes(i.status)).map(inv => (
                        <div key={inv.id} className={`flex items-center justify-between p-4 rounded-xl border ${inv.status === 'overdue' ? 'border-red-200 bg-red-50' : 'border-amber-100 bg-amber-50'}`}>
                          <div>
                            <p className="font-semibold text-gray-900">{inv.invoice_number}</p>
                            <p className="text-xs text-gray-500">Due: {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN') : '—'}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-gray-900">{fmt(inv.outstanding_balance)}</p>
                            <span className={invStatusColors[inv.status] || 'badge-gray'}>{inv.status?.replace('_', ' ')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="text-3xl mb-2">🎉</div>
                      <p className="text-emerald-600 font-semibold">All invoices are settled!</p>
                    </div>
                  )}
                </div>

                {/* Active Subscriptions */}
                <div className="card">
                  <h3 className="font-bold text-gray-900 mb-4">Active Subscriptions</h3>
                  {subscriptions.filter(s => s.status === 'active').length ? (
                    <div className="space-y-3">
                      {subscriptions.filter(s => s.status === 'active').map(sub => (
                        <div key={sub.id} className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl">
                          <div>
                            <p className="font-semibold text-gray-900">{sub.subscription_number}</p>
                            <p className="text-xs text-gray-500">{sub.plan_name || 'Custom'} · {sub.billing_frequency}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-blue-700">{fmt(sub.recurring_amount)}</p>
                            <p className="text-xs text-gray-500">Next: {sub.next_billing_date ? new Date(sub.next_billing_date).toLocaleDateString('en-IN') : '—'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-400 py-6 text-sm">No active subscriptions</p>
                  )}
                </div>
              </div>
            )}

            {tab === 'subscriptions' && (
              <div className="card">
                <h3 className="font-bold text-gray-900 mb-4">All Subscriptions</h3>
                {subscriptions.length ? (
                  <table className="w-full">
                    <thead><tr className="border-b border-gray-100">
                      <th className="table-header">Subscription</th><th className="table-header">Plan</th>
                      <th className="table-header">Amount</th><th className="table-header">Next Billing</th><th className="table-header">Status</th>
                    </tr></thead>
                    <tbody>
                      {subscriptions.map(s => (
                        <tr key={s.id} className="hover:bg-gray-50/80">
                          <td className="table-cell font-semibold">{s.subscription_number}</td>
                          <td className="table-cell text-gray-500">{s.plan_name || 'Custom'}</td>
                          <td className="table-cell font-semibold">{fmt(s.recurring_amount)}</td>
                          <td className="table-cell text-sm">{s.next_billing_date ? new Date(s.next_billing_date).toLocaleDateString('en-IN') : '—'}</td>
                          <td className="table-cell"><span className={statusColors[s.status] || 'badge-gray'}>{s.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p className="text-center py-8 text-gray-400 text-sm">No subscriptions found</p>}
              </div>
            )}

            {tab === 'invoices' && (
              <div className="card">
                <h3 className="font-bold text-gray-900 mb-4">All Invoices</h3>
                {invoices.length ? (
                  <table className="w-full">
                    <thead><tr className="border-b border-gray-100">
                      <th className="table-header">Invoice</th><th className="table-header">Total</th>
                      <th className="table-header">Paid</th><th className="table-header">Balance</th>
                      <th className="table-header">Due Date</th><th className="table-header">Status</th>
                    </tr></thead>
                    <tbody>
                      {invoices.map(inv => (
                        <tr key={inv.id} className={`hover:bg-gray-50/80 ${inv.status === 'overdue' ? 'bg-red-50/30' : ''}`}>
                          <td className="table-cell font-semibold text-blue-600">{inv.invoice_number}</td>
                          <td className="table-cell font-semibold">{fmt(inv.total)}</td>
                          <td className="table-cell text-emerald-600">{fmt(inv.amount_paid)}</td>
                          <td className="table-cell font-bold">{fmt(inv.outstanding_balance)}</td>
                          <td className="table-cell text-sm">{inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN') : '—'}</td>
                          <td className="table-cell"><span className={invStatusColors[inv.status] || 'badge-gray'}>{inv.status?.replace('_',' ')}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p className="text-center py-8 text-gray-400 text-sm">No invoices found</p>}
              </div>
            )}

            {tab === 'payments' && (
              <div className="card">
                <h3 className="font-bold text-gray-900 mb-4">Payment History</h3>
                {payments.length ? (
                  <table className="w-full">
                    <thead><tr className="border-b border-gray-100">
                      <th className="table-header">Reference</th><th className="table-header">Invoice</th>
                      <th className="table-header">Amount</th><th className="table-header">Method</th><th className="table-header">Date</th>
                    </tr></thead>
                    <tbody>
                      {payments.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50/80">
                          <td className="table-cell font-semibold">{p.payment_reference}</td>
                          <td className="table-cell text-blue-600">{p.invoice_number}</td>
                          <td className="table-cell font-bold text-emerald-600">{fmt(p.amount)}</td>
                          <td className="table-cell capitalize">{p.payment_method?.replace('_',' ')}</td>
                          <td className="table-cell text-sm">{new Date(p.payment_date).toLocaleDateString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p className="text-center py-8 text-gray-400 text-sm">No payments yet</p>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerPortal;
