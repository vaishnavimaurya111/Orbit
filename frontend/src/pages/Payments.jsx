import { useState, useEffect } from 'react';
import { paymentAPI } from '../../services/api';
import { Search, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const methodColors = { cash: 'badge-success', bank_transfer: 'badge-info', upi: 'badge-purple', card: 'badge-warning', cheque: 'badge-gray', other: 'badge-gray' };

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try { const res = await paymentAPI.list({ limit: 100 }); setPayments(res.data.data || []); }
    catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = payments.filter(p =>
    !search || p.payment_reference?.toLowerCase().includes(search.toLowerCase()) ||
    p.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.invoice_number?.toLowerCase().includes(search.toLowerCase())
  );

  const totalAmount = filtered.reduce((a, p) => a + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="text-sm text-gray-500">{filtered.length} payment records</p>
        </div>
        <div className="card py-3 px-5 bg-emerald-50 border-emerald-100">
          <p className="text-xs text-emerald-600 font-medium">Total Collected</p>
          <p className="text-xl font-bold text-emerald-700">{fmt(totalAmount)}</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="search-input" placeholder="Search payments..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12"><CreditCard size={40} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500 font-medium">No payments found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100">
                <th className="table-header">Reference</th>
                <th className="table-header">Customer</th>
                <th className="table-header">Invoice</th>
                <th className="table-header">Amount</th>
                <th className="table-header">Method</th>
                <th className="table-header">Date</th>
                <th className="table-header">Notes</th>
              </tr></thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="table-cell font-semibold text-gray-800">{p.payment_reference}</td>
                    <td className="table-cell font-medium">{p.customer_name}</td>
                    <td className="table-cell">
                      <span className="text-blue-600 hover:underline cursor-pointer text-sm" onClick={() => navigate(`/invoices/${p.invoice_id}`)}>
                        {p.invoice_number}
                      </span>
                    </td>
                    <td className="table-cell font-bold text-emerald-600">{fmt(p.amount)}</td>
                    <td className="table-cell">
                      <span className={methodColors[p.payment_method] || 'badge-gray'}>{p.payment_method?.replace('_', ' ')}</span>
                    </td>
                    <td className="table-cell">{new Date(p.payment_date).toLocaleDateString('en-IN')}</td>
                    <td className="table-cell text-gray-400 text-xs truncate max-w-[150px]">{p.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;
