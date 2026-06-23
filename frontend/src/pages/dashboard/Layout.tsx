import { useState } from 'react';
import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ShoppingCart, Package, Image, Users,
  Settings, LogOut, Menu, X, ExternalLink, Bell, ShieldCheck
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Overview', icon: <LayoutDashboard size={17} />, end: true },
  { to: '/dashboard/orders', label: 'Orders', icon: <ShoppingCart size={17} /> },
  { to: '/dashboard/products', label: 'Products', icon: <Package size={17} /> },
  { to: '/dashboard/banners', label: 'Banners', icon: <Image size={17} /> },
  { to: '/dashboard/customers', label: 'Customers', icon: <Users size={17} /> },
  { to: '/dashboard/settings', label: 'Settings', icon: <Settings size={17} /> },
];

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Guard: only agents can access dashboard
  if (!user) return <Navigate to="/account/login?redirect=/dashboard" replace />;
  if (user.role !== 'agent') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <ShieldCheck size={48} className="text-obsidian-200 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-semibold text-obsidian-900 mb-2">Access Denied</h2>
          <p className="text-obsidian-500 text-sm mb-6">You need agent privileges to access the dashboard.</p>
          <button onClick={() => navigate('/')} className="btn-primary text-xs py-3 px-6">
            Back to Store
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out');
    navigate('/');
  };

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-obsidian-900 text-white">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-obsidian-700">
        <span className="font-display text-xl font-bold">
          FASHION<span className="text-luxe-400">WORLD</span>
        </span>
        <p className="text-[10px] text-obsidian-400 tracking-widest uppercase mt-0.5">Admin Dashboard</p>
      </div>

      {/* Agent info */}
      <div className="px-5 py-4 border-b border-obsidian-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gold-400 rounded-full flex items-center justify-center text-xs font-bold text-obsidian-900 flex-shrink-0">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.firstName} {user.lastName}</p>
            <p className="text-[11px] text-obsidian-400 truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <p className="px-5 text-[10px] font-bold tracking-[0.2em] uppercase text-obsidian-500 mb-2">Menu</p>
        {NAV_ITEMS.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all duration-150 border-l-2 ${
                isActive
                  ? 'border-luxe-400 bg-obsidian-800 text-white'
                  : 'border-transparent text-obsidian-300 hover:bg-obsidian-800 hover:text-white'
              }`
            }
          >
            <span className="flex-shrink-0">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer actions */}
      <div className="py-3 border-t border-obsidian-700">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-5 py-2.5 text-sm text-obsidian-300 hover:text-white hover:bg-obsidian-800 transition-colors"
        >
          <ExternalLink size={15} />
          View Store
        </a>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-5 py-2.5 text-sm text-obsidian-300 hover:text-red-400 hover:bg-obsidian-800 transition-colors"
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-obsidian-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-56 xl:w-64 flex-shrink-0 flex-col">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col lg:hidden"
            >
              <Sidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-obsidian-100 px-4 lg:px-6 h-14 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden btn-ghost p-2"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center text-xs text-obsidian-400 gap-1.5">
              <ShieldCheck size={13} className="text-gold-400" />
              <span>Agent Panel</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="btn-ghost p-2 relative" aria-label="Notifications">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="w-7 h-7 bg-gold-400 rounded-full flex items-center justify-center text-[11px] font-bold text-obsidian-900">
              {user.firstName[0]}{user.lastName[0]}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
