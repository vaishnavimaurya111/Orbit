import { useState, useEffect } from 'react';
import { quotationAPI, customerAPI, productAPI, taxAPI, discountAPI } from '../../services/api';
import { Plus, Search, FileText, Eye, CheckCircle, XCircle, Send, ArrowRightLeft, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const statusColors = { draft: 'badge-gray', sent: 'badge-info', accepted: 'badge-success', rejected: 'badge-danger', expired: 'badge-warning', converted: 'badge-purple' };

const QuotationModal = ({ open, onClose, onSave }) => {
  const [form, setForm] = useState({ customer_id: '', items: [{ product_id: '', variant_id: null, quantity: 1, unit_price: 0, description: '' }], discount_id: '', tax_id: '', notes: '', expiry_date: '' });
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [discounts, setDiscounts] = useState([]);

  useEffect(() => {
    if (open) {
      customerAPI.list({ limit: 200 }).then(r => setCustomers(r.data.data || [])).catch(() => {});
      productAPI.list({ limit: 200 }).then(r => setProducts(r.data.data || [])).catch(() => {});
      taxAPI.list().then(r => setTaxes(r.data || [])).catch(() => {});
      discountAPI.list().then(r => setDiscounts(r.data || [])).catch(() => {});
      setForm({ customer_id: '', items: [{ product_id: '', variant_id: null, quantity: 1, unit_price: 0, description: '' }], discount_id: '', tax_id: '', notes: '', expiry_date: '' });
    }
  }, [open]);

  if (!open) return null;

  const addItem = () => setForm({ ...form, items: [...form.items, { product_id: '', variant_id: null, quantity: 1, unit_price: 0, description: '' }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i, field, val) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: val };
    if (field === 'product_id') { const p = products.find(x => x.id === val); if (p) { items[i].unit_price = Number(p.sales_price); items[i].description = p.name; } }
    setForm({ ...form, items });
  };

  const subtotal = form.items.reduce((a, i) => a + (i.unit_price * i.quantity), 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-lg font-bold">New Quotation</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, discount_id: form.discount_id || null, tax_id: form.tax_id || null, expiry_date: form.expiry_date || null }); }} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Customer *</label>
              <select className="input" value={form.customer_id} onChange={e => setForm({...form, customer_id: e.target.value})} required>
                <option value="">Select customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.company_name ? `(${c.company_name})` : ''}</option>)}
              </select>
            </div>
            <div><label className="label">Expiry Date</label><input className="input" type="date" value={form.expiry_date} onChange={e => setForm({...form, expiry_date: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Tax Rule</label>
              <select className="input" value={form.tax_id} onChange={e => setForm({...form, tax_id: e.target.value})}>
                <option value="">No tax</option>
                {taxes.filter(t => t.is_active).map(t => <option key={t.id} value={t.id}>{t.name} ({t.rate}%)</option>)}
              </select>
            </div>
            <div><label className="label">Discount</label>
              <select className="input" value={form.discount_id} onChange={e => setForm({...form, discount_id: e.target.value})}>
                <option value="">No discount</option>
                {discounts.filter(d => d.is_active).map(d => <option key={d.id} value={d.id}>{d.name} ({d.discount_type === 'percentage' ? `${d.value}%` : `₹${d.value}`})</option>)}
              </select>
            </div>
          </div>

          {/* Items */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Items</h3>
              <button type="button" onClick={addItem} className="text-blue-600 text-sm font-semibold flex items-center gap-1"><Plus size={14} /> Add Item</button>
            </div>
            {form.items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-end">
                <div className="col-span-5"><select className="input text-sm" value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)} required>
                  <option value="">Select product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} - {fmt(p.sales_price)}</option>)}
                </select></div>
                <div className="col-span-2"><input className="input text-sm" type="number" min="1" placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1)} /></div>
                <div className="col-span-3"><input className="input text-sm" type="number" min="0" placeholder="Price" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', parseFloat(e.target.value) || 0)} /></div>
                <div className="col-span-2"><button type="button" onClick={() => removeItem(i)} className="btn-danger text-xs w-full justify-center py-2.5"><X size={14} /></button></div>
              </div>
            ))}
            <div className="text-right mt-3 text-sm font-semibold text-gray-700">Subtotal: {fmt(subtotal)}</div>
          </div>
          <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create Quotation</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ConvertModal = ({ open, onClose, quotation, onConvert }) => {
  const [form, setForm] = useState({ billing_frequency: 'monthly', start_date: new Date().toISOString().split('T')[0], payment_terms: 30 });
  if (!open || !quotation) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold">Convert to Subscription</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onConvert(quotation.id, form); }} className="p-6 space-y-4">
          <div><label className="label">Billing Frequency</label>
            <select className="input" value={form.billing_frequency} onChange={e => setForm({...form, billing_frequency: e.target.value})}>
              <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option>
            </select>
          </div>
          <div><label className="label">Start Date</label><input className="input" type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} required /></div>
          <div><label className="label">Payment Terms (days)</label><input className="input" type="number" min="0" value={form.payment_terms} onChange={e => setForm({...form, payment_terms: parseInt(e.target.value) || 30})} /></div>
          <div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary"><ArrowRightLeft size={16} /> Convert</button></div>
        </form>
      </div>
    </div>
  );
};

const Quotations = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [convertModal, setConvertModal] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try { const res = await quotationAPI.list({ search: search || undefined, status: statusFilter || undefined }); setQuotations(res.data.data || []); }
    catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, statusFilter]);

  const handleSave = async (form) => {
    try { await quotationAPI.create(form); setModalOpen(false); load(); }
    catch (err) { alert(err.response?.data?.error || 'Save failed'); }
  };

  const updateStatus = async (id, status) => {
    try { await quotationAPI.updateStatus(id, status); load(); }
    catch (err) { alert(err.response?.data?.error || 'Update failed'); }
  };

  const handleConvert = async (id, data) => {
    try { await quotationAPI.convert(id, data); setConvertModal(null); load(); }
    catch (err) { alert(err.response?.data?.error || 'Conversion failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1 className="page-title">Quotations</h1><p className="text-sm text-gray-500">{quotations.length} quotations</p></div>
        <button id="add-quotation-btn" onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={16} /> New Quotation</button>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="search-input" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <select className="input w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {['draft','sent','accepted','rejected','expired','converted'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
        ) : quotations.length === 0 ? (
          <div className="text-center py-12"><FileText size={40} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500 font-medium">No quotations found</p></div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-gray-100">
            <th className="table-header">Quotation</th><th className="table-header">Customer</th><th className="table-header">Total</th>
            <th className="table-header">Status</th><th className="table-header">Expiry</th><th className="table-header">Actions</th>
          </tr></thead><tbody>
            {quotations.map(q => (
              <tr key={q.id} className="hover:bg-gray-50/80 transition-colors">
                <td className="table-cell font-semibold text-blue-600">{q.quotation_number}</td>
                <td className="table-cell"><div className="font-medium">{q.customer_name}</div>{q.company_name && <div className="text-xs text-gray-400">{q.company_name}</div>}</td>
                <td className="table-cell font-semibold">{fmt(q.total)}</td>
                <td className="table-cell"><span className={statusColors[q.status] || 'badge-gray'}>{q.status}</span></td>
                <td className="table-cell text-sm">{q.expiry_date ? new Date(q.expiry_date).toLocaleDateString() : '—'}</td>
                <td className="table-cell">
                  <div className="flex items-center gap-1">
                    <button onClick={() => navigate(`/quotations/${q.id}`)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="View"><Eye size={15} /></button>
                    {q.status === 'draft' && <button onClick={() => updateStatus(q.id, 'sent')} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Send"><Send size={15} /></button>}
                    {q.status === 'sent' && <>
                      <button onClick={() => updateStatus(q.id, 'accepted')} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Accept"><CheckCircle size={15} /></button>
                      <button onClick={() => updateStatus(q.id, 'rejected')} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Reject"><XCircle size={15} /></button>
                    </>}
                    {q.status === 'accepted' && <button onClick={() => setConvertModal(q)} className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg" title="Convert"><ArrowRightLeft size={15} /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody></table></div>
        )}
      </div>

      <QuotationModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} />
      <ConvertModal open={!!convertModal} onClose={() => setConvertModal(null)} quotation={convertModal} onConvert={handleConvert} />
    </div>
  );
};

export default Quotations;
