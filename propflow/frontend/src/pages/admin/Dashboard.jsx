// src/pages/admin/Dashboard.jsx
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Building2, MessageSquare, Users, TrendingUp,
  ArrowUpRight, ArrowDownRight, Clock, ChevronRight
} from 'lucide-react';

const STATUS_COLORS = {
  active: 'badge-green', featured: 'badge-purple',
  pending: 'badge-amber', draft: 'badge-gray',
  unread: 'badge-blue', read: 'badge-gray',
  in_progress: 'badge-amber', resolved: 'badge-green',
};
const PIE_COLORS = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444'];

function KPICard({ title, value, sub, icon: Icon, color, trend }) {
  const colors = {
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   bar: 'bg-blue-500' },
    green:  { bg: 'bg-emerald-50',icon: 'text-emerald-600',bar: 'bg-emerald-500' },
    amber:  { bg: 'bg-amber-50',  icon: 'text-amber-600',  bar: 'bg-amber-500' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', bar: 'bg-purple-500' },
  }[color] || colors.blue;

  const isUp = trend > 0;
  return (
    <div className="card relative overflow-hidden">
      <div className={`absolute top-0 inset-x-0 h-0.5 ${colors.bar}`} />
      <div className="card-body">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${colors.icon}`} />
          </div>
          {trend !== undefined && (
            <span className={`badge text-xs ${isUp ? 'badge-green' : 'badge-red'}`}>
              {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        <div className="text-2xl font-800 text-gray-900 mb-0.5">{value}</div>
        <div className="text-sm font-500 text-gray-700">{title}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => analyticsApi.dashboard().then(r => r.data),
  });

  const kpis = data?.kpis || {};
  const monthlyData = Object.entries(data?.monthly_enquiries || {}).map(([month, count]) => ({ month, count }));
  const typeData = Object.entries(data?.listings_by_type || {}).map(([name, value]) => ({ name, value }));
  const recentEnquiries = data?.recent_enquiries || [];

  if (isLoading) return (
    <div className="p-6 animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-48" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_,i) => <div key={i} className="h-32 bg-gray-200 rounded-xl" />)}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-800 text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Welcome back, {user?.full_name?.split(' ')[0]} · {new Date().toLocaleDateString('en-ZA', { weekday:'long', day:'numeric', month:'long' })}
          </p>
        </div>
        <Link to="/admin/listings/new" className="btn-primary text-sm">
          <Building2 className="w-4 h-4" /> New Listing
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Active Listings" value={kpis.active_listings ?? 0}  icon={Building2}     color="blue"   trend={12} sub={`${kpis.featured_listings} featured`} />
        <KPICard title="Total Enquiries" value={kpis.total_enquiries ?? 0}  icon={MessageSquare} color="green"  trend={8}  sub={`${kpis.unread_enquiries} unread`} />
        <KPICard title="Active Agents"   value={kpis.active_agents ?? '—'}  icon={Users}         color="amber"  />
        <KPICard title="Total Listings"  value={kpis.total_listings ?? 0}   icon={TrendingUp}    color="purple" trend={5} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Bar chart – 2/3 width */}
        <div className="card col-span-2">
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <div>
              <div className="text-sm font-700 text-gray-800">Enquiries Over Time</div>
              <div className="text-xs text-gray-400">Last 6 months</div>
            </div>
          </div>
          <div className="px-5 pb-4">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyData} barSize={24} margin={{ top:4, right:0, left:-20, bottom:0 }}>
                <XAxis dataKey="month" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ fontSize:'12px', borderRadius:'8px', border:'1px solid #e2e8f0', boxShadow:'0 4px 16px rgba(0,0,0,0.08)' }}
                  cursor={{ fill:'rgba(59,130,246,0.05)' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]} name="Enquiries" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie chart – 1/3 */}
        <div className="card">
          <div className="px-5 pt-4 pb-2">
            <div className="text-sm font-700 text-gray-800">Listing Types</div>
            <div className="text-xs text-gray-400">By category</div>
          </div>
          <div className="px-4 pb-4">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                  {typeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize:'11px', borderRadius:'6px' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:'11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Enquiries */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="text-sm font-700 text-gray-800">Recent Enquiries</div>
          <Link to="/admin/enquiries" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recentEnquiries.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-gray-400">No enquiries yet</div>
          )}
          {recentEnquiries.map(eq => (
            <div key={eq.id} className="flex gap-3 px-5 py-3.5 hover:bg-gray-50/80 transition-colors">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center text-xs font-700 text-white flex-shrink-0">
                {eq.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-600 text-gray-900">{eq.name}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(eq.created_at).toLocaleDateString('en-ZA')}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5 truncate">
                  📍 {eq.listing?.title || 'Unknown listing'}, {eq.listing?.city}
                </div>
                <div className="text-sm text-gray-600 mt-1 line-clamp-1">{eq.message}</div>
              </div>
              <span className={`badge self-start flex-shrink-0 ${STATUS_COLORS[eq.status] || 'badge-gray'}`}>
                {eq.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
