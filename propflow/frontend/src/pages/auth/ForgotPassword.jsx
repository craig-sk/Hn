// src/pages/auth/ForgotPassword.jsx
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Building2, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { isSubmitting, isSubmitSuccessful } } = useForm();
  const onSubmit = async ({ email }) => {
    try { await authApi.forgotPassword(email); } catch {}
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-800 text-white">Reset Password</h1>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          {isSubmitSuccessful ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">📧</div>
              <p className="text-sm font-600 text-gray-800 mb-1">Check your email</p>
              <p className="text-xs text-gray-500">We sent a reset link if that account exists.</p>
              <Link to="/login" className="mt-4 btn-primary w-full justify-center block text-center mt-5">Back to Login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Email Address</label>
                <input {...register('email', { required: true })} className="input" type="email" placeholder="your@email.com" />
              </div>
              <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={isSubmitting}>
                {isSubmitting ? 'Sending…' : 'Send Reset Link'}
              </button>
              <Link to="/login" className="flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
