import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Admin / Staff Pages
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Plans from './pages/Plans';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Quotations from './pages/Quotations';
import Subscriptions from './pages/Subscriptions';
import SubscriptionDetail from './pages/SubscriptionDetail';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import Payments from './pages/Payments';
import TaxesDiscounts from './pages/TaxesDiscounts';
import Reports from './pages/Reports';
import Staff from './pages/Staff';
import Settings from './pages/Settings';

// Customer Portal
import CustomerPortal from './pages/CustomerPortal';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Customer Portal */}
          <Route path="/portal" element={
            <ProtectedRoute roles={['customer', 'admin', 'staff']}>
              <CustomerPortal />
            </ProtectedRoute>
          } />

          {/* Admin / Staff Routes */}
          <Route path="/" element={
            <ProtectedRoute roles={['admin', 'staff']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* Products */}
            <Route path="products" element={<Products />} />
            <Route path="products/:id" element={<ProductDetail />} />

            {/* Plans */}
            <Route path="plans" element={<Plans />} />

            {/* Customers */}
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerDetail />} />

            {/* Quotations */}
            <Route path="quotations" element={<Quotations />} />

            {/* Subscriptions */}
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="subscriptions/:id" element={<SubscriptionDetail />} />

            {/* Invoices */}
            <Route path="invoices" element={<Invoices />} />
            <Route path="invoices/:id" element={<InvoiceDetail />} />

            {/* Payments */}
            <Route path="payments" element={<Payments />} />

            {/* Taxes & Discounts */}
            <Route path="taxes" element={<TaxesDiscounts />} />
            <Route path="discounts" element={<Navigate to="/taxes" replace />} />

            {/* Reports */}
            <Route path="reports" element={<Reports />} />

            {/* Admin only */}
            <Route path="staff" element={
              <ProtectedRoute roles={['admin']}>
                <Staff />
              </ProtectedRoute>
            } />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
