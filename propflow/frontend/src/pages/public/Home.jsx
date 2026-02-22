// src/pages/public/Home.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, Warehouse, ShoppingBag, TrendingUp } from 'lucide-react';

const CATEGORIES = [
  { icon: Building2,   label: 'Office Space',    type: 'office',     count: '63 listings' },
  { icon: Warehouse,   label: 'Industrial',       type: 'industrial', count: '39 listings' },
  { icon: ShoppingBag, label: 'Retail',           type: 'retail',     count: '26 listings' },
  { icon: TrendingUp,  label: 'Development Land', type: 'agricultural', count: '14 listings' },
];

const CITIES = ['Cape Town','Johannesburg','Pretoria','Durban','Midrand','Sandton','Stellenbosch'];

export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [listingType, setListingType] = useState('to_let');
  const [type, setType] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('location', search);
    if (listingType) params.set('listing_type', listingType);
    if (type) params.set('type', type);
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 py-16 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M0 40L40 0H20L0 20M40 40V20L20 40\'/%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 text-blue-100 text-xs font-600 px-3 py-1.5 rounded-full mb-6 border border-white/10">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            75,000+ Commercial Properties Across South Africa
          </div>
          <h1 className="text-4xl lg:text-5xl font-800 text-white mb-4 leading-tight">
            Find Your Perfect<br /><span className="text-blue-300">Business Space</span>
          </h1>
          <p className="text-blue-200 text-lg mb-10">Office, industrial, retail & warehouse spaces from leading commercial agents</p>

          {/* Search Box */}
          <div className="bg-white rounded-2xl p-4 shadow-2xl text-left">
            {/* Tab */}
            <div className="flex gap-1 mb-3">
              {['to_let','for_sale'].map(t => (
                <button key={t} onClick={() => setListingType(t)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-600 transition-all ${listingType===t ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {t === 'to_let' ? 'To Let' : 'For Sale'}
                </button>
              ))}
            </div>
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-400 font-600 uppercase tracking-wide">Location</label>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full text-gray-900 text-sm font-500 outline-none mt-0.5 placeholder-gray-300"
                  placeholder="City, suburb or area…" />
              </div>
              <div className="w-px bg-gray-200 self-stretch" />
              <div>
                <label className="text-xs text-gray-400 font-600 uppercase tracking-wide">Property Type</label>
                <select value={type} onChange={e => setType(e.target.value)}
                  className="w-36 text-gray-800 text-sm font-500 outline-none mt-0.5 bg-transparent cursor-pointer">
                  <option value="">All Types</option>
                  {['office','industrial','retail','warehouse','mixed_use'].map(t => (
                    <option key={t} value={t}>{t.replace('_',' ').replace(/\b\w/g, c=>c.toUpperCase())}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn-primary px-6 self-end">
                <Search className="w-4 h-4" /> Search
              </button>
            </form>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {CITIES.map(city => (
              <button key={city} onClick={() => navigate(`/properties?location=${city}`)}
                className="text-xs text-blue-200 hover:text-white transition-colors px-2 py-1 rounded bg-white/5 hover:bg-white/10">
                {city}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-xl font-800 text-gray-900 mb-6">Browse by Category</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map(cat => (
            <button key={cat.type} onClick={() => navigate(`/properties?type=${cat.type}`)}
              className="card p-5 text-left hover:shadow-card-hover transition-all group hover:border-blue-200">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                <cat.icon className="w-5 h-5 text-blue-600" />
              </div>
              <div className="font-700 text-gray-900 mb-1">{cat.label}</div>
              <div className="text-xs text-gray-400">{cat.count}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-blue-950 py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-4 gap-8 text-center">
          {[['75K+','Listings'],['6','Regions'],['4','City Offices'],['12+','Years Experience']].map(([val, label]) => (
            <div key={label}>
              <div className="text-3xl font-800 text-white mb-1">{val}</div>
              <div className="text-sm text-blue-300">{label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
