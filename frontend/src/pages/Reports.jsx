import { useState, useEffect } from 'react';
import { analyticsAPI } from '../../services/api';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from 'recharts';
import { Download, TrendingUp, Users, AlertTriangle, Receipt } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

const Reports = () => {
  const [tab, setTab] = useState('revenue');
  const [revenueData, setRevenueData] = useState([]);
  const [subData, setSubData] = useState([]);
  const [growthData, setGrowthData] = useState([]);
  const [outstandingData, setOutstandingData] = useState([]);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [rev, sub, growth, outstanding] = await Promise.all([
        analyticsAPI.revenueReport(dateRange),
        analyticsAPI.subscriptionReport(dateRange),
        analyticsAPI.customerGrowth(),
        analyticsAPI.outstanding(),
      ]);
      setRevenueData(rev.data || []);
      setSubData(sub.data || []);
      setGrowthData(growth.data || []);
      setOutstandingData(outstanding.data || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, [dateRange]);

  const exportCSV = (data, filename) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(row => keys.map(k => `"${row[k] || ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${filename}.csv`; a.click();
  };

  const totalOutstanding = outstandingData.reduce((a, i) => a + Number(i.outstanding_balance), 0);
  const overdue = outstandingData.filter(i => i.days_overdue > 0);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="text-sm text-gray-500">Business intelligence and data exports</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" className="input w-auto text-sm" value={dateRange.from} onChange={e => setDateRange({ ...dateRange, from: e.target.value })} />
          <span className="text-gray-400 text-sm">to</span>
          <input type="date" className="input w-auto text-sm" value={dateRange.to} onChange={e => setDateRange({ ...dateRange, to: e.target.value })} />
        </div>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {[
          { key: 'revenue', label: '💰 Revenue', icon: TrendingUp },
          { key: 'subscriptions', label: '⚡ Subscriptions', icon: Receipt },
          { key: 'growth', label: '📈 Customer Growth', icon: Users },
          { key: 'outstanding', label: '⚠️ Outstanding', icon: AlertTriangle },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>}

      {/* Revenue Report */}
      {!loading && tab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="card"><p className="text-xs text-gray-500">Total Revenue</p><p className="text-2xl font-bold text-blue-700">{fmt(revenueData.reduce((a, r) => a + Number(r.amount_paid), 0))}</p></div>
            <div className="card"><p className="text-xs text-gray-500">Total Invoices</p><p className="text-2xl font-bold">{revenueData.length}</p></div>
            <div className="card"><p className="text-xs text-gray-500">Paid Invoices</p><p className="text-2xl font-bold text-emerald-600">{revenueData.filter(r => r.status === 'paid').length}</p></div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Revenue Report</h3>
              <button onClick={() => exportCSV(revenueData, 'revenue-report')} className="btn-secondary text-xs"><Download size={14} /> Export CSV</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100">
                  <th className="table-header">Invoice</th><th className="table-header">Customer</th><th className="table-header">Company</th>
                  <th className="table-header">Total</th><th className="table-header">Paid</th><th className="table-header">Balance</th>
                  <th className="table-header">Status</th><th className="table-header">Date</th>
                </tr></thead>
                <tbody>
                  {revenueData.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50/80">
                      <td className="table-cell font-semibold text-blue-600">{r.invoice_number}</td>
                      <td className="table-cell">{r.customer_name}</td>
                      <td className="table-cell text-gray-400 text-xs">{r.company_name || '—'}</td>
                      <td className="table-cell font-semibold">{fmt(r.total)}</td>
                      <td className="table-cell text-emerald-600">{fmt(r.amount_paid)}</td>
                      <td className="table-cell text-red-600">{fmt(r.outstanding_balance)}</td>
                      <td className="table-cell"><span className={`badge ${r.status === 'paid' ? 'badge-success' : r.status === 'overdue' ? 'badge-danger' : 'badge-info'}`}>{r.status?.replace('_', ' ')}</span></td>
                      <td className="table-cell text-xs">{new Date(r.created_at).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {revenueData.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">No data for selected period</p>}
            </div>
          </div>
        </div>
      )}

      {/* Subscription Report */}
      {!loading && tab === 'subscriptions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="card"><p className="text-xs text-gray-500">Total</p><p className="text-2xl font-bold">{subData.length}</p></div>
            <div className="card"><p className="text-xs text-gray-500">Active</p><p className="text-2xl font-bold text-emerald-600">{subData.filter(s => s.status === 'active').length}</p></div>
            <div className="card"><p className="text-xs text-gray-500">MRR (Active)</p><p className="text-2xl font-bold text-blue-700">{fmt(subData.filter(s => s.status === 'active' && s.billing_frequency === 'monthly').reduce((a, s) => a + Number(s.recurring_amount), 0))}</p></div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Subscription Report</h3>
              <button onClick={() => exportCSV(subData, 'subscription-report')} className="btn-secondary text-xs"><Download size={14} /> Export CSV</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100">
                  <th className="table-header">Subscription</th><th className="table-header">Customer</th>
                  <th className="table-header">Plan</th><th className="table-header">Frequency</th>
                  <th className="table-header">Amount</th><th className="table-header">Status</th><th className="table-header">Next Billing</th>
                </tr></thead>
                <tbody>
                  {subData.map((s, i) => (
                    <tr key={i} className="hover:bg-gray-50/80">
                      <td className="table-cell font-semibold text-blue-600">{s.subscription_number}</td>
                      <td className="table-cell">{s.customer_name}</td>
                      <td className="table-cell text-gray-500">{s.plan_name || '—'}</td>
                      <td className="table-cell capitalize">{s.billing_frequency}</td>
                      <td className="table-cell font-semibold">{fmt(s.recurring_amount)}</td>
                      <td className="table-cell"><span className={`badge ${s.status === 'active' ? 'badge-success' : s.status === 'closed' ? 'badge-danger' : 'badge-warning'}`}>{s.status}</span></td>
                      <td className="table-cell text-sm">{s.next_billing_date ? new Date(s.next_billing_date).toLocaleDateString('en-IN') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {subData.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">No data for selected period</p>}
            </div>
          </div>
        </div>
      )}

      {/* Customer Growth */}
      {!loading && tab === 'growth' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Customer Growth (Last 12 months)</h3>
          </div>
          {growthData.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: 8 }} />
                <Bar dataKey="new_customers" fill="#2563eb" name="New Customers" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center py-12 text-gray-400">No customer growth data</p>}
        </div>
      )}

      {/* Outstanding Report */}
      {!loading && tab === 'outstanding' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="card"><p className="text-xs text-gray-500">Outstanding Invoices</p><p className="text-2xl font-bold">{outstandingData.length}</p></div>
            <div className="card"><p className="text-xs text-gray-500">Total Outstanding</p><p className="text-2xl font-bold text-amber-600">{fmt(totalOutstanding)}</p></div>
            <div className="card"><p className="text-xs text-gray-500">Overdue Invoices</p><p className="text-2xl font-bold text-red-600">{overdue.length}</p></div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Outstanding Invoices</h3>
              <button onClick={() => exportCSV(outstandingData, 'outstanding-report')} className="btn-secondary text-xs"><Download size={14} /> Export CSV</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100">
                  <th className="table-header">Invoice</th><th className="table-header">Customer</th>
                  <th className="table-header">Total</th><th className="table-header">Balance</th>
                  <th className="table-header">Due Date</th><th className="table-header">Days Overdue</th><th className="table-header">Status</th>
                </tr></thead>
                <tbody>
                  {outstandingData.map((i, idx) => (
                    <tr key={idx} className={`hover:bg-gray-50/80 ${i.days_overdue > 0 ? 'bg-red-50/50' : ''}`}>
                      <td className="table-cell font-semibold text-blue-600">{i.invoice_number}</td>
                      <td className="table-cell">{i.customer_name}</td>
                      <td className="table-cell font-semibold">{fmt(i.total)}</td>
                      <td className="table-cell font-bold text-amber-600">{fmt(i.outstanding_balance)}</td>
                      <td className="table-cell text-sm">{i.due_date ? new Date(i.due_date).toLocaleDateString('en-IN') : '—'}</td>
                      <td className="table-cell">{i.days_overdue > 0 ? <span className="badge-danger">{i.days_overdue} days</span> : <span className="text-gray-400 text-xs">On time</span>}</td>
                      <td className="table-cell"><span className={`badge ${i.status === 'overdue' ? 'badge-danger' : 'badge-warning'}`}>{i.status?.replace('_', ' ')}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {outstandingData.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">No outstanding invoices 🎉</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
