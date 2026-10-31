import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { User, Save, AlertCircle, CheckCircle } from 'lucide-react';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', current_password: '', new_password: '', confirm_password: '' });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) setForm(f => ({ ...f, name: user.name || '', email: user.email || '' }));
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (form.new_password && form.new_password !== form.confirm_password) {
      return setMsg({ type: 'error', text: 'New passwords do not match' });
    }
    setLoading(true);
    try {
      const payload = { name: form.name };
      if (form.current_password && form.new_password) {
        payload.current_password = form.current_password;
        payload.new_password = form.new_password;
      }
      const res = await authAPI.updateProfile(payload);
      updateUser({ ...user, name: res.data.name });
      setMsg({ type: 'success', text: 'Profile updated successfully!' });
      setForm(f => ({ ...f, current_password: '', new_password: '', confirm_password: '' }));
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Update failed' });
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="text-sm text-gray-500">Manage your profile and account settings</p>
      </div>

      <div className="card">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center">
            <span className="text-white text-2xl font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h2 className="font-bold text-xl text-gray-900">{user?.name}</h2>
            <p className="text-gray-500">{user?.email}</p>
            <span className={`mt-1 inline-block badge ${user?.role === 'admin' ? 'badge-danger' : user?.role === 'staff' ? 'badge-info' : 'badge-success'}`}>{user?.role}</span>
          </div>
        </div>

        {msg && (
          <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 text-sm ${msg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
            {msg.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="font-semibold text-gray-900">Profile Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Full Name *</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div><label className="label">Email</label><input className="input" value={form.email} disabled className="input bg-gray-50 text-gray-400 cursor-not-allowed" /></div>
          </div>

          <h3 className="font-semibold text-gray-900 pt-4 border-t">Change Password</h3>
          <p className="text-xs text-gray-400">Leave blank to keep current password</p>
          <div className="grid grid-cols-1 gap-4">
            <div><label className="label">Current Password</label><input className="input" type="password" value={form.current_password} onChange={e => setForm({ ...form, current_password: e.target.value })} placeholder="Enter current password" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">New Password</label><input className="input" type="password" value={form.new_password} onChange={e => setForm({ ...form, new_password: e.target.value })} placeholder="Min 8 characters" /></div>
              <div><label className="label">Confirm New Password</label><input className="input" type="password" value={form.confirm_password} onChange={e => setForm({ ...form, confirm_password: e.target.value })} placeholder="Repeat new password" /></div>
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* App Info */}
      <div className="card bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-3">Application Info</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-gray-500">Application</p><p className="font-semibold">SubscriptIQ</p></div>
          <div><p className="text-gray-500">Version</p><p className="font-semibold">1.0.0</p></div>
          <div><p className="text-gray-500">Backend</p><p className="font-semibold">Node.js + Express + PostgreSQL</p></div>
          <div><p className="text-gray-500">Frontend</p><p className="font-semibold">React 18 + Vite + Tailwind</p></div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
