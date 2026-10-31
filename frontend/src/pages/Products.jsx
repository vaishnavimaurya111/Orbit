import { useState, useEffect } from 'react';
import { productAPI } from '../../services/api';
import { Plus, Search, Package, Edit, Archive, Eye, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const statusBadge = (p) => {
  if (p.is_archived) return <span className="badge-gray">Archived</span>;
  if (p.is_active) return <span className="badge-success">Active</span>;
  return <span className="badge-danger">Inactive</span>;
};

const ProductModal = ({ open, onClose, onSave, product, allProducts }) => {
  const [form, setForm] = useState({
    name: '', description: '', product_type: 'service', sales_price: 0, cost_price: 0, unit: 'unit', sku: ''
  });
  useEffect(() => {
    if (product) setForm({ ...product, sales_price: Number(product.sales_price), cost_price: Number(product.cost_price) });
    else setForm({ name: '', description: '', product_type: 'service', sales_price: 0, cost_price: 0, unit: 'unit', sku: '' });
  }, [product, open]);

  if (!open) return null;
  const handleSubmit = (e) => { e.preventDefault(); onSave(form); };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold">{product ? 'Edit Product' : 'New Product'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Product Name *</label>
            <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.product_type} onChange={e => setForm({...form, product_type: e.target.value})}>
                <option value="service">Service</option>
                <option value="digital">Digital</option>
                <option value="physical">Physical</option>
              </select>
            </div>
            <div>
              <label className="label">Unit</label>
              <input className="input" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Sales Price (₹) *</label>
              <input className="input" type="number" min="0" step="0.01" value={form.sales_price} onChange={e => setForm({...form, sales_price: parseFloat(e.target.value) || 0})} required />
            </div>
            <div>
              <label className="label">Cost Price (₹)</label>
              <input className="input" type="number" min="0" step="0.01" value={form.cost_price} onChange={e => setForm({...form, cost_price: parseFloat(e.target.value) || 0})} />
            </div>
          </div>
          <div>
            <label className="label">SKU</label>
            <input className="input" value={form.sku || ''} onChange={e => setForm({...form, sku: e.target.value})} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary"><Plus size={16} /> {product ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const res = await productAPI.list({ search: search || undefined });
      setProducts(res.data.data || []);
    } catch { setError('Failed to load products'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search]);

  const handleSave = async (form) => {
    try {
      if (editing) await productAPI.update(editing.id, form);
      else await productAPI.create(form);
      setModalOpen(false);
      setEditing(null);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Save failed');
    }
  };

  const handleArchive = async (id) => {
    try { await productAPI.archive(id); load(); }
    catch (err) { alert(err.response?.data?.error || 'Archive failed'); }
  };

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="text-sm text-gray-500">{products.length} products</p>
        </div>
        <button id="add-product-btn" onClick={() => { setEditing(null); setModalOpen(true); }} className="btn-primary">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="search-input" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Package size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No products found</p>
            <p className="text-gray-400 text-sm">Create your first product to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100">
                <th className="table-header">Product</th>
                <th className="table-header">Type</th>
                <th className="table-header">Sales Price</th>
                <th className="table-header">Cost Price</th>
                <th className="table-header">Variants</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr></thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Package size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{p.name}</div>
                          <div className="text-xs text-gray-400">{p.sku || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell capitalize">{p.product_type}</td>
                    <td className="table-cell font-semibold">{fmt(p.sales_price)}</td>
                    <td className="table-cell text-gray-500">{fmt(p.cost_price)}</td>
                    <td className="table-cell"><span className="badge-info">{p.variant_count || 0}</span></td>
                    <td className="table-cell">{statusBadge(p)}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button onClick={() => navigate(`/products/${p.id}`)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                          <Eye size={15} />
                        </button>
                        <button onClick={() => { setEditing(p); setModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                          <Edit size={15} />
                        </button>
                        <button onClick={() => handleArchive(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Archive">
                          <Archive size={15} />
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

      <ProductModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} onSave={handleSave} product={editing} />
    </div>
  );
};

export default Products;
