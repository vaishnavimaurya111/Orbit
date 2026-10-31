import { useState, useEffect } from 'react';
import { customerAPI } from '../../services/api';
import { Plus, Search, Users, Eye, Edit, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CustomerModal = ({ open, onClose, onSave, customer }) => {
  const [form, setForm] = useState({ name: '', company_name: '', email: '', phone: '', billing_address: '', city: '', state: '', country: 'India', pincode: '', gst_number: '', notes: '' });
  useEffect(() => { if (customer) setForm(customer); else setForm({ name: '', company_name: '', email: '', phone: '', billing_address: '', city: '', state: '', country: 'India', pincode: '', gst_number: '', notes: '' }); }, [customer, open]);
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-lg font-bold">{customer ? 'Edit Customer' : 'New Customer'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Name *</label><input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div><label className="label">Company</label><input className="input" value={form.company_name || ''} onChange={e => setForm({...form, company_name: e.target.value})} /></div>
            <div><label className="label">Email *</label><input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></div>
            <div><label className="label">Phone</label><input className="input" value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} /></div>
          </div>
          <div><label className="label">Address</label><textarea className="input" rows={2} value={form.billing_address || ''} onChange={e => setForm({...form, billing_address: e.target.value})} /></div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">City</label><input className="input" value={form.city || ''} onChange={e => setForm({...form, city: e.target.value})} /></div>
            <div><label className="label">State</label><input className="input" value={form.state || ''} onChange={e => setForm({...form, state: e.target.value})} /></div>
            <div><label className="label">Pincode</label><input className="input" value={form.pincode || ''} onChange={e => setForm({...form, pincode: e.target.value})} /></div>
          </div>
          <div><label className="label">GST Number</label><input className="input" value={form.gst_number || ''} onChange={e => setForm({...form, gst_number: e.target.value})} /></div>
          <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{customer ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try { const res = await customerAPI.list({ search: search || undefined }); setCustomers(res.data.data || []); }
    catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search]);

  const handleSave = async (form) => {
    try {
      if (editing) await customerAPI.update(editing.id, form);
      else await customerAPI.create(form);
      setModalOpen(false); setEditing(null); load();
    } catch (err) { alert(err.response?.data?.error || 'Save failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1 className="page-title">Customers</h1><p className="text-sm text-gray-500">{customers.length} customers</p></div>
        <button id="add-customer-btn" onClick={() => { setEditing(null); setModalOpen(true); }} className="btn-primary"><Plus size={16} /> Add Customer</button>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="search-input" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
        ) : customers.length === 0 ? (
          <div className="text-center py-12"><Users size={40} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500 font-medium">No customers found</p></div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-gray-100">
            <th className="table-header">Customer</th><th className="table-header">Company</th><th className="table-header">Phone</th>
            <th className="table-header">Subscriptions</th><th className="table-header">Invoices</th><th className="table-header">Actions</th>
          </tr></thead><tbody>
            {customers.map(c => (
              <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                <td className="table-cell"><div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center"><span className="text-white text-sm font-bold">{c.name?.charAt(0)}</span></div>
                  <div><div className="font-semibold text-gray-900">{c.name}</div><div className="text-xs text-gray-400">{c.email}</div></div>
                </div></td>
                <td className="table-cell text-gray-600">{c.company_name || '—'}</td>
                <td className="table-cell text-gray-500">{c.phone || '—'}</td>
                <td className="table-cell"><span className="badge-info">{c.subscription_count || 0}</span></td>
                <td className="table-cell"><span className="badge-gray">{c.invoice_count || 0}</span></td>
                <td className="table-cell"><div className="flex items-center gap-1">
                  <button onClick={() => navigate(`/customers/${c.id}`)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Eye size={15} /></button>
                  <button onClick={() => { setEditing(c); setModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"><Edit size={15} /></button>
                </div></td>
              </tr>
            ))}
          </tbody></table></div>
        )}
      </div>
      <CustomerModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} onSave={handleSave} customer={editing} />
    </div>
  );
};

export default Customers;
