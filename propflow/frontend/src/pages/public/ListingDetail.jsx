// src/pages/public/ListingDetail.jsx
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { listingsApi, enquiriesApi } from '@/lib/api';
import { useUIStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { MapPin, Maximize2, Phone, Mail, MessageCircle, ArrowLeft, Calendar, Building2 } from 'lucide-react';

const TYPE_COLORS = {
  office:'from-blue-900 to-blue-700', industrial:'from-emerald-900 to-emerald-700',
  retail:'from-purple-900 to-purple-700', warehouse:'from-amber-900 to-amber-700',
};

export default function ListingDetail() {
  const { id } = useParams();
  const { openChat } = useUIStore();

  const { data, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingsApi.getById(id).then(r => r.data.listing),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitSuccessful } } = useForm();

  const enquiryMutation = useMutation({
    mutationFn: (d) => enquiriesApi.submit({ ...d, listing_id: id }),
    onSuccess: () => { toast.success('Enquiry sent! The agent will contact you soon.'); reset(); },
    onError: () => toast.error('Failed to send enquiry. Please try again.'),
  });

  if (isLoading) return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-pulse">
      <div className="h-64 bg-gray-200 rounded-2xl mb-8" />
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-4"><div className="h-8 bg-gray-200 rounded w-3/4" /><div className="h-4 bg-gray-200 rounded w-1/2" /></div>
      </div>
    </div>
  );

  if (!data) return (
    <div className="max-w-5xl mx-auto px-6 py-16 text-center">
      <Building2 className="w-12 h-12 mx-auto text-gray-200 mb-4" />
      <h1 className="text-xl font-700 text-gray-800">Listing not found</h1>
      <Link to="/properties" className="btn-primary mt-4 inline-flex">← Back to Search</Link>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-fade-in">
      <Link to="/properties" className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to results
      </Link>

      {/* Hero image placeholder */}
      <div className={`h-64 rounded-2xl bg-gradient-to-br ${TYPE_COLORS[data.type]||'from-blue-900 to-blue-700'} flex items-center justify-center mb-8 relative overflow-hidden`}>
        <div className="text-9xl opacity-5 font-900 text-white select-none">{data.type?.slice(0,2).toUpperCase()}</div>
        {data.status === 'featured' && (
          <div className="absolute top-4 left-4 badge bg-purple-600 text-white">⭐ Featured Listing</div>
        )}
        <div className="absolute bottom-4 right-4 text-white text-2xl font-800">
          R{data.price?.toLocaleString()}<span className="text-sm font-400 text-white/70">/{data.price_unit==='per_month'?'month':'unit'}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Main content */}
        <div className="col-span-2 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge badge-blue capitalize">{data.type?.replace('_',' ')}</span>
              <span className="badge badge-gray capitalize">{data.listing_type?.replace('_',' ')}</span>
            </div>
            <h1 className="text-2xl font-800 text-gray-900 mb-2">{data.title}</h1>
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <MapPin className="w-4 h-4 text-blue-500" />{data.location}, {data.city}, {data.province}
            </div>
          </div>

          {/* Specs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <Maximize2 className="w-5 h-5 text-blue-600 mx-auto mb-1.5" />
              <div className="text-lg font-800 text-gray-900">{data.size_sqm}</div>
              <div className="text-xs text-gray-400">m² GLA</div>
            </div>
            {data.features?.parking && (
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">🚗</div>
                <div className="text-lg font-800 text-gray-900">{data.features.parking}</div>
                <div className="text-xs text-gray-400">Parking Bays</div>
              </div>
            )}
            {data.features?.floor && (
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">🏢</div>
                <div className="text-lg font-800 text-gray-900">{data.features.floor}</div>
                <div className="text-xs text-gray-400">Floor</div>
              </div>
            )}
          </div>

          {/* Description */}
          {data.description && (
            <div>
              <h2 className="text-base font-700 text-gray-900 mb-3">About this Property</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{data.description}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Agent card */}
          {data.agent && (
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center text-sm font-800 text-white">
                  {data.agent.full_name?.split(' ').map(n=>n[0]).join('').slice(0,2)}
                </div>
                <div>
                  <div className="font-700 text-gray-900 text-sm">{data.agent.full_name}</div>
                  <div className="text-xs text-gray-400">PropFlow Agent</div>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                {data.agent.phone && (
                  <a href={`tel:${data.agent.phone}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 transition-colors">
                    <Phone className="w-3.5 h-3.5" />{data.agent.phone}
                  </a>
                )}
                <a href={`mailto:${data.agent.email}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 transition-colors">
                  <Mail className="w-3.5 h-3.5" />{data.agent.email}
                </a>
              </div>
              <button onClick={openChat} className="btn-secondary w-full justify-center text-sm">
                <MessageCircle className="w-4 h-4" /> Chat with AI Advisor
              </button>
            </div>
          )}

          {/* Enquiry form */}
          <div className="card p-5">
            <h3 className="font-700 text-gray-900 mb-4 text-sm">Send an Enquiry</h3>
            {isSubmitSuccessful ? (
              <div className="text-center py-4">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-sm font-600 text-gray-800">Enquiry Sent!</p>
                <p className="text-xs text-gray-500 mt-1">The agent will be in touch shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(d => enquiryMutation.mutate(d))} className="space-y-3">
                <div><input {...register('name',{required:true})} className="input text-sm" placeholder="Your Name *" /></div>
                <div><input {...register('email',{required:true})} className="input text-sm" type="email" placeholder="Email Address *" /></div>
                <div><input {...register('phone')} className="input text-sm" placeholder="Phone Number" /></div>
                <div>
                  <textarea {...register('message',{required:true,minLength:10})} className="input text-sm" rows={3}
                    defaultValue={`Hi, I'm interested in ${data.title}. Could we arrange a viewing?`} />
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                  <input type="checkbox" {...register('viewing_requested')} className="accent-blue-600" />
                  Request a viewing
                </label>
                <button type="submit" className="btn-primary w-full justify-center" disabled={enquiryMutation.isPending}>
                  <Mail className="w-4 h-4" />
                  {enquiryMutation.isPending ? 'Sending…' : 'Send Enquiry'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
