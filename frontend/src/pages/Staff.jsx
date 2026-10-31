import { useState, useEffect } from 'react';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Shield, Plus, ToggleLeft, ToggleRight, X, User } from 'lucide-react';

const StaffModal = ({ open, onClose, onSave }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' });
  useEffect(() => { if (!open) setForm({ name: '', email: '', password: '', role: 'staff' }); }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold">Add Staff / Admin</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="p-6 space-y-4">
          <div><label className="label">Name *</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
          <div><label className="label">Email *</label><input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
          <div><label className="label">Password *</label><input className="input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" required /></div>
          <div><label className="label">Role *</label>
            <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary"><Plus size={16} /> Add User</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const roleColors = { admin: 'badge-danger', staff: 'badge-info', customer: 'badge-success' };

const Staff = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const { user: currentUser } = useAuth();

  const load = async () => {
    setLoading(true);
    try { const res = await authAPI.listUsers(); setUsers(res.data || []); }
    catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (form) => {
    try { await authAPI.registerStaff(form); setModalOpen(false); load(); }
    catch (err) { alert(err.response?.data?.error || 'Save failed'); }
  };

  const toggleUser = async (id) => {
    try { await authAPI.toggleUser(id); load(); }
    catch (err) { alert(err.response?.data?.error || 'Action failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Management</h1>
          <p className="text-sm text-gray-500">{users.length} users</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={16} /> Add User</button>
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
        ) : (
          <table className="w-full">
            <thead><tr className="border-b border-gray-100">
              <th className="table-header">User</th><th className="table-header">Role</th>
              <th className="table-header">Status</th><th className="table-header">Joined</th><th className="table-header">Actions</th>
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/80">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">{u.name?.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{u.name} {u.id === currentUser?.id ? <span className="text-xs text-blue-500">(you)</span> : ''}</div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell"><span className={roleColors[u.role] || 'badge-gray'}>{u.role}</span></td>
                  <td className="table-cell">{u.is_active ? <span className="badge-success">Active</span> : <span className="badge-gray">Inactive</span>}</td>
                  <td className="table-cell text-sm text-gray-500">{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="table-cell">
                    {u.id !== currentUser?.id && (
                      <button onClick={() => toggleUser(u.id)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Toggle Status">
                        {u.is_active ? <ToggleRight size={16} className="text-emerald-500" /> : <ToggleLeft size={16} />}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <StaffModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} />
    </div>
  );
};

export default Staff;
