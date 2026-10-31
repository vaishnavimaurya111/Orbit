import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invoiceAPI, paymentAPI } from '../../services/api';
import { ArrowLeft, CreditCard, Download, X, Printer } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);
const statusColors = { draft: 'badge-gray', confirmed: 'badge-info', partially_paid: 'badge-warning', paid: 'badge-success', overdue: 'badge-danger', cancelled: 'badge-gray' };

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payForm, setPayForm] = useState({ amount: 0, payment_method: 'bank_transfer', payment_date: new Date().toISOString().split('T')[0], notes: '' });

  const load = async () => {
    setLoading(true);
    try { const res = await invoiceAPI.getById(id); setInvoice(res.data); setPayForm(f => ({ ...f, amount: Number(res.data.outstanding_balance) || 0 })); }
    catch { navigate('/invoices'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const recordPayment = async (e) => {
    e.preventDefault();
    try {
      await paymentAPI.record({ invoice_id: id, ...payForm, amount: parseFloat(payForm.amount) });
      setShowPayModal(false);
      load();
    } catch (err) { alert(err.response?.data?.error || 'Payment failed'); }
  };

  const printInvoice = () => {
    window.print();
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!invoice) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap print:hidden">
        <button onClick={() => navigate('/invoices')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="page-title">{invoice.invoice_number}</h1>
            <span className={statusColors[invoice.status] || 'badge-gray'}>{invoice.status?.replace('_', ' ')}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {['confirmed','partially_paid','overdue'].includes(invoice.status) && (
            <button onClick={() => setShowPayModal(true)} className="btn-primary"><CreditCard size={16} /> Record Payment</button>
          )}
          <button onClick={printInvoice} className="btn-secondary"><Printer size={16} /> Print</button>
        </div>
      </div>

      {/* Invoice Card */}
      <div className="card max-w-4xl mx-auto" id="invoice-print">
        {/* Invoice Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-black text-xl">S</span>
              </div>
              <div>
                <div className="font-bold text-xl text-gray-900">SubscriptIQ</div>
                <div className="text-sm text-gray-500">Smart Subscriptions. Simplified Billing.</div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-gray-900">INVOICE</h2>
            <p className="text-xl font-semibold text-blue-700 mt-1">{invoice.invoice_number}</p>
            <span className={`mt-2 inline-block ${statusColors[invoice.status] || 'badge-gray'}`}>{invoice.status?.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Bill To / Info */}
        <div className="grid grid-cols-2 gap-8 mb-8 p-5 bg-gray-50 rounded-xl">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Bill To</p>
            <p className="font-bold text-gray-900">{invoice.customer_name}</p>
            {invoice.company_name && <p className="text-gray-600 text-sm">{invoice.company_name}</p>}
            {invoice.customer_email && <p className="text-gray-500 text-sm">{invoice.customer_email}</p>}
            {invoice.billing_address && <p className="text-gray-500 text-sm mt-1">{invoice.billing_address}</p>}
            {(invoice.city || invoice.state) && <p className="text-gray-500 text-sm">{[invoice.city, invoice.state].filter(Boolean).join(', ')}</p>}
            {invoice.gst_number && <p className="text-gray-500 text-sm">GST: {invoice.gst_number}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Invoice Details</p>
            {invoice.subscription_number && <p className="text-sm text-gray-600">Subscription: <span className="font-semibold">{invoice.subscription_number}</span></p>}
            {invoice.billing_period_start && <p className="text-sm text-gray-600">Period: <span className="font-semibold">{new Date(invoice.billing_period_start).toLocaleDateString('en-IN')} – {new Date(invoice.billing_period_end).toLocaleDateString('en-IN')}</span></p>}
            <p className="text-sm text-gray-600">Issue Date: <span className="font-semibold">{new Date(invoice.created_at).toLocaleDateString('en-IN')}</span></p>
            {invoice.due_date && <p className={`text-sm ${new Date(invoice.due_date) < new Date() && invoice.status !== 'paid' ? 'text-red-600 font-bold' : 'text-gray-600'}`}>Due: <span className="font-semibold">{new Date(invoice.due_date).toLocaleDateString('en-IN')}</span></p>}
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-6">
          <table className="w-full">
            <thead><tr className="bg-gray-900 text-white rounded-lg">
              <th className="py-3 px-4 text-left text-sm font-semibold rounded-l-lg">Description</th>
              <th className="py-3 px-4 text-center text-sm font-semibold">Qty</th>
              <th className="py-3 px-4 text-right text-sm font-semibold">Unit Price</th>
              <th className="py-3 px-4 text-right text-sm font-semibold rounded-r-lg">Amount</th>
            </tr></thead>
            <tbody>
              {invoice.items?.map((item, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-gray-900 text-sm">{item.description || item.product_name}</div>
                    {item.variant_name && <div className="text-xs text-gray-400">{item.variant_name}</div>}
                  </td>
                  <td className="py-3.5 px-4 text-center text-sm text-gray-600">{item.quantity}</td>
                  <td className="py-3.5 px-4 text-right text-sm text-gray-600">{fmt(item.unit_price)}</td>
                  <td className="py-3.5 px-4 text-right font-semibold text-sm">{fmt(item.total_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-semibold">{fmt(invoice.subtotal)}</span></div>
            {invoice.discount_amount > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Discount {invoice.discount_name ? `(${invoice.discount_name})` : ''}</span><span className="text-emerald-600 font-semibold">- {fmt(invoice.discount_amount)}</span></div>}
            {invoice.tax_amount > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Tax {invoice.tax_name ? `(${invoice.tax_name})` : ''}</span><span className="font-semibold">{fmt(invoice.tax_amount)}</span></div>}
            <div className="border-t-2 border-gray-900 pt-2 flex justify-between font-bold text-lg"><span>Total</span><span>{fmt(invoice.total)}</span></div>
            {invoice.amount_paid > 0 && <div className="flex justify-between text-sm"><span className="text-emerald-600">Amount Paid</span><span className="text-emerald-600 font-semibold">- {fmt(invoice.amount_paid)}</span></div>}
            <div className={`flex justify-between font-bold text-base pt-1 ${Number(invoice.outstanding_balance) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              <span>Balance Due</span><span>{fmt(invoice.outstanding_balance)}</span>
            </div>
          </div>
        </div>

        {/* Payment History */}
        {invoice.payments?.length > 0 && (
          <div className="mt-8 pt-6 border-t">
            <h4 className="font-bold text-gray-900 mb-3">Payment History</h4>
            <table className="w-full text-sm">
              <thead><tr className="border-b"><th className="text-left py-2 text-gray-500 font-medium">Reference</th><th className="text-left py-2 text-gray-500 font-medium">Method</th><th className="text-left py-2 text-gray-500 font-medium">Date</th><th className="text-right py-2 text-gray-500 font-medium">Amount</th></tr></thead>
              <tbody>
                {invoice.payments.map(p => (
                  <tr key={p.id} className="border-b border-gray-50">
                    <td className="py-2 font-medium">{p.payment_reference}</td>
                    <td className="py-2 capitalize text-gray-600">{p.payment_method?.replace('_', ' ')}</td>
                    <td className="py-2 text-gray-600">{new Date(p.payment_date).toLocaleDateString('en-IN')}</td>
                    <td className="py-2 text-right font-semibold text-emerald-600">{fmt(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-lg font-bold">Record Payment</h2>
                <p className="text-sm text-gray-500">Outstanding: {fmt(invoice.outstanding_balance)}</p>
              </div>
              <button onClick={() => setShowPayModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={recordPayment} className="p-6 space-y-4">
              <div><label className="label">Amount (₹) *</label><input className="input" type="number" min="0.01" step="0.01" max={invoice.outstanding_balance} value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} required /></div>
              <div><label className="label">Method *</label>
                <select className="input" value={payForm.payment_method} onChange={e => setPayForm({ ...payForm, payment_method: e.target.value })}>
                  <option value="cash">Cash</option><option value="bank_transfer">Bank Transfer</option><option value="upi">UPI</option><option value="card">Card</option><option value="cheque">Cheque</option><option value="other">Other</option>
                </select>
              </div>
              <div><label className="label">Date *</label><input className="input" type="date" value={payForm.payment_date} onChange={e => setPayForm({ ...payForm, payment_date: e.target.value })} required /></div>
              <div><label className="label">Notes</label><textarea className="input" rows={2} value={payForm.notes} onChange={e => setPayForm({ ...payForm, notes: e.target.value })} /></div>
              <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowPayModal(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary"><CreditCard size={16} /> Record</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetail;
