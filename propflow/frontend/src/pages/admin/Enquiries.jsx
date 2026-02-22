// src/pages/admin/Enquiries.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enquiriesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { MessageSquare, Clock, Mail, Phone, Calendar, Building2 } from 'lucide-react';

const STATUS_OPTIONS = ['unread','read','in_progress','resolved','archived'];
const STATUS_BADGE = {
  unread:'badge-blue', read:'badge-gray', in_progress:'badge-amber', resolved:'badge-green', archived:'badge-gray'
};

export default function Enquiries() {
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['enquiries', statusFilter],
    queryFn: () => enquiriesApi.getAll({ limit:50, ...(statusFilter!=='all'?{status:statusFilter}:{}) }).then(r=>r.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({id,status}) => enquiriesApi.updateStatus(id,status),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries(['enquiries']); },
  });

  const enquiries = data?.enquiries || [];
  const selectedEnquiry = enquiries.find(e => e.id === selected);

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-800 text-gray-900">Enquiries</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data?.pagination?.total || 0} total</p>
        </div>
        <div className="flex gap-2">
          {['all',...STATUS_OPTIONS].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-600 capitalize transition-all
                ${statusFilter===s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s.replace('_',' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4 h-[calc(100vh-180px)]">
        {/* List */}
        <div className="col-span-2 card overflow-y-auto">
          {isLoading && [...Array(5)].map((_,i) => (
            <div key={i} className="p-4 border-b border-gray-50 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2 w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
          {enquiries.map(eq => (
            <div key={eq.id}
              onClick={() => { setSelected(eq.id); if(eq.status==='unread') statusMutation.mutate({id:eq.id,status:'read'}); }}
              className={`p-4 border-b border-gray-50 cursor-pointer transition-colors hover:bg-blue-50/40
                ${selected===eq.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}
                ${eq.status==='unread' ? 'bg-blue-50/20' : ''}`}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center text-xs font-700 text-white flex-shrink-0">
                  {eq.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-600 text-gray-900 truncate">{eq.name}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">{new Date(eq.created_at).toLocaleDateString('en-ZA')}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">📍 {eq.listing?.title}</div>
                  <div className="text-xs text-gray-600 mt-1 line-clamp-2">{eq.message}</div>
                </div>
                {eq.status === 'unread' && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
              </div>
            </div>
          ))}
          {!isLoading && enquiries.length === 0 && (
            <div className="p-12 text-center text-sm text-gray-400">
              <MessageSquare className="w-8 h-8 mx-auto mb-3 text-gray-200" />
              No enquiries found
            </div>
          )}
        </div>

        {/* Detail */}
        <div className="col-span-3 card overflow-y-auto">
          {!selectedEnquiry ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-300">
              <MessageSquare className="w-12 h-12 mb-3" />
              <p className="text-sm">Select an enquiry to view details</p>
            </div>
          ) : (
            <div className="p-5">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-lg font-700 text-gray-900">{selectedEnquiry.name}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Enquiry received {new Date(selectedEnquiry.created_at).toLocaleString('en-ZA')}</p>
                </div>
                <select
                  value={selectedEnquiry.status}
                  onChange={e => statusMutation.mutate({ id:selectedEnquiry.id, status:e.target.value })}
                  className={`badge cursor-pointer ${STATUS_BADGE[selectedEnquiry.status]} capitalize`}
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div><div className="text-xs text-gray-400 mb-0.5">Email</div><a href={`mailto:${selectedEnquiry.email}`} className="text-sm text-blue-600 hover:underline">{selectedEnquiry.email}</a></div>
                </div>
                {selectedEnquiry.phone && (
                  <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div><div className="text-xs text-gray-400 mb-0.5">Phone</div><a href={`tel:${selectedEnquiry.phone}`} className="text-sm text-gray-700">{selectedEnquiry.phone}</a></div>
                  </div>
                )}
                <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <div><div className="text-xs text-gray-400 mb-0.5">Property</div><p className="text-sm text-gray-700">{selectedEnquiry.listing?.title || '—'}</p></div>
                </div>
                {selectedEnquiry.viewing_requested && (
                  <div className="bg-amber-50 rounded-lg p-3 flex items-center gap-2.5 border border-amber-100">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    <div><div className="text-xs text-amber-600 mb-0.5 font-600">Viewing Requested</div>
                    <p className="text-sm text-gray-700">{selectedEnquiry.viewing_date ? new Date(selectedEnquiry.viewing_date).toLocaleDateString('en-ZA') : 'Date TBC'}</p></div>
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs font-700 text-gray-500 uppercase tracking-wide mb-2">Message</div>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed">{selectedEnquiry.message}</div>
              </div>

              <div className="flex gap-3 mt-5">
                <a href={`mailto:${selectedEnquiry.email}`} className="btn-primary flex-1 justify-center">
                  <Mail className="w-4 h-4" /> Reply by Email
                </a>
                {selectedEnquiry.phone && (
                  <a href={`tel:${selectedEnquiry.phone}`} className="btn-secondary flex-1 justify-center">
                    <Phone className="w-4 h-4" /> Call
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
