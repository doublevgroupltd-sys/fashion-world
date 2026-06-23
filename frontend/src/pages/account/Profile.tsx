import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { User, Heart, Package, Settings, Save, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi, productsApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import ProductCard from '../../components/ProductCard';
import { KENYA_COUNTIES, formatKES } from '../../lib/types';

type Tab = 'profile' | 'wishlist' | 'address' | 'password';

export default function AccountProfile() {
  const { user, updateUser } = useAuthStore();
  const [tab, setTab] = useState<Tab>('profile');
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const qc = useQueryClient();

  if (!user) return <Navigate to="/account/login" replace />;

  const profileForm = useForm({
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
    },
  });

  const addressForm = useForm({
    defaultValues: {
      street: user.address?.street || '',
      city: user.address?.city || '',
      county: user.address?.county || '',
      country: user.address?.country || 'Kenya',
      postalCode: user.address?.postalCode || '',
    },
  });

  const pwForm = useForm<{ currentPassword: string; newPassword: string; confirmPassword: string }>();

  // Wishlist products
  const { data: wishlistProducts, isLoading: wishlistLoading } = useQuery({
    queryKey: ['wishlist', user.wishlist],
    queryFn: async () => {
      if (!user.wishlist?.length) return [];
      const results = await Promise.all(
        (user.wishlist || []).slice(0, 12).map(id =>
          productsApi.getById(id).then(r => r.data.data.product).catch(() => null)
        )
      );
      return results.filter(Boolean);
    },
    enabled: tab === 'wishlist',
  });

  const onProfileSave = async (data: any) => {
    setSaving(true);
    try {
      await authApi.updateProfile(data);
      updateUser(data);
      toast.success('Profile updated!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const onAddressSave = async (data: any) => {
    setSaving(true);
    try {
      await authApi.updateProfile({ address: data });
      updateUser({ address: data });
      toast.success('Address saved!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const onPasswordSave = async (data: any) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setPwSaving(true);
    try {
      await authApi.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed!');
      pwForm.reset();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Change failed');
    } finally {
      setPwSaving(false);
    }
  };

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'My Profile', icon: <User size={15} /> },
    { id: 'wishlist', label: `Wishlist (${user.wishlist?.length || 0})`, icon: <Heart size={15} /> },
    { id: 'address', label: 'Saved Address', icon: <Package size={15} /> },
    { id: 'password', label: 'Password', icon: <Settings size={15} /> },
  ];

  return (
    <div className="max-w-screen-xl mx-auto px-4 lg:px-8 py-10">
      <h1 className="font-display text-3xl font-semibold text-obsidian-900 mb-8">My Account</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-56 flex-shrink-0">
          {/* User info card */}
          <div className="bg-obsidian-900 text-white p-5 mb-4">
            <div className="w-14 h-14 bg-luxe-500 rounded-full flex items-center justify-center text-xl font-bold mb-3">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <p className="font-semibold">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-obsidian-300 mt-0.5">{user.email}</p>
            {user.role === 'agent' && (
              <span className="inline-block mt-2 text-[10px] font-bold tracking-wider px-2 py-0.5 bg-gold-400 text-obsidian-900">AGENT</span>
            )}
          </div>

          {/* Quick links */}
          <div className="space-y-1">
            {TABS.map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2.5 w-full px-4 py-3 text-sm font-medium text-left transition-colors border-l-2 ${
                  tab === id
                    ? 'border-luxe-500 bg-luxe-50 text-luxe-700'
                    : 'border-transparent text-obsidian-600 hover:bg-obsidian-50 hover:text-obsidian-900'
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
            <Link
              to="/account/orders"
              className="flex items-center gap-2.5 w-full px-4 py-3 text-sm font-medium text-obsidian-600 hover:bg-obsidian-50 hover:text-obsidian-900 transition-colors border-l-2 border-transparent"
            >
              <Package size={15} />
              Order History
            </Link>
          </div>

          {user.totalSpent !== undefined && user.totalSpent > 0 && (
            <div className="mt-4 p-4 bg-gold-300/20 border border-gold-300">
              <p className="text-xs text-obsidian-500 mb-0.5">Total Spent</p>
              <p className="font-bold text-obsidian-900">{formatKES(user.totalSpent)}</p>
            </div>
          )}
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">

          {/* ── Profile tab ── */}
          {tab === 'profile' && (
            <div className="card-luxe p-6">
              <h2 className="font-semibold text-lg text-obsidian-900 mb-6">Personal Information</h2>
              <form onSubmit={profileForm.handleSubmit(onProfileSave)} className="space-y-4 max-w-md">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-luxe">First name</label>
                    <input className="input-luxe" {...profileForm.register('firstName', { required: true })} />
                  </div>
                  <div>
                    <label className="label-luxe">Last name</label>
                    <input className="input-luxe" {...profileForm.register('lastName', { required: true })} />
                  </div>
                </div>
                <div>
                  <label className="label-luxe">Email</label>
                  <input className="input-luxe bg-obsidian-50 cursor-not-allowed" value={user.email} readOnly disabled />
                  <p className="text-xs text-obsidian-400 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="label-luxe">Phone number</label>
                  <input className="input-luxe" placeholder="+254 7XX XXX XXX" {...profileForm.register('phone')} />
                </div>
                <button type="submit" disabled={saving} className="btn-primary text-xs py-3 px-6 flex items-center gap-2">
                  <Save size={14} />
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {/* ── Wishlist tab ── */}
          {tab === 'wishlist' && (
            <div>
              <h2 className="font-semibold text-lg text-obsidian-900 mb-6">My Wishlist</h2>
              {wishlistLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => <div key={i} className="aspect-[3/4] skeleton" />)}
                </div>
              ) : !wishlistProducts?.length ? (
                <div className="text-center py-16">
                  <Heart size={40} className="mx-auto text-obsidian-200 mb-4" />
                  <h3 className="font-display text-xl text-obsidian-600 mb-2">Your wishlist is empty</h3>
                  <p className="text-sm text-obsidian-500 mb-6">Save items you love by clicking the heart icon on any product.</p>
                  <Link to="/shop" className="btn-primary text-xs py-3 px-6">Explore Collection</Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {wishlistProducts.map((p: any) => p && <ProductCard key={p._id} product={p} />)}
                </div>
              )}
            </div>
          )}

          {/* ── Address tab ── */}
          {tab === 'address' && (
            <div className="card-luxe p-6">
              <h2 className="font-semibold text-lg text-obsidian-900 mb-6">Default Shipping Address</h2>
              <form onSubmit={addressForm.handleSubmit(onAddressSave)} className="space-y-4 max-w-md">
                <div>
                  <label className="label-luxe">Street address</label>
                  <input className="input-luxe" placeholder="e.g. 123 Kimathi Street" {...addressForm.register('street')} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-luxe">City / Town</label>
                    <input className="input-luxe" placeholder="e.g. Nairobi" {...addressForm.register('city')} />
                  </div>
                  <div>
                    <label className="label-luxe">County</label>
                    <div className="relative">
                      <select className="input-luxe appearance-none pr-8" {...addressForm.register('county')}>
                        <option value="">Select county</option>
                        {KENYA_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                        <option value="International">International</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-obsidian-400" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-luxe">Country</label>
                    <input className="input-luxe" {...addressForm.register('country')} />
                  </div>
                  <div>
                    <label className="label-luxe">Postal code</label>
                    <input className="input-luxe" placeholder="e.g. 00100" {...addressForm.register('postalCode')} />
                  </div>
                </div>
                <button type="submit" disabled={saving} className="btn-primary text-xs py-3 px-6 flex items-center gap-2">
                  <Save size={14} />
                  {saving ? 'Saving…' : 'Save Address'}
                </button>
              </form>
            </div>
          )}

          {/* ── Password tab ── */}
          {tab === 'password' && (
            <div className="card-luxe p-6">
              <h2 className="font-semibold text-lg text-obsidian-900 mb-6">Change Password</h2>
              <form onSubmit={pwForm.handleSubmit(onPasswordSave)} className="space-y-4 max-w-md">
                <div>
                  <label className="label-luxe">Current password</label>
                  <input type="password" className="input-luxe" {...pwForm.register('currentPassword', { required: 'Required' })} />
                  {pwForm.formState.errors.currentPassword && (
                    <p className="text-red-500 text-xs mt-1">{pwForm.formState.errors.currentPassword.message}</p>
                  )}
                </div>
                <div>
                  <label className="label-luxe">New password</label>
                  <input type="password" className="input-luxe" placeholder="Min 8 chars, upper, lower & number"
                    {...pwForm.register('newPassword', {
                      required: 'Required',
                      minLength: { value: 8, message: 'Minimum 8 characters' },
                      pattern: { value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: 'Must include uppercase, lowercase and number' },
                    })} />
                  {pwForm.formState.errors.newPassword && (
                    <p className="text-red-500 text-xs mt-1">{pwForm.formState.errors.newPassword.message}</p>
                  )}
                </div>
                <div>
                  <label className="label-luxe">Confirm new password</label>
                  <input type="password" className="input-luxe" {...pwForm.register('confirmPassword', { required: 'Required' })} />
                </div>
                <button type="submit" disabled={pwSaving} className="btn-primary text-xs py-3 px-6 flex items-center gap-2">
                  <Save size={14} />
                  {pwSaving ? 'Changing…' : 'Change Password'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
