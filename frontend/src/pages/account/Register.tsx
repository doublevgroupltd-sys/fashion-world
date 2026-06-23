import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, UserPlus, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  inviteCode?: string;
}

export default function RegisterPage() {
  const { type } = useParams<{ type?: string }>();
  const isAgent = type === 'agent';
  const { setUser } = useAuthStore();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();
  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const fn = isAgent ? authApi.registerAgent : authApi.registerConsumer;
      const res = await fn(data);
      const { user, token } = res.data.data;
      setUser(user, token);
      toast.success(`Welcome to Fashion World, ${user.firstName}!`);
      navigate(isAgent ? '/dashboard' : '/');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      const fieldErrors = err.response?.data?.errors;
      if (fieldErrors?.length) {
        fieldErrors.forEach((e: any) => toast.error(e.message));
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src={
            isAgent
              ? 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=85&fit=crop'
              : 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=85&fit=crop'
          }
          alt={isAgent ? 'Agent dashboard' : 'Fashion'}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-obsidian-900/50" />
        <div className="absolute inset-0 flex flex-col justify-center p-12">
          {isAgent ? (
            <div className="text-white">
              <ShieldCheck size={48} className="text-gold-300 mb-6" />
              <h2 className="font-display text-4xl font-bold mb-4">
                Agent Dashboard Access
              </h2>
              <p className="text-white/80 text-lg leading-relaxed max-w-sm">
                Manage products, orders, customers, and banners from your powerful admin dashboard.
              </p>
              <div className="mt-8 space-y-3 text-sm text-white/70">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-gold-300 rounded-full" />
                  Full order management & fulfillment
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-gold-300 rounded-full" />
                  Product catalog & inventory control
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-gold-300 rounded-full" />
                  Customer insights & analytics
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-gold-300 rounded-full" />
                  Banner & content management
                </div>
              </div>
            </div>
          ) : (
            <div className="text-white">
              <h2 className="font-display text-4xl font-bold mb-4">
                Join Fashion World
              </h2>
              <p className="text-white/80 text-lg leading-relaxed max-w-sm">
                Discover premium fashion from Africa and around the world. Exclusive offers for members.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <Link to="/" className="inline-block mb-8">
            <span className="font-display text-2xl font-bold text-obsidian-900">
              FASHION<span className="text-luxe-500">WORLD</span>
            </span>
          </Link>

          {/* Toggle tabs */}
          <div className="flex mb-8 border border-obsidian-200">
            <Link
              to="/account/register"
              className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
                !isAgent ? 'bg-obsidian-900 text-white' : 'text-obsidian-600 hover:bg-obsidian-50'
              }`}
            >
              Customer
            </Link>
            <Link
              to="/account/register/agent"
              className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
                isAgent ? 'bg-obsidian-900 text-white' : 'text-obsidian-600 hover:bg-obsidian-50'
              }`}
            >
              Agent / Admin
            </Link>
          </div>

          <h1 className="font-display text-2xl font-semibold text-obsidian-900 mb-1">
            {isAgent ? 'Create Agent Account' : 'Create Your Account'}
          </h1>
          <p className="text-obsidian-500 text-sm mb-6">
            {isAgent
              ? 'You need a valid invite code to register as an agent.'
              : 'Join thousands of style-conscious shoppers across Africa.'}
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-luxe" htmlFor="firstName">First name</label>
                <input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  className={`input-luxe ${errors.firstName ? 'border-red-400' : ''}`}
                  placeholder="Alice"
                  {...register('firstName', { required: 'First name is required' })}
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="label-luxe" htmlFor="lastName">Last name</label>
                <input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  className={`input-luxe ${errors.lastName ? 'border-red-400' : ''}`}
                  placeholder="Wanjiku"
                  {...register('lastName', { required: 'Last name is required' })}
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="label-luxe" htmlFor="reg-email">Email address</label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                className={`input-luxe ${errors.email ? 'border-red-400' : ''}`}
                placeholder="you@example.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address' },
                })}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label-luxe" htmlFor="phone">Phone number (optional)</label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                className="input-luxe"
                placeholder="+254 7XX XXX XXX"
                {...register('phone')}
              />
            </div>

            <div>
              <label className="label-luxe" htmlFor="reg-password">Password</label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`input-luxe pr-10 ${errors.password ? 'border-red-400' : ''}`}
                  placeholder="Min 8 chars, upper, lower & number"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Minimum 8 characters' },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Must include uppercase, lowercase and number',
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-obsidian-400 hover:text-obsidian-700"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label-luxe" htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                type={showPass ? 'text' : 'password'}
                autoComplete="new-password"
                className={`input-luxe ${errors.confirmPassword ? 'border-red-400' : ''}`}
                placeholder="Repeat your password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (v) => v === password || 'Passwords do not match',
                })}
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            {isAgent && (
              <div>
                <label className="label-luxe" htmlFor="inviteCode">
                  Agent invite code <span className="text-red-500">*</span>
                </label>
                <input
                  id="inviteCode"
                  type="text"
                  className={`input-luxe font-mono tracking-widest uppercase ${errors.inviteCode ? 'border-red-400' : ''}`}
                  placeholder="XXXXXXXX"
                  {...register('inviteCode', {
                    required: 'Invite code is required for agent registration',
                  })}
                />
                {errors.inviteCode && <p className="text-red-500 text-xs mt-1">{errors.inviteCode.message}</p>}
                <p className="text-xs text-obsidian-400 mt-1">
                  Demo code: <span className="font-mono font-bold text-obsidian-600">AGENT2026</span>
                </p>
              </div>
            )}

            <p className="text-xs text-obsidian-400 leading-relaxed">
              By creating an account, you agree to our{' '}
              <Link to="/terms" className="text-luxe-600 hover:underline">Terms of Service</Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-luxe-600 hover:underline">Privacy Policy</Link>.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-4 text-sm gap-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : (
                <>
                  <UserPlus size={16} />
                  {isAgent ? 'Create Agent Account' : 'Create Account'}
                </>
              )}
            </button>
          </form>

          <p className="text-sm text-obsidian-600 text-center mt-6">
            Already have an account?{' '}
            <Link to="/account/login" className="text-luxe-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
