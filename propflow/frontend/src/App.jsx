// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/store';

// Layouts
import AdminLayout from '@/components/admin/AdminLayout';
import PublicLayout from '@/components/public/PublicLayout';

// Admin Pages
import Dashboard     from '@/pages/admin/Dashboard';
import Listings      from '@/pages/admin/Listings';
import ListingForm   from '@/pages/admin/ListingForm';
import Enquiries     from '@/pages/admin/Enquiries';
import Agents        from '@/pages/admin/Agents';
import Analytics     from '@/pages/admin/Analytics';
import Settings      from '@/pages/admin/Settings';

// Public Pages
import Home          from '@/pages/public/Home';
import SearchResults from '@/pages/public/SearchResults';
import ListingDetail from '@/pages/public/ListingDetail';

// Auth Pages
import Login         from '@/pages/auth/Login';
import ForgotPassword from '@/pages/auth/ForgotPassword';

// Auth Guard
function RequireAuth({ children, allowedRoles }) {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/admin" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* ── Auth ── */}
      <Route path="/login"           element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* ── Admin Portal ── */}
      <Route path="/admin" element={
        <RequireAuth allowedRoles={['admin', 'agent']}>
          <AdminLayout />
        </RequireAuth>
      }>
        <Route index                    element={<Dashboard />} />
        <Route path="listings"          element={<Listings />} />
        <Route path="listings/new"      element={<ListingForm />} />
        <Route path="listings/:id/edit" element={<ListingForm />} />
        <Route path="enquiries"         element={<Enquiries />} />
        <Route path="agents"            element={
          <RequireAuth allowedRoles={['admin']}>
            <Agents />
          </RequireAuth>
        } />
        <Route path="analytics"         element={<Analytics />} />
        <Route path="settings"          element={<Settings />} />
      </Route>

      {/* ── Public Portal ── */}
      <Route path="/" element={<PublicLayout />}>
        <Route index             element={<Home />} />
        <Route path="properties" element={<SearchResults />} />
        <Route path="properties/:id" element={<ListingDetail />} />
      </Route>

      {/* ── Fallback ── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
