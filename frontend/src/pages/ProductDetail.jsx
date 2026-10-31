import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productAPI } from '../../services/api';
import { ArrowLeft, Edit, Plus, Package, X, Tag } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [variantForm, setVariantForm] = useState({ name: '', additional_price: 0, sku: '', description: '' });
  const [showVariantForm, setShowVariantForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await productAPI.getById(id);
      setProduct(res.data);
    } catch { navigate('/products'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const addVariant = async (e) => {
    e.preventDefault();
    try {
      await productAPI.createVariant(id, { ...variantForm, additional_price: parseFloat(variantForm.additional_price) || 0 });
      setVariantForm({ name: '', additional_price: 0, sku: '', description: '' });
      setShowVariantForm(false);
      load();
    } catch (err) { alert(err.response?.data?.error || 'Failed to add variant'); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!product) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/products')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ArrowLeft size={20} /></button>
        <div>
          <h1 className="page-title">{product.name}</h1>
          <p className="text-sm text-gray-500">{product.sku || 'No SKU'} · {product.product_type}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Info */}
        <div className="lg:col-span-2 card">
          <h3 className="font-bold text-gray-900 mb-4">Product Details</h3>
          <div className="grid grid-cols-2 gap-6">
            <div><p className="text-xs text-gray-500">Type</p><p className="font-semibold capitalize">{product.product_type}</p></div>
            <div><p className="text-xs text-gray-500">Unit</p><p className="font-semibold">{product.unit}</p></div>
            <div><p className="text-xs text-gray-500">Sales Price</p><p className="font-semibold text-lg text-blue-700">{fmt(product.sales_price)}</p></div>
            <div><p className="text-xs text-gray-500">Cost Price</p><p className="font-semibold">{fmt(product.cost_price)}</p></div>
            <div><p className="text-xs text-gray-500">Margin</p><p className="font-semibold text-emerald-600">{fmt(product.sales_price - product.cost_price)}</p></div>
            <div><p className="text-xs text-gray-500">Status</p><p className="font-semibold">{product.is_active ? '✅ Active' : '❌ Inactive'}</p></div>
          </div>
          {product.description && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-700">{product.description}</p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Package size={20} className="text-blue-600" />
              <div><p className="text-xs text-gray-500">Variants</p><p className="font-bold">{product.variants?.length || 0}</p></div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
              <Tag size={20} className="text-emerald-600" />
              <div><p className="text-xs text-gray-500">SKU</p><p className="font-bold">{product.sku || 'N/A'}</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* Variants */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Product Variants</h3>
          <button onClick={() => setShowVariantForm(!showVariantForm)} className="btn-primary text-sm">
            {showVariantForm ? <X size={14} /> : <Plus size={14} />} {showVariantForm ? 'Cancel' : 'Add Variant'}
          </button>
        </div>

        {showVariantForm && (
          <form onSubmit={addVariant} className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <input className="input" placeholder="Variant name *" value={variantForm.name} onChange={e => setVariantForm({...variantForm, name: e.target.value})} required />
              <input className="input" type="number" min="0" step="0.01" placeholder="Additional price" value={variantForm.additional_price} onChange={e => setVariantForm({...variantForm, additional_price: e.target.value})} />
              <input className="input" placeholder="SKU" value={variantForm.sku} onChange={e => setVariantForm({...variantForm, sku: e.target.value})} />
              <button type="submit" className="btn-primary justify-center"><Plus size={14} /> Add</button>
            </div>
          </form>
        )}

        {product.variants?.length ? (
          <table className="w-full">
            <thead><tr className="border-b border-gray-100">
              <th className="table-header">Variant</th>
              <th className="table-header">Additional Price</th>
              <th className="table-header">Total Price</th>
              <th className="table-header">SKU</th>
              <th className="table-header">Status</th>
            </tr></thead>
            <tbody>
              {product.variants.map(v => (
                <tr key={v.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="table-cell font-semibold">{v.name}</td>
                  <td className="table-cell text-blue-600">{fmt(v.additional_price)}</td>
                  <td className="table-cell font-semibold">{fmt(parseFloat(product.sales_price) + parseFloat(v.additional_price))}</td>
                  <td className="table-cell text-gray-400">{v.sku || '—'}</td>
                  <td className="table-cell">{v.is_active ? <span className="badge-success">Active</span> : <span className="badge-gray">Inactive</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">No variants yet. Add one above.</div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
