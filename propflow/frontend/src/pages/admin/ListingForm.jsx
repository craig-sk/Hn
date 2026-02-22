// src/pages/admin/ListingForm.jsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listingsApi, agentsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Building2 } from 'lucide-react';

const TYPES = ['office','industrial','retail','warehouse','mixed_use','agricultural'];
const LISTING_TYPES = ['to_let','for_sale'];
const STATUSES = ['draft','active','featured','pending'];
const PROVINCES = ['Western Cape','Gauteng','KwaZulu-Natal','Eastern Cape','Limpopo','Mpumalanga','North West','Free State','Northern Cape'];

export default function ListingForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuthStore();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { status: 'draft', type: 'office', listing_type: 'to_let', price_unit: 'per_month' }
  });

  // Load existing if editing
  const { data: existing } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingsApi.getById(id).then(r => r.data.listing),
    enabled: isEdit,
  });

  const { data: agentsData } = useQuery({
    queryKey: ['agents'],
    queryFn: () => agentsApi.getAll().then(r => r.data),
    enabled: user?.role === 'admin',
  });

  useEffect(() => {
    if (existing) reset(existing);
  }, [existing, reset]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? listingsApi.update(id, data) : listingsApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Listing updated' : 'Listing created');
      qc.invalidateQueries(['admin-listings']);
      navigate('/admin/listings');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to save listing'),
  });

  return (
    <div className="p-6 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/listings" className="btn-ghost p-2 rounded-lg"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="text-xl font-800 text-gray-900">{isEdit ? 'Edit Listing' : 'New Listing'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{isEdit ? `Editing: ${existing?.title || '…'}` : 'Fill in the property details below'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="space-y-5">
        {/* Basic Info */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-700 text-gray-800 mb-1">
            <Building2 className="w-4 h-4 text-blue-600" /> Property Details
          </div>
          <div>
            <label className="label">Property Title *</label>
            <input {...register('title', { required: 'Title is required', minLength: { value: 5, message: 'Min 5 characters' } })} className="input" placeholder="e.g. Modern Office Suite – Waterfront Cape Town" />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Property Type *</label>
              <select {...register('type', { required: true })} className="input">
                {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Listing Type *</label>
              <select {...register('listing_type', { required: true })} className="input">
                {LISTING_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Price (R) *</label>
              <input {...register('price', { required: 'Price required', min: { value: 0, message: 'Must be positive' } })} className="input" type="number" placeholder="45000" />
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <label className="label">Price Unit</label>
              <select {...register('price_unit')} className="input">
                <option value="per_month">Per Month</option>
                <option value="per_sqm">Per m² / month</option>
                <option value="total">Total (Sale)</option>
              </select>
            </div>
            <div>
              <label className="label">Size (m²) *</label>
              <input {...register('size_sqm', { required: 'Size required', min: 1 })} className="input" type="number" placeholder="420" />
              {errors.size_sqm && <p className="text-xs text-red-500 mt-1">{errors.size_sqm.message}</p>}
            </div>
            <div>
              <label className="label">Status</label>
              <select {...register('status')} className="input">
                {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="card p-5 space-y-4">
          <div className="text-sm font-700 text-gray-800 mb-1">📍 Location</div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="label">Street / Area *</label>
              <input {...register('location', { required: true })} className="input" placeholder="123 Buitenkant Street" />
            </div>
            <div>
              <label className="label">City *</label>
              <input {...register('city', { required: true })} className="input" placeholder="Cape Town" />
            </div>
            <div>
              <label className="label">Suburb</label>
              <input {...register('suburb')} className="input" placeholder="Gardens" />
            </div>
            <div>
              <label className="label">Province *</label>
              <select {...register('province', { required: true })} className="input">
                <option value="">Select province…</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Postal Code</label>
              <input {...register('postal_code')} className="input" placeholder="8001" />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="card p-5">
          <label className="label">Description</label>
          <textarea {...register('description')} className="input" rows={5} placeholder="Describe the property, key features, nearby amenities, transport links…" />
        </div>

        {/* Assignment (admin only) */}
        {user?.role === 'admin' && (
          <div className="card p-5">
            <div className="text-sm font-700 text-gray-800 mb-3">Agent Assignment</div>
            <div>
              <label className="label">Assign to Agent</label>
              <select {...register('agent_id')} className="input">
                <option value="">Assign to me</option>
                {(agentsData?.agents || []).map(a => (
                  <option key={a.id} value={a.id}>{a.full_name} ({a.email})</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link to="/admin/listings" className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary" disabled={isSubmitting || mutation.isPending}>
            <Save className="w-4 h-4" />
            {isSubmitting || mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Listing'}
          </button>
        </div>
      </form>
    </div>
  );
}
