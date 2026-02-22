// src/pages/admin/Agents.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentsApi } from '@/lib/api';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { UserPlus, Mail, Phone, Building2, ToggleLeft, ToggleRight } from 'lucide-react';

export default function Agents() {
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset, formState:{ errors, isSubmitting } } = useForm();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => agentsApi.getAll().then(r=>r.data),
  });

  const createMutation = useMutation({
    mutationFn: agentsApi.create,
    onSuccess: () => { toast.success('Agent created and invite sent'); qc.invalidateQueries(['agents']); reset(); setShowForm(false); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create agent'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({id, is_active}) => agentsApi.updateStatus(id, is_active),
    onSuccess: () => { toast.success('Agent status updated'); qc.invalidateQueries(['agents']); },
  });

  const agents = data?.agents || [];

  return (
    <div className="p-6 animate-fade-in space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-800 text-gray-900">Agent Management</h1>
        <p className="text-sm text-gray-500 mt-0.5">{agents.length} team members</p></div>
        <button onClick={() => setShowForm(true)} className="btn-primary"><UserPlus className="w-4 h-4" /> Add Agent</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {isLoading && [...Array(6)].map((_,i) => <div key={i} className="card h-48 animate-pulse" />)}
        {agents.map(agent => (
          <div key={agent.id} className={`card p-5 ${!agent.is_active ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center text-sm font-800 text-white">
                {agent.full_name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <button onClick={() => toggleMutation.mutate({id:agent.id, is_active:!agent.is_active})}
                className={`text-sm ${agent.is_active ? 'text-emerald-500' : 'text-gray-300'}`} title="Toggle active">
                {agent.is_active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
              </button>
            </div>
            <div className="font-700 text-gray-900">{agent.full_name}</div>
            <div className="text-xs text-blue-600 font-600 uppercase tracking-wide mb-3">{agent.role}</div>
            <div className="space-y-1.5 mb-4">
              <div className="flex items-center gap-2 text-xs text-gray-500"><Mail className="w-3.5 h-3.5 flex-shrink-0" /><span className="truncate">{agent.email}</span></div>
              {agent.phone && <div className="flex items-center gap-2 text-xs text-gray-500"><Phone className="w-3.5 h-3.5" />{agent.phone}</div>}
            </div>
            <div className="flex gap-4 pt-3 border-t border-gray-100">
              <div className="text-center"><div className="text-base font-800 text-gray-900">{agent.listing_count?.[0]?.count || 0}</div><div className="text-xs text-gray-400">Listings</div></div>
              <div className="text-center"><div className="text-base font-800 text-gray-900">{agent.enquiry_count?.[0]?.count || 0}</div><div className="text-xs text-gray-400">Enquiries</div></div>
              <div className="text-center ml-auto"><span className={`badge ${agent.is_active ? 'badge-green' : 'badge-gray'}`}>{agent.is_active ? 'Active' : 'Inactive'}</span></div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Agent Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-modal">
            <h3 className="text-base font-700 mb-4">Add New Agent</h3>
            <form onSubmit={handleSubmit(d => createMutation.mutate({...d, role:'agent'}))} className="space-y-4">
              <div><label className="label">Full Name</label><input {...register('full_name',{required:true})} className="input" placeholder="John Smith" /></div>
              <div><label className="label">Email</label><input {...register('email',{required:true})} className="input" type="email" placeholder="john@agency.co.za" /></div>
              <div><label className="label">Phone</label><input {...register('phone')} className="input" placeholder="+27 82 000 0000" /></div>
              <div><label className="label">Temporary Password</label><input {...register('password',{required:true,minLength:8})} className="input" type="password" placeholder="Min 8 characters" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" className="btn-secondary flex-1" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={isSubmitting}>{isSubmitting ? 'Creating…' : 'Create Agent'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
