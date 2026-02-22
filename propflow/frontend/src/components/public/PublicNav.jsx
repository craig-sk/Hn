// src/components/public/PublicNav.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useUIStore } from '@/lib/store';
import { Building2, MessageCircle } from 'lucide-react';

export default function PublicNav() {
  const { openChat } = useUIStore();
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 font-800 text-blue-700">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          PropFlow
        </Link>
        <div className="flex gap-5 ml-4 text-sm text-gray-500">
          <Link to="/properties?listing_type=to_let" className="hover:text-blue-600 transition-colors font-500">To Let</Link>
          <Link to="/properties?listing_type=for_sale" className="hover:text-blue-600 transition-colors font-500">For Sale</Link>
          <Link to="/properties?type=industrial" className="hover:text-blue-600 transition-colors font-500">Industrial</Link>
          <Link to="/properties?type=retail" className="hover:text-blue-600 transition-colors font-500">Retail</Link>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button onClick={openChat} className="btn-secondary text-sm py-1.5 gap-1.5">
            <MessageCircle className="w-3.5 h-3.5" /> AI Advisor
          </button>
          <Link to="/login" className="btn-primary text-sm py-1.5">Agent Login</Link>
        </div>
      </div>
    </nav>
  );
}
