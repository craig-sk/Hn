// src/pages/auth/Login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { Building2, Eye, EyeOff, Shield } from 'lucide-react';

export default function Login() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const res = await authApi.login(data);
      login(res.data);
      toast.success(`Welcome back, ${res.data.user.full_name?.split(' ')[0]}!`);
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/50">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-800 text-white">PropFlow</h1>
          <p className="text-blue-300 text-sm mt-1">Agent & Admin Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-5 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            Secured by Supabase Auth + Microsoft Entra ID
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input
                {...register('email', { required: 'Email required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } })}
                className="input"
                placeholder="agent@propflow.co.za"
                type="email"
                autoFocus
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  {...register('password', { required: 'Password required', minLength: { value: 6, message: 'Min 6 characters' } })}
                  className="input pr-10"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(v => !v)}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline">Forgot password?</Link>
            </div>
            <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign In to Portal'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-5">
          © {new Date().getFullYear()} PropFlow · Commercial Real Estate Platform
        </p>
      </div>
    </div>
  );
}
