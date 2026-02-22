// src/pages/admin/Listings.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listingsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Plus, Search, Filter, Eye, Pencil, Trash2,
  Building2, MoreVertical, RefreshCw
} from 'lucide-react';

const STATUS_BADGE = {
  active:   'badge-green',
  featured: 'badge-purple',
  pending:  'badge-amber',
  draft:    'badge-gray',
  let:      'badge-blue',
  sold:     'badge-blue',
  archived: 'badge-gray',
};

const STATUS_OPTIONS = ['all','active','featured','pending','draft','archived'];

export default function Listings() {
  const [search, setSearch] = useState('');
  const [status, setStatus]     = useState('all');
  const [page, setPage]         = useState(1);
  const [deleteId, setDeleteId] = useState(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-listings', { search, status, page }],
    queryFn: () => listingsApi.getAdmin({
      page, limit: 15,
      ...(search ? { search } : {}),
      ...(status !== 'all' ? { status } : {}),
    }).then(r => r.data),
    keepPreviousData: true,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => listingsApi.delete(id),
    onSuccess: () => {
      toast.success('Listing deleted');
      qc.invalidateQueries(['admin-listings']);
      setDeleteId(null);
    },
    onError: () => toast.error('Failed to delete listing'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => listingsApi.updateStatus(id, status),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries(['admin-listings']); },
    onError: () => toast.error('Failed to update status'),
  });

  const listings = data?.listings || [];
  const pagination = data?.pagination || {};

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-800 text-gray-900">Listings</h1>
          <p className="text-sm text-gray-500 mt-0.5">{pagination.total || 0} total properties</p>
        </div>
        <Link to="/admin/listings/new" className="btn-primary">
          <Plus className="w-4 h-4" /> New Listing
        </Link>
      </div>

      {/* Toolbar */}
      <div className="card">
        <div className="flex flex-wrap gap-3 p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-48">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              className="bg-transparent text-sm outline-none w-full placeholder-gray-400"
              placeholder="Search listings…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => { setStatus(s); setPage(1); }}
                className={`px-3 py-2 rounded-lg text-xs font-600 transition-all capitalize
                  ${status === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            onClick={() => qc.invalidateQueries(['admin-listings'])}
            className="btn-secondary p-2"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Property','Type','Size','Price','Status','Agent','Enquiries','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-700 text-gray-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && [...Array(5)].map((_,i) => (
                <tr key={i} className="border-b border-gray-50 animate-pulse">
                  {[...Array(8)].map((_,j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded" /></td>
                  ))}
                </tr>
              ))}
              {!isLoading && listings.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
                  No listings found. <Link to="/admin/listings/new" className="text-blue-600 hover:underline">Create one →</Link>
                </td></tr>
              )}
              {listings.map(listing => (
                <tr key={listing.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-sm font-600 text-gray-900 max-w-48 truncate">{listing.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{listing.city}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-600 capitalize">{listing.type?.replace('_',' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{listing.size_sqm} m²</td>
                  <td className="px-4 py-3 text-sm font-600 text-gray-800 whitespace-nowrap">
                    R{listing.price?.toLocaleString()}
                    <span className="text-xs text-gray-400 font-400">/mo</span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={listing.status}
                      onChange={e => statusMutation.mutate({ id: listing.id, status: e.target.value })}
                      className={`badge ${STATUS_BADGE[listing.status] || 'badge-gray'} cursor-pointer border-0 bg-transparent capitalize text-xs`}
                    >
                      {Object.keys(STATUS_BADGE).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {listing.agent ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-700 text-blue-700">
                          {listing.agent.full_name?.split(' ').map(n=>n[0]).join('').slice(0,2)}
                        </div>
                        <span className="text-xs text-gray-600 truncate max-w-24">{listing.agent.full_name}</span>
                      </div>
                    ) : <span className="text-xs text-gray-300">Unassigned</span>}
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-600 text-gray-700">
                    {listing.enquiry_count || 0}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link to={`/properties/${listing.id}`} className="btn-ghost p-1.5 rounded-lg" title="View public">
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <Link to={`/admin/listings/${listing.id}/edit`} className="btn-ghost p-1.5 rounded-lg" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => setDeleteId(listing.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} results
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p-1)}
                className="btn-secondary text-xs py-1.5 disabled:opacity-40"
              >← Prev</button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(p => p+1)}
                className="btn-secondary text-xs py-1.5 disabled:opacity-40"
              >Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-modal">
            <h3 className="text-base font-700 text-gray-900 mb-2">Delete Listing?</h3>
            <p className="text-sm text-gray-600 mb-5">This action cannot be undone. All associated enquiries will be unlinked.</p>
            <div className="flex gap-3 justify-end">
              <button className="btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button
                className="btn-danger"
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete Listing'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
