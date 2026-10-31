import { useState, useEffect } from 'react';
import { analyticsAPI, billingAPI } from '../../services/api';
import {
  TrendingUp, Users, Zap, Receipt, AlertTriangle, DollarSign,
  ArrowUpRight, ArrowDownRight, RefreshCw, Calendar, Play
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const num = (n) => new Intl.NumberFormat('en-IN').format(n || 0);

const MetricCard = ({ label, value, sub, icon: Icon, color, trend }) => (
  <div className="metric-card">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
    {trend !== undefined && (
      <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
        {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        <span>{Math.abs(trend)}% vs last period</span>
      </div>
    )}
  </div>
);

const PIE_COLORS = { active: '#2563eb', paused: '#f59e0b', closed: '#ef4444', draft: '#94a3b8', confirmed: '#10b981', quotation: '#7c3aed' };

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [revenueChart, setRevenueChart] = useState([]);
  const [subChart, setSubChart] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [mrrChart, setMrrChart] = useState([]);
  const [period, setPeriod] = useState('30');
  const [loading, setLoading] = useState(true);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingResult, setBillingResult] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [m, r, s, st, mrr] = await Promise.all([
        analyticsAPI.dashboard({ period }),
        analyticsAPI.revenueChart({ months: 6 }),
        analyticsAPI.subscriptionChart({ months: 6 }),
        analyticsAPI.subscriptionStatus(),
        analyticsAPI.mrrChart({ months: 6 }),
      ]);
      setMetrics(m.data);
      setRevenueChart(r.data);
      setSubChart(s.data);
      setStatusData(st.data);
      setMrrChart(mrr.data);
    } catch (err) {
      setError('Failed to load analytics. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [period]);

  const runBilling = async () => {
    setBillingLoading(true);
    setBillingResult(null);
    try {
      const res = await billingAPI.run();
      setBillingResult(res.data);
      load();
    } catch (err) {
      setBillingResult({ error: err.response?.data?.error || 'Billing failed' });
    } finally {
      setBillingLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-gray-400 text-sm">Loading analytics...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center max-w-sm">
        <AlertTriangle size={40} className="text-amber-400 mx-auto mb-3" />
        <p className="text-gray-700 font-semibold mb-2">Backend not connected</p>
        <p className="text-gray-400 text-sm mb-4">{error}</p>
        <button onClick={load} className="btn-primary mx-auto">
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time business metrics from your database</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="input w-auto text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
            <option value="180">Last 6 months</option>
            <option value="365">This year</option>
          </select>
          <button
            id="run-billing-btn"
            onClick={runBilling}
            disabled={billingLoading}
            className="btn-primary"
          >
            {billingLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Play size={16} />}
            Run Billing Cycle
          </button>
          <button onClick={load} className="btn-secondary">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Billing result */}
      {billingResult && (
        <div className={`p-4 rounded-xl border text-sm ${billingResult.error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
          {billingResult.error ? (
            `❌ ${billingResult.error}`
          ) : (
            `✅ Billing complete: ${billingResult.success} invoices generated, ${billingResult.skipped} skipped, ${billingResult.failed} failed.`
          )}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Revenue" value={fmt(metrics?.revenue)} icon={DollarSign} color="bg-blue-600" />
        <MetricCard label="MRR" value={fmt(metrics?.mrr)} sub="Monthly Recurring Revenue" icon={TrendingUp} color="bg-purple-600" />
        <MetricCard label="ARR" value={fmt(metrics?.arr)} sub="Annual Recurring Revenue" icon={Calendar} color="bg-indigo-600" />
        <MetricCard label="Active Subscriptions" value={num(metrics?.active_subscriptions)} icon={Zap} color="bg-emerald-600" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Customers" value={num(metrics?.total_customers)} icon={Users} color="bg-sky-600" />
        <MetricCard label="New Customers" value={num(metrics?.new_customers)} icon={Users} color="bg-teal-600" />
        <MetricCard label="Outstanding Invoices" value={fmt(metrics?.outstanding_invoices?.amount)} sub={`${num(metrics?.outstanding_invoices?.count)} invoices`} icon={Receipt} color="bg-amber-500" />
        <MetricCard label="Overdue Invoices" value={fmt(metrics?.overdue_invoices?.amount)} sub={`${num(metrics?.overdue_invoices?.count)} invoices`} icon={AlertTriangle} color="bg-red-600" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">Revenue Trend</h3>
          {revenueChart.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueChart}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => [fmt(v), 'Revenue']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-52 text-gray-400 text-sm">No revenue data yet</div>
          )}
        </div>

        {/* MRR Chart */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">MRR Trend</h3>
          {mrrChart.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={mrrChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => [fmt(v), 'MRR']} contentStyle={{ borderRadius: 8 }} />
                <Bar dataKey="mrr" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-52 text-gray-400 text-sm">No MRR data yet</div>
          )}
        </div>

        {/* Subscription Chart */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">Subscription Growth</h3>
          {subChart.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={subChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: 8 }} />
                <Bar dataKey="new_subscriptions" fill="#2563eb" radius={[4, 4, 0, 0]} name="New" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-52 text-gray-400 text-sm">No subscription data yet</div>
          )}
        </div>

        {/* Status Breakdown */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">Subscription Status</h3>
          {statusData.length ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={statusData} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={45} outerRadius={70}>
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={PIE_COLORS[entry.status] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {statusData.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[s.status] || '#94a3b8' }}></div>
                      <span className="text-gray-600 capitalize">{s.status}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm font-medium">Upcoming Renewals</p>
              <p className="text-3xl font-bold mt-1">{metrics?.upcoming_renewals || 0}</p>
              <p className="text-blue-200 text-xs mt-1">Next 7 days</p>
            </div>
            <Calendar size={40} className="text-blue-300" />
          </div>
        </div>
        <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-200 text-sm font-medium">Cancelled (period)</p>
              <p className="text-3xl font-bold mt-1">{metrics?.cancelled_subscriptions || 0}</p>
              <p className="text-red-200 text-xs mt-1">Needs attention</p>
            </div>
            <AlertTriangle size={40} className="text-red-300" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
