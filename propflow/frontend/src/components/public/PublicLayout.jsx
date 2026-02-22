// src/components/public/PublicLayout.jsx
import { Outlet } from 'react-router-dom';
import PublicNav from './PublicNav';
import ChatWidget from '../chat/ChatWidget';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 px-8 mt-12">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>© {new Date().getFullYear()} PropFlow. Commercial Real Estate Platform.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
      <ChatWidget />
    </div>
  );
}
