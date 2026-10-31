import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Package, CreditCard, FileText, BarChart3,
  Settings, LogOut, Tag, Percent, Briefcase, Receipt, ChevronRight,
  Zap, Shield, UserCheck
} from 'lucide-react';

const Logo = () => (
  <div className="flex items-center gap-3 px-2 py-1">
    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
      <span className="text-white font-black text-lg">S</span>
    </div>
    <div>
      <div className="text-white font-bold text-base leading-tight">SubscriptIQ</div>
      <div className="text-blue-300 text-[10px] leading-tight">Smart Billing</div>
    </div>
  </div>
);

const NavItem = ({ to, icon: Icon, label, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
  >
    <Icon size={17} />
    <span>{label}</span>
  </NavLink>
);

const NavSection = ({ title, children }) => (
  <div className="mb-1">
    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">{title}</div>
    {children}
  </div>
);

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';

  return (
    <aside className="w-64 min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>
      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <Logo />
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <NavSection title="Overview">
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" end />
        </NavSection>

        <NavSection title="Business">
          <NavItem to="/products" icon={Package} label="Products" />
          <NavItem to="/plans" icon={Briefcase} label="Plans" />
          <NavItem to="/customers" icon={Users} label="Customers" />
        </NavSection>

        <NavSection title="Operations">
          <NavItem to="/quotations" icon={FileText} label="Quotations" />
          <NavItem to="/subscriptions" icon={Zap} label="Subscriptions" />
          <NavItem to="/invoices" icon={Receipt} label="Invoices" />
          <NavItem to="/payments" icon={CreditCard} label="Payments" />
        </NavSection>

        <NavSection title="Configuration">
          <NavItem to="/taxes" icon={Percent} label="Taxes" />
          <NavItem to="/discounts" icon={Tag} label="Discounts" />
        </NavSection>

        <NavSection title="Insights">
          <NavItem to="/reports" icon={BarChart3} label="Reports" />
        </NavSection>

        {isAdmin && (
          <NavSection title="Admin">
            <NavItem to="/staff" icon={Shield} label="Staff Management" />
            <NavItem to="/settings" icon={Settings} label="Settings" />
          </NavSection>
        )}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">{user?.name}</div>
            <div className="text-slate-400 text-xs capitalize">{user?.role}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full mt-1 flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 text-sm"
        >
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
