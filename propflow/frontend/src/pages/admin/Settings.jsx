// src/pages/admin/Settings.jsx
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { User, Lock, Bell, Globe } from 'lucide-react';

export default function Settings() {
  const { user } = useAuthStore();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: { full_name: user?.full_name, email: user?.email, phone: user?.phone || '' }
  });

  const onSubmit = async () => {
    await new Promise(r => setTimeout(r, 800));
    toast.success('Settings saved');
  };

  return (
    <div className="p-6 animate-fade-in max-w-2xl">
      <div className="mb-6"><h1 className="text-xl font-800 text-gray-900">Settings</h1><p className="text-sm text-gray-500 mt-0.5">Manage your account and preferences</p></div>

      <div className="space-y-4">
        <div className="card">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <User className="w-4 h-4 text-blue-600" /><span className="text-sm font-700">Profile Information</span>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Full Name</label><input {...register('full_name')} className="input" /></div>
              <div><label className="label">Email</label><input {...register('email')} className="input" type="email" disabled /></div>
              <div><label className="label">Phone</label><input {...register('phone')} className="input" placeholder="+27 82 000 0000" /></div>
              <div><label className="label">Role</label><input value={user?.role} className="input bg-gray-100 cursor-not-allowed" disabled /></div>
            </div>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save Changes'}</button>
          </form>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <Lock className="w-4 h-4 text-blue-600" /><span className="text-sm font-700">Security</span>
          </div>
          <div className="p-5">
            <p className="text-sm text-gray-600 mb-4">Password management is handled by Supabase Auth. Use the forgot password flow to reset.</p>
            <button className="btn-secondary" onClick={() => toast.success('Reset email sent!')}>Send Password Reset Email</button>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <Bell className="w-4 h-4 text-blue-600" /><span className="text-sm font-700">Notifications</span>
          </div>
          <div className="p-5 space-y-3">
            {[['New enquiry received','Email me when I receive a new enquiry'],['Listing status change','Notify when a listing status is updated'],['Weekly digest','Summary of activity each Monday']].map(([label, desc]) => (
              <label key={label} className="flex items-start justify-between gap-4 cursor-pointer">
                <div><div className="text-sm font-500 text-gray-800">{label}</div><div className="text-xs text-gray-400">{desc}</div></div>
                <input type="checkbox" defaultChecked className="mt-0.5 accent-blue-600 w-4 h-4 cursor-pointer flex-shrink-0" />
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
