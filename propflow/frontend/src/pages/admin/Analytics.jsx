// src/pages/admin/Analytics.jsx
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { Eye, TrendingUp, MessageSquare, Star } from 'lucide-react';

export default function Analytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => analyticsApi.dashboard().then(r => r.data),
  });
  const { data: topData } = useQuery({
    queryKey: ['top-listings'],
    queryFn: () => analyticsApi.topListings().then(r => r.data),
  });

  const monthlyData = Object.entries(data?.monthly_enquiries || {}).map(([month, count]) => ({ month, count }));
  const topListings = topData?.listings || [];

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div><h1 className="text-xl font-800 text-gray-900">Analytics</h1><p className="text-sm text-gray-500 mt-0.5">Platform performance overview</p></div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <div className="px-5 pt-4 pb-2 border-b border-gray-100">
            <div className="text-sm font-700">Enquiries Trend</div>
            <div className="text-xs text-gray-400">Last 6 months</div>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize:'12px', borderRadius:'8px', border:'1px solid #e2e8f0' }} />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2.5} dot={{ r:4, fill:'#3b82f6' }} name="Enquiries" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="px-5 pt-4 pb-2 border-b border-gray-100">
            <div className="text-sm font-700">Top Listings by Views</div>
          </div>
          <div className="p-5 space-y-3">
            {topListings.slice(0,5).map((listing, i) => (
              <div key={listing.id} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-800 text-white flex-shrink-0
                  ${i===0?'bg-yellow-400':i===1?'bg-gray-400':i===2?'bg-amber-600':'bg-gray-200 text-gray-500'}`}>
                  {i+1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-500 text-gray-800 truncate">{listing.title}</div>
                  <div className="text-xs text-gray-400">{listing.city}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-700 text-gray-800 flex items-center gap-1"><Eye className="w-3 h-3" />{listing.view_count?.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">{listing.enquiry_count} enq.</div>
                </div>
              </div>
            ))}
            {topListings.length === 0 && <div className="text-sm text-gray-400 text-center py-6">No data yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
