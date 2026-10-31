import { useState, useEffect } from 'react';
import { planAPI, productAPI } from '../../services/api';
import { Plus, Search, Briefcase, Edit, ToggleLeft, ToggleRight, X, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const freqLabel = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' };
const freqColor = { daily: 'badge-gray', weekly: 'badge-info', monthly: 'badge-success', yearly: 'badge-purple' };

const PlanModal = ({ open, onClose, onSave, plan }) => {
  const [form, setForm] = useState({
    name: '', description: '', billing_frequency: 'monthly', min_quantity: 1,
    allow_pause: true, allow_early_cancellation: true, auto_close_on_end: false, setup_fee: 0,
    products: []
  });
  const [allProducts, setAllProducts] = useState([]);

  useEffect(() => {
    if (open) productAPI.list({ limit: 100 }).then(r => setAllProducts(r.data.data || [])).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (plan) setForm({ ...plan, setup_fee: Number(plan.setup_fee), products: plan.products || [] });
    else setForm({ name: '', description: '', billing_frequency: 'monthly', min_quantity: 1, allow_pause: true, allow_early_cancellation: true, auto_close_on_end: false, setup_fee: 0, products: [] });
  }, [plan, open]);

  if (!open) return null;

  const addProduct = () => setForm({ ...form, products: [...form.products, { product_id: '', variant_id: null, quantity: 1, unit_price: 0 }] });
  const removeProduct = (i) => setForm({ ...form, products: form.products.filter((_, idx) => idx !== i) });
  const updateProduct = (i, field, val) => {
    const prods = [...form.products];
    prods[i] = { ...prods[i], [field]: val };
    if (field === 'product_id') {
      const p = allProducts.find(x => x.id === val);
      if (p) prods[i].unit_price = Number(p.sales_price);
    }
    setForm({ ...form, products: prods });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-lg font-bold">{plan ? 'Edit Plan' : 'New Plan'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="label">Plan Name *</label><input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div className="col-span-2"><label className="label">Description</label><textarea className="input" rows={2} value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div><label className="label">Billing Frequency *</label>
              <select className="input" value={form.billing_frequency} onChange={e => setForm({...form, billing_frequency: e.target.value})}>
                <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option>
              </select>
            </div>
            <div><label className="label">Min Quantity</label><input className="input" type="number" min="1" value={form.min_quantity} onChange={e => setForm({...form, min_quantity: parseInt(e.target.value) || 1})} /></div>
            <div><label className="label">Setup Fee (₹)</label><input className="input" type="number" min="0" value={form.setup_fee} onChange={e => setForm({...form, setup_fee: parseFloat(e.target.value) || 0})} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.allow_pause} onChange={e => setForm({...form, allow_pause: e.target.checked})} className="rounded" /> Allow Pause</label>
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.allow_early_cancellation} onChange={e => setForm({...form, allow_early_cancellation: e.target.checked})} className="rounded" /> Early Cancel</label>
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.auto_close_on_end} onChange={e => setForm({...form, auto_close_on_end: e.target.checked})} className="rounded" /> Auto-close</label>
          </div>

          {/* Plan Products */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Included Products</h3>
              <button type="button" onClick={addProduct} className="text-blue-600 text-sm font-semibold flex items-center gap-1"><Plus size={14} /> Add</button>
            </div>
            {form.products.map((pp, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-end">
                <div className="col-span-5">
                  <select className="input text-sm" value={pp.product_id} onChange={e => updateProduct(i, 'product_id', e.target.value)} required>
                    <option value="">Select product</option>
                    {allProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2"><input className="input text-sm" type="number" min="1" placeholder="Qty" value={pp.quantity} onChange={e => updateProduct(i, 'quantity', parseInt(e.target.value) || 1)} /></div>
                <div className="col-span-3"><input className="input text-sm" type="number" min="0" placeholder="Price" value={pp.unit_price} onChange={e => updateProduct(i, 'unit_price', parseFloat(e.target.value) || 0)} /></div>
                <div className="col-span-2"><button type="button" onClick={() => removeProduct(i)} className="btn-danger text-xs w-full justify-center py-2.5"><X size={14} /></button></div>
              </div>
            ))}
            {form.products.length === 0 && <p className="text-xs text-gray-400 text-center py-2">No products added</p>}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{plan ? 'Update' : 'Create'} Plan</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try { const res = await planAPI.list({ search: search || undefined }); setPlans(res.data || []); }
    catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search]);

  const handleSave = async (form) => {
    try {
      if (editing) await planAPI.update(editing.id, form);
      else await planAPI.create(form);
      setModalOpen(false); setEditing(null); load();
    } catch (err) { alert(err.response?.data?.error || 'Save failed'); }
  };

  const togglePlan = async (id) => {
    try { await planAPI.toggle(id); load(); } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1 className="page-title">Plans</h1><p className="text-sm text-gray-500">{plans.length} subscription plans</p></div>
        <button id="add-plan-btn" onClick={() => { setEditing(null); setModalOpen(true); }} className="btn-primary"><Plus size={16} /> Create Plan</button>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="search-input" placeholder="Search plans..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No plans yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100">
                <th className="table-header">Plan</th>
                <th className="table-header">Frequency</th>
                <th className="table-header">Min Qty</th>
                <th className="table-header">Products</th>
                <th className="table-header">Pause</th>
                <th className="table-header">Cancel</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr></thead>
              <tbody>
                {plans.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="table-cell">
                      <div className="font-semibold text-gray-900">{p.name}</div>
                      {p.description && <div className="text-xs text-gray-400 truncate max-w-[200px]">{p.description}</div>}
                    </td>
                    <td className="table-cell"><span className={freqColor[p.billing_frequency]}>{freqLabel[p.billing_frequency]}</span></td>
                    <td className="table-cell">{p.min_quantity}</td>
                    <td className="table-cell"><span className="badge-info">{p.product_count || 0}</span></td>
                    <td className="table-cell">{p.allow_pause ? '✅' : '❌'}</td>
                    <td className="table-cell">{p.allow_early_cancellation ? '✅' : '❌'}</td>
                    <td className="table-cell">{p.is_active ? <span className="badge-success">Active</span> : <span className="badge-gray">Inactive</span>}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button onClick={async () => { try { const r = await planAPI.getById(p.id); setEditing(r.data); setModalOpen(true); } catch {} }} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"><Edit size={15} /></button>
                        <button onClick={() => togglePlan(p.id)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          {p.is_active ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PlanModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} onSave={handleSave} plan={editing} />
    </div>
  );
};

export default Plans;
