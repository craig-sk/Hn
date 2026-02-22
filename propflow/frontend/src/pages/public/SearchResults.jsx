// src/pages/public/SearchResults.jsx
import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listingsApi } from '@/lib/api';
import { MapPin, Maximize2, Heart, Search, SlidersHorizontal } from 'lucide-react';

const TYPE_COLORS = {
  office:'from-blue-900 to-blue-700', industrial:'from-emerald-900 to-emerald-700',
  retail:'from-purple-900 to-purple-700', warehouse:'from-amber-900 to-amber-700',
  mixed_use:'from-rose-900 to-rose-700', agricultural:'from-teal-900 to-teal-700',
};

function PropertyCard({ listing }) {
  const [saved, setSaved] = useState(false);
  return (
    <Link to={`/properties/${listing.id}`} className="card group overflow-hidden block hover:shadow-card-hover transition-all hover:-translate-y-0.5 duration-200">
      <div className={`h-40 bg-gradient-to-br ${TYPE_COLORS[listing.type] || 'from-blue-900 to-blue-700'} relative flex items-center justify-center`}>
        <div className="text-5xl opacity-10 select-none font-900 text-white">{listing.type?.slice(0,2).toUpperCase()}</div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          {listing.status === 'featured' && <span className="badge bg-purple-600 text-white text-xs">⭐ Featured</span>}
          <span className="badge bg-black/40 text-white text-xs backdrop-blur-sm">{listing.type?.replace('_',' ')}</span>
        </div>
        <button className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center transition-colors ${saved?'text-red-500':'text-gray-400 hover:text-red-400'}`}
          onClick={e => { e.preventDefault(); setSaved(v=>!v); }}>
          <Heart className="w-3.5 h-3.5" fill={saved?'currentColor':'none'} />
        </button>
      </div>
      <div className="p-4">
        <div className="text-base font-700 text-blue-700 mb-0.5">
          R{listing.price?.toLocaleString()}<span className="text-xs text-gray-400 font-400">/{listing.price_unit==='per_month'?'mo':listing.price_unit}</span>
        </div>
        <div className="text-sm font-600 text-gray-900 mb-1 line-clamp-1">{listing.title}</div>
        <div className="text-xs text-gray-500 flex items-center gap-1 mb-3">
          <MapPin className="w-3 h-3 flex-shrink-0" />{listing.location}, {listing.city}
        </div>
        <div className="flex gap-3 pt-2.5 border-t border-gray-100 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3" />{listing.size_sqm} m²</span>
          {listing.agent && <span className="ml-auto truncate">Agent: {listing.agent.full_name?.split(' ')[0]}</span>}
        </div>
      </div>
    </Link>
  );
}

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [priceMax, setPriceMax] = useState(150000);

  const params = {
    page, limit: 12,
    location: searchParams.get('location') || undefined,
    type: searchParams.get('type') || undefined,
    listing_type: searchParams.get('listing_type') || undefined,
    max_price: priceMax,
    sort: searchParams.get('sort') || 'newest',
  };

  const { data, isLoading } = useQuery({
    queryKey: ['public-listings', params],
    queryFn: () => listingsApi.getPublic(params).then(r => r.data),
    keepPreviousData: true,
  });

  const listings = data?.listings || [];
  const pagination = data?.pagination || {};

  const updateFilter = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set(key, val); else next.delete(key);
    setSearchParams(next);
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Results bar */}
      <div className="flex items-center justify-between mb-5">
        <div className="text-sm text-gray-600">
          <strong className="text-gray-900">{pagination.total || 0}</strong> properties found
          {searchParams.get('location') && <> near <strong>{searchParams.get('location')}</strong></>}
        </div>
        <select value={searchParams.get('sort')||'newest'} onChange={e => updateFilter('sort', e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none text-gray-700">
          <option value="newest">Newest First</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
          <option value="most_viewed">Most Viewed</option>
        </select>
      </div>

      <div className="flex gap-6">
        {/* Filters sidebar */}
        <aside className="w-56 flex-shrink-0 space-y-4">
          <div className="card p-4">
            <div className="text-xs font-700 text-gray-700 uppercase tracking-wide mb-3">Listing Type</div>
            <div className="space-y-2">
              {[['', 'All'], ['to_let', 'To Let'], ['for_sale', 'For Sale']].map(([val, label]) => (
                <label key={label} className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                  <input type="radio" name="listing_type" value={val}
                    checked={(searchParams.get('listing_type')||'') === val}
                    onChange={() => updateFilter('listing_type', val)}
                    className="accent-blue-600" /> {label}
                </label>
              ))}
            </div>
          </div>
          <div className="card p-4">
            <div className="text-xs font-700 text-gray-700 uppercase tracking-wide mb-3">Property Type</div>
            <div className="space-y-2">
              {['office','industrial','retail','warehouse','mixed_use'].map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                  <input type="checkbox" value={t}
                    checked={searchParams.get('type') === t}
                    onChange={e => updateFilter('type', e.target.checked ? t : '')}
                    className="accent-blue-600 w-3.5 h-3.5" />
                  <span className="capitalize">{t.replace('_',' ')}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="card p-4">
            <div className="text-xs font-700 text-gray-700 uppercase tracking-wide mb-3">Max Price</div>
            <input type="range" min={5000} max={500000} step={5000} value={priceMax}
              onChange={e => setPriceMax(Number(e.target.value))}
              className="w-full accent-blue-600 mb-2" />
            <div className="flex justify-between text-xs text-gray-400">
              <span>R5K</span><span className="font-600 text-blue-600">R{priceMax.toLocaleString()}</span>
            </div>
          </div>
          {/* Upgrade banner */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-4 text-center">
            <div className="text-white font-700 text-sm mb-1">Feature Your Listing</div>
            <div className="text-purple-200 text-xs mb-3">Get 5× more enquiries</div>
            <Link to="/login" className="block text-xs font-700 text-purple-800 bg-white rounded-lg py-1.5 hover:bg-purple-50 transition-colors">Upgrade →</Link>
          </div>
        </aside>

        {/* Grid */}
        <div className="flex-1">
          {isLoading && (
            <div className="grid grid-cols-3 gap-4">
              {[...Array(6)].map((_,i) => <div key={i} className="h-72 bg-gray-200 rounded-xl animate-pulse" />)}
            </div>
          )}
          {!isLoading && listings.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-600">No properties found</p>
              <p className="text-sm mt-1">Try adjusting your search filters</p>
            </div>
          )}
          <div className="grid grid-cols-3 gap-4">
            {listings.map(l => <PropertyCard key={l.id} listing={l} />)}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button disabled={page<=1} onClick={() => setPage(p=>p-1)} className="btn-secondary disabled:opacity-40">← Prev</button>
              <span className="flex items-center px-3 text-sm text-gray-600">{page} / {pagination.totalPages}</span>
              <button disabled={page>=pagination.totalPages} onClick={() => setPage(p=>p+1)} className="btn-secondary disabled:opacity-40">Next →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
