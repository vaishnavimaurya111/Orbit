import { useState, useEffect } from 'react';
import { taxAPI, discountAPI } from '../../services/api';
import { Plus, Edit, ToggleLeft, ToggleRight, X, Percent } from 'lucide-react';

const TaxModal = ({ open, onClose, onSave, tax }) => {
  const [form, setForm] = useState({ name: '', rate: 0, description: '' });
  useEffect(() => {
    if (tax) setForm({ name: tax.name, rate: Number(tax.rate), description: tax.description || '' });
    else setForm({ name: '', rate: 0, description: '' });
  }, [tax, open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold">{tax ? 'Edit Tax Rule' : 'New Tax Rule'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="p-6 space-y-4">
          <div><label className="label">Tax Name *</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. GST 18%" required /></div>
          <div><label className="label">Tax Rate (%) *</label><input className="input" type="number" min="0" max="100" step="0.01" value={form.rate} onChange={e => setForm({ ...form, rate: parseFloat(e.target.value) || 0 })} required /></div>
          <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{tax ? 'Update' : 'Create'} Tax</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DiscountModal = ({ open, onClose, onSave, discount }) => {
  const [form, setForm] = useState({ name: '', discount_type: 'percentage', value: 0, min_order_value: 0, max_uses: null, start_date: '', end_date: '', description: '' });
  useEffect(() => {
    if (discount) setForm({ ...discount, value: Number(discount.value), min_order_value: Number(discount.min_order_value) || 0 });
    else setForm({ name: '', discount_type: 'percentage', value: 0, min_order_value: 0, max_uses: null, start_date: '', end_date: '', description: '' });
  }, [discount, open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold">{discount ? 'Edit Discount' : 'New Discount'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, max_uses: form.max_uses ? parseInt(form.max_uses) : null, start_date: form.start_date || null, end_date: form.end_date || null }); }} className="p-6 space-y-4">
          <div><label className="label">Discount Name *</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Summer Sale 20%" required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Type *</label>
              <select className="input" value={form.discount_type} onChange={e => setForm({ ...form, discount_type: e.target.value })}>
                <option value="percentage">Percentage (%)</option><option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div><label className="label">Value *</label><input className="input" type="number" min="0" step="0.01" value={form.value} onChange={e => setForm({ ...form, value: parseFloat(e.target.value) || 0 })} required /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Min Order (₹)</label><input className="input" type="number" min="0" value={form.min_order_value} onChange={e => setForm({ ...form, min_order_value: parseFloat(e.target.value) || 0 })} /></div>
            <div><label className="label">Max Uses</label><input className="input" type="number" min="1" value={form.max_uses || ''} placeholder="Unlimited" onChange={e => setForm({ ...form, max_uses: e.target.value || null })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Start Date</label><input className="input" type="date" value={form.start_date || ''} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
            <div><label className="label">End Date</label><input className="input" type="date" value={form.end_date || ''} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
          </div>
          <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{discount ? 'Update' : 'Create'} Discount</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TaxesDiscounts = () => {
  const [taxes, setTaxes] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [taxModal, setTaxModal] = useState(false);
  const [discountModal, setDiscountModal] = useState(false);
  const [editTax, setEditTax] = useState(null);
  const [editDiscount, setEditDiscount] = useState(null);
  const [tab, setTab] = useState('taxes');

  const loadTaxes = async () => { try { const r = await taxAPI.list(); setTaxes(r.data || []); } catch {} };
  const loadDiscounts = async () => { try { const r = await discountAPI.list(); setDiscounts(r.data || []); } catch {} };

  useEffect(() => { loadTaxes(); loadDiscounts(); }, []);

  const saveTax = async (form) => {
    try {
      if (editTax) await taxAPI.update(editTax.id, form);
      else await taxAPI.create(form);
      setTaxModal(false); setEditTax(null); loadTaxes();
    } catch (err) { alert(err.response?.data?.error || 'Save failed'); }
  };

  const saveDiscount = async (form) => {
    try {
      if (editDiscount) await discountAPI.update(editDiscount.id, form);
      else await discountAPI.create(form);
      setDiscountModal(false); setEditDiscount(null); loadDiscounts();
    } catch (err) { alert(err.response?.data?.error || 'Save failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Taxes & Discounts</h1>
        {tab === 'taxes'
          ? <button id="add-tax-btn" onClick={() => { setEditTax(null); setTaxModal(true); }} className="btn-primary"><Plus size={16} /> Add Tax</button>
          : <button id="add-discount-btn" onClick={() => { setEditDiscount(null); setDiscountModal(true); }} className="btn-primary"><Plus size={16} /> Add Discount</button>
        }
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => setTab('taxes')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'taxes' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
          Taxes ({taxes.length})
        </button>
        <button onClick={() => setTab('discounts')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'discounts' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
          Discounts ({discounts.length})
        </button>
      </div>

      {tab === 'taxes' && (
        <div className="card">
          {taxes.length === 0 ? (
            <div className="text-center py-12"><Percent size={40} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No tax rules yet</p></div>
          ) : (
            <table className="w-full">
              <thead><tr className="border-b border-gray-100">
                <th className="table-header">Tax Name</th><th className="table-header">Rate</th><th className="table-header">Description</th><th className="table-header">Status</th><th className="table-header">Actions</th>
              </tr></thead>
              <tbody>
                {taxes.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50/80">
                    <td className="table-cell font-semibold">{t.name}</td>
                    <td className="table-cell"><span className="badge-info">{t.rate}%</span></td>
                    <td className="table-cell text-gray-500 text-sm">{t.description || '—'}</td>
                    <td className="table-cell">{t.is_active ? <span className="badge-success">Active</span> : <span className="badge-gray">Inactive</span>}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditTax(t); setTaxModal(true); }} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"><Edit size={15} /></button>
                        <button onClick={async () => { try { await taxAPI.toggle(t.id); loadTaxes(); } catch {} }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          {t.is_active ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'discounts' && (
        <div className="card">
          {discounts.length === 0 ? (
            <div className="text-center py-12"><Percent size={40} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No discounts yet</p></div>
          ) : (
            <table className="w-full">
              <thead><tr className="border-b border-gray-100">
                <th className="table-header">Name</th><th className="table-header">Type</th><th className="table-header">Value</th>
                <th className="table-header">Min Order</th><th className="table-header">Uses</th><th className="table-header">Expiry</th><th className="table-header">Status</th><th className="table-header">Actions</th>
              </tr></thead>
              <tbody>
                {discounts.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50/80">
                    <td className="table-cell font-semibold">{d.name}</td>
                    <td className="table-cell capitalize">{d.discount_type}</td>
                    <td className="table-cell font-semibold">{d.discount_type === 'percentage' ? `${d.value}%` : `₹${d.value}`}</td>
                    <td className="table-cell">{d.min_order_value > 0 ? `₹${d.min_order_value}` : '—'}</td>
                    <td className="table-cell">{d.used_count || 0} / {d.max_uses || '∞'}</td>
                    <td className="table-cell text-sm">{d.end_date ? new Date(d.end_date).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="table-cell">{d.is_active ? <span className="badge-success">Active</span> : <span className="badge-gray">Inactive</span>}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditDiscount(d); setDiscountModal(true); }} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"><Edit size={15} /></button>
                        <button onClick={async () => { try { await discountAPI.toggle(d.id); loadDiscounts(); } catch {} }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          {d.is_active ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <TaxModal open={taxModal} onClose={() => { setTaxModal(false); setEditTax(null); }} onSave={saveTax} tax={editTax} />
      <DiscountModal open={discountModal} onClose={() => { setDiscountModal(false); setEditDiscount(null); }} onSave={saveDiscount} discount={editDiscount} />
    </div>
  );
};

export default TaxesDiscounts;
