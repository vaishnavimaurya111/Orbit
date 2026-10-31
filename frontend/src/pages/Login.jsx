import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Zap, AlertCircle } from 'lucide-react';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'customer' ? '/portal' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (role) => {
    const creds = {
      admin: { email: 'admin@subscriptiq.com', password: 'password' },
      staff: { email: 'staff@subscriptiq.com', password: 'password' },
      customer: { email: 'customer1@example.com', password: 'password' },
    };
    setForm(creds[role]);
    setError('');
    setLoading(true);
    try {
      const user = await login(creds[role].email, creds[role].password);
      navigate(user.role === 'customer' ? '/portal' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Demo login failed - check if backend is running');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e293b 100%)' }}>
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-2xl">
              <span className="text-white font-black text-2xl">S</span>
            </div>
            <div>
              <div className="text-white font-bold text-2xl">SubscriptIQ</div>
              <div className="text-blue-300 text-sm">Smart Subscriptions. Simplified Billing.</div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
            Manage subscriptions<br />
            <span className="text-blue-400">effortlessly.</span>
          </h1>
          <p className="text-slate-300 text-lg mb-10 leading-relaxed">
            Complete subscription lifecycle management with automated billing, invoice generation, and real-time analytics.
          </p>
          <div className="space-y-4">
            {[
              '✅ Automated recurring billing engine',
              '✅ Real-time revenue analytics',
              '✅ Multi-role access control',
              '✅ Complete invoice & payment tracking',
            ].map((f, i) => (
              <div key={i} className="text-slate-300 text-sm">{f}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-xl">S</span>
            </div>
            <div>
              <div className="text-white font-bold text-xl">SubscriptIQ</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
              <p className="text-gray-500 mt-1 text-sm">Sign in to your account</p>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Email address</label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button
                id="login-btn"
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            {/* Demo credentials */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center mb-3 font-medium uppercase tracking-wide">Demo Accounts</p>
              <div className="grid grid-cols-3 gap-2">
                {['admin', 'staff', 'customer'].map(role => (
                  <button
                    key={role}
                    id={`demo-${role}`}
                    onClick={() => demoLogin(role)}
                    className="py-2 px-3 text-xs font-semibold rounded-lg border transition-colors capitalize"
                    style={{
                      admin: { borderColor: '#2563eb', color: '#2563eb', background: '#eff6ff' },
                      staff: { borderColor: '#7c3aed', color: '#7c3aed', background: '#f5f3ff' },
                      customer: { borderColor: '#059669', color: '#059669', background: '#ecfdf5' },
                    }[role]}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-4 text-center text-sm text-gray-500">
              New customer?{' '}
              <Link to="/register" className="text-blue-600 font-semibold hover:text-blue-700">Create account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
