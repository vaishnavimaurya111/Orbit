import { useState, useEffect } from 'react';
import { subscriptionAPI, customerAPI, planAPI, productAPI, taxAPI } from '../../services/api';
import { Plus, Search, Zap, Eye, Play, Pause, X, StopCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const statusColors = { draft: 'badge-gray', quotation: 'badge-purple', confirmed: 'badge-info', active: 'badge-success', paused: 'badge-warning', closed: 'badge-danger' };
const freqColor = { daily: 'badge-gray', weekly: 'badge-info', monthly: 'badge-success', yearly: 'badge-purple' };

const CreateSubscriptionModal = ({ open, onClose, onSave }) => {
  const [form, setForm] = useState({
    customer_id: '', plan_id: '', billing_frequency: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '', payment_terms: 30, tax_id: '', notes: '',
    items: [{ product_id: '', variant_id: null, quantity: 1, unit_price: 0 }]
  });
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [taxes, setTaxes] = useState([]);

  useEffect(() => {
    if (open) {
      Promise.all([
        customerAPI.list({ limit: 200 }),
        planAPI.list({ is_active: 'true' }),
        productAPI.list({ limit: 200 }),
        taxAPI.list()
      ]).then(([c, p, pr, t]) => {
        setCustomers(c.data.data || []);
        setPlans(p.data || []);
        setProducts(pr.data.data || []);
        setTaxes(t.data || []);
      }).catch(() => {});
      setForm({
        customer_id: '', plan_id: '', billing_frequency: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '', payment_terms: 30, tax_id: '', notes: '',
        items: [{ product_id: '', variant_id: null, quantity: 1, unit_price: 0 }]
      });
    }
  }, [open]);

  if (!open) return null;

  const addItem = () => setForm({ ...form, items: [...form.items, { product_id: '', variant_id: null, quantity: 1, unit_price: 0 }] });
  const removeItem = (i) => form.items.length > 1 && setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i, field, val) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: val };
    if (field === 'product_id') {
      const p = products.find(x => x.id === val);
      if (p) items[i].unit_price = Number(p.sales_price);
    }
    setForm({ ...form, items });
  };

  const handlePlanChange = async (planId) => {
    setForm({ ...form, plan_id: planId });
    if (planId) {
      try {
        const res = await planAPI.getById(planId);
        const plan = res.data;
        setForm(f => ({
          ...f, plan_id: planId,
          billing_frequency: plan.billing_frequency,
          items: plan.products?.length ? plan.products.map(pp => ({
            product_id: pp.product_id,
            variant_id: pp.variant_id || null,
            quantity: pp.quantity || 1,
            unit_price: Number(pp.unit_price || pp.product_price)
          })) : f.items
        }));
      } catch {}
    }
  };

  const subtotal = form.items.reduce((a, i) => a + (Number(i.unit_price) * Number(i.quantity)), 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-lg font-bold">New Subscription</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, plan_id: form.plan_id || null, tax_id: form.tax_id || null, end_date: form.end_date || null }); }} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Customer *</label>
              <select className="input" value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })} required>
                <option value="">Select customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.company_name ? `(${c.company_name})` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Plan (optional)</label>
              <select className="input" value={form.plan_id} onChange={e => handlePlanChange(e.target.value)}>
                <option value="">Custom (no plan)</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Billing Frequency *</label>
              <select className="input" value={form.billing_frequency} onChange={e => setForm({ ...form, billing_frequency: e.target.value })}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="label">Tax</label>
              <select className="input" value={form.tax_id} onChange={e => setForm({ ...form, tax_id: e.target.value })}>
                <option value="">No tax</option>
                {taxes.filter(t => t.is_active).map(t => <option key={t.id} value={t.id}>{t.name} ({t.rate}%)</option>)}
              </select>
            </div>
            <div>
              <label className="label">Start Date *</label>
              <input className="input" type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required />
            </div>
            <div>
              <label className="label">End Date (optional)</label>
              <input className="input" type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
            </div>
            <div>
              <label className="label">Payment Terms (days)</label>
              <input className="input" type="number" min="0" value={form.payment_terms} onChange={e => setForm({ ...form, payment_terms: parseInt(e.target.value) || 30 })} />
            </div>
          </div>

          {/* Items */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Products / Items</h3>
              <button type="button" onClick={addItem} className="text-blue-600 text-sm font-semibold flex items-center gap-1"><Plus size={14} /> Add Item</button>
            </div>
            {form.items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-end">
                <div className="col-span-5">
                  <select className="input text-sm" value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)} required>
                    <option value="">Select product</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2"><input className="input text-sm" type="number" min="1" placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1)} /></div>
                <div className="col-span-3"><input className="input text-sm" type="number" min="0" step="0.01" placeholder="Unit Price" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', parseFloat(e.target.value) || 0)} /></div>
                <div className="col-span-2">
                  <button type="button" onClick={() => removeItem(i)} className="w-full py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs flex items-center justify-center">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
            <div className="text-right mt-2 text-sm font-semibold text-gray-700">Subtotal: {fmt(subtotal)}</div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary"><Plus size={16} /> Create Subscription</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const res = await subscriptionAPI.list({ search: search || undefined, status: statusFilter || undefined });
      setSubscriptions(res.data.data || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, statusFilter]);

  const handleSave = async (form) => {
    try { await subscriptionAPI.create(form); setModalOpen(false); load(); }
    catch (err) { alert(err.response?.data?.error || 'Create failed'); }
  };

  const doTransition = async (id, action) => {
    try { await subscriptionAPI.transition(id, action); load(); }
    catch (err) { alert(err.response?.data?.error || 'Action failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Subscriptions</h1>
          <p className="text-sm text-gray-500">{subscriptions.length} subscriptions</p>
        </div>
        <button id="add-subscription-btn" onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus size={16} /> New Subscription
        </button>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="search-input" placeholder="Search subscriptions..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {['draft','quotation','confirmed','active','paused','closed'].map(s => (
              <option key={s} value={s} className="capitalize">{s}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-12">
            <Zap size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No subscriptions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100">
                <th className="table-header">Subscription</th>
                <th className="table-header">Customer</th>
                <th className="table-header">Plan</th>
                <th className="table-header">Frequency</th>
                <th className="table-header">Amount</th>
                <th className="table-header">Next Billing</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr></thead>
              <tbody>
                {subscriptions.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="table-cell">
                      <span className="font-semibold text-blue-600 cursor-pointer hover:underline" onClick={() => navigate(`/subscriptions/${s.id}`)}>
                        {s.subscription_number}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="font-medium text-gray-900">{s.customer_name}</div>
                      {s.company_name && <div className="text-xs text-gray-400">{s.company_name}</div>}
                    </td>
                    <td className="table-cell text-gray-600">{s.plan_name || '—'}</td>
                    <td className="table-cell"><span className={freqColor[s.billing_frequency] || 'badge-gray'}>{s.billing_frequency}</span></td>
                    <td className="table-cell font-semibold">{fmt(s.recurring_amount)}</td>
                    <td className="table-cell text-sm text-gray-500">{s.next_billing_date ? new Date(s.next_billing_date).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="table-cell"><span className={statusColors[s.status] || 'badge-gray'}>{s.status}</span></td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button onClick={() => navigate(`/subscriptions/${s.id}`)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="View"><Eye size={15} /></button>
                        {(s.status === 'confirmed') && (
                          <button onClick={() => doTransition(s.id, 'activate')} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Activate"><Play size={15} /></button>
                        )}
                        {s.status === 'active' && (
                          <button onClick={() => doTransition(s.id, 'pause')} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg" title="Pause"><Pause size={15} /></button>
                        )}
                        {s.status === 'paused' && (
                          <button onClick={() => doTransition(s.id, 'resume')} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Resume"><Play size={15} /></button>
                        )}
                        {!['closed'].includes(s.status) && (
                          <button onClick={() => { if (window.confirm('Close this subscription?')) doTransition(s.id, 'close'); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Close"><StopCircle size={15} /></button>
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

      <CreateSubscriptionModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} />
    </div>
  );
};

export default Subscriptions;
