import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { setUser } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await authApi.login(data);
      const { user, token } = res.data.data;
      setUser(user, token);
      toast.success(`Welcome back, ${user.firstName}!`);
      navigate(user.role === 'agent' ? '/dashboard' : redirect);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left image panel */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=85&fit=crop"
          alt="Fashion"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-obsidian-900/40" />
        <div className="absolute inset-0 flex flex-col justify-end p-12">
          <blockquote className="text-white">
            <p className="font-display text-3xl font-semibold leading-snug mb-4">
              "Style is a way to say who you are without having to speak."
            </p>
            <footer className="text-white/70 text-sm">— Rachel Zoe</footer>
          </blockquote>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-block mb-8">
            <span className="font-display text-2xl font-bold text-obsidian-900">
              FASHION<span className="text-luxe-500">WORLD</span>
            </span>
          </Link>

          <h1 className="font-display text-3xl font-semibold text-obsidian-900 mb-2">Welcome back</h1>
          <p className="text-obsidian-500 text-sm mb-8">
            Sign in to your account to continue shopping.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div>
              <label className="label-luxe" htmlFor="email">Email address</label>
              <input
                id="email"
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="label-luxe" htmlFor="password">Password</label>
                <Link to="/account/forgot-password" className="text-xs text-luxe-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`input-luxe pr-10 ${errors.password ? 'border-red-400' : ''}`}
                  placeholder="Your password"
                  {...register('password', { required: 'Password is required' })}
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

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-4 text-sm gap-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                <>
                  <LogIn size={16} /> Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-obsidian-600">
              Don't have an account?{' '}
              <Link to="/account/register" className="text-luxe-600 font-medium hover:underline">
                Create one
              </Link>
            </p>
            <p className="text-xs text-obsidian-400">
              Are you an agent?{' '}
              <Link to="/account/register/agent" className="text-luxe-600 hover:underline">
                Register here
              </Link>
            </p>
          </div>

          {/* Demo credentials */}
          <div className="mt-8 p-4 bg-obsidian-50 border border-obsidian-100 text-xs text-obsidian-600 space-y-1">
            <p className="font-semibold text-obsidian-700 mb-2">Demo credentials:</p>
            <p>Consumer: <span className="font-mono">alice@example.com</span> / <span className="font-mono">Password123</span></p>
            <p>Agent: <span className="font-mono">admin@fashionworld.com</span> / <span className="font-mono">Admin123!</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
