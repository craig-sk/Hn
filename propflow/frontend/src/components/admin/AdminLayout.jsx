// src/components/admin/AdminLayout.jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore, useUIStore } from '@/lib/store';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Building2, MessageSquare, Users,
  BarChart3, Settings, LogOut, Menu, X, ChevronRight, Shield
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard',    to: '/admin',          icon: LayoutDashboard, end: true },
  { label: 'Listings',     to: '/admin/listings', icon: Building2 },
  { label: 'Enquiries',    to: '/admin/enquiries',icon: MessageSquare, badge: 'unread' },
  { label: 'Agents',       to: '/admin/agents',   icon: Users, adminOnly: true },
  { label: 'Analytics',    to: '/admin/analytics',icon: BarChart3 },
  { label: 'Settings',     to: '/admin/settings', icon: Settings },
];

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const initials = user?.full_name
    ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* ── Sidebar ── */}
      <aside className={`
        flex flex-col bg-slate-950 transition-all duration-300 flex-shrink-0
        ${sidebarCollapsed ? 'w-16' : 'w-56'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          {!sidebarCollapsed && (
            <span className="text-white font-800 text-sm tracking-tight">PropFlow</span>
          )}
          <button
            onClick={toggleSidebar}
            className="ml-auto text-slate-500 hover:text-white transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* User Card */}
        {!sidebarCollapsed && (
          <div className="mx-3 mt-4 p-3 bg-white/5 rounded-lg flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center text-xs font-700 text-white flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-600 text-white truncate">{user?.full_name}</div>
              <div className="text-xs text-slate-400 capitalize">{user?.role}</div>
            </div>
            <div className="ml-auto">
              <Shield className="w-3 h-3 text-blue-400" />
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 mt-2">
          {NAV_ITEMS.filter(item => !item.adminOnly || user?.role === 'admin').map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-2' : ''}`
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={handleLogout}
            className={`sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
