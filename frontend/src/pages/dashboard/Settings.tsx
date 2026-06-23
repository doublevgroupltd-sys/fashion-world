import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Save, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

export default function DashboardSettings() {
  const { user, updateUser, logout } = useAuthStore();
  const [pwLoading, setPwLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const profileForm = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
    },
  });

  const pwForm = useForm<{ currentPassword: string; newPassword: string; confirmPassword: string }>();

  const onProfileSave = async (data: any) => {
    setProfileLoading(true);
    try {
      await authApi.updateProfile(data);
      updateUser(data);
      toast.success('Profile updated!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setProfileLoading(false);
    }
  };

  const onPasswordChange = async (data: any) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setPwLoading(true);
    try {
      await authApi.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed! Please sign in again.');
      pwForm.reset();
      await logout();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-semibold text-obsidian-900">Settings</h1>
        <p className="text-sm text-obsidian-500 mt-0.5">Manage your account and store preferences</p>
      </div>

      {/* Profile */}
      <div className="card-luxe p-6">
        <h2 className="font-semibold text-obsidian-900 mb-5 flex items-center gap-2">
          <span className="w-6 h-6 bg-luxe-100 flex items-center justify-center text-luxe-600 text-xs font-bold">1</span>
          Agent Profile
        </h2>
        <form onSubmit={profileForm.handleSubmit(onProfileSave)} className="space-y-4">
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
            <input className="input-luxe bg-obsidian-50 cursor-not-allowed" value={user?.email || ''} readOnly disabled />
            <p className="text-xs text-obsidian-400 mt-1">Email cannot be changed from this panel</p>
          </div>
          <div>
            <label className="label-luxe">Phone</label>
            <input className="input-luxe" placeholder="+254 7XX XXX XXX" {...profileForm.register('phone')} />
          </div>
          <button type="submit" disabled={profileLoading} className="btn-primary text-xs py-2.5 px-5 flex items-center gap-2">
            <Save size={14} />
            {profileLoading ? 'Saving…' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="card-luxe p-6">
        <h2 className="font-semibold text-obsidian-900 mb-5 flex items-center gap-2">
          <span className="w-6 h-6 bg-luxe-100 flex items-center justify-center text-luxe-600 text-xs font-bold">2</span>
          Change Password
        </h2>
        <form onSubmit={pwForm.handleSubmit(onPasswordChange)} className="space-y-4">
          <div>
            <label className="label-luxe">Current password</label>
            <input type="password" className="input-luxe"
              {...pwForm.register('currentPassword', { required: 'Required' })} />
          </div>
          <div>
            <label className="label-luxe">New password</label>
            <input type="password" className="input-luxe"
              placeholder="Min 8 chars, upper, lower & number"
              {...pwForm.register('newPassword', {
                required: 'Required',
                minLength: { value: 8, message: 'Minimum 8 characters' },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: 'Must include uppercase, lowercase and number',
                },
              })} />
            {pwForm.formState.errors.newPassword && (
              <p className="text-red-500 text-xs mt-1">{pwForm.formState.errors.newPassword.message}</p>
            )}
          </div>
          <div>
            <label className="label-luxe">Confirm new password</label>
            <input type="password" className="input-luxe"
              {...pwForm.register('confirmPassword', { required: 'Required' })} />
          </div>
          <button type="submit" disabled={pwLoading} className="btn-secondary text-xs py-2.5 px-5 flex items-center gap-2">
            <Key size={14} />
            {pwLoading ? 'Changing…' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Store info */}
      <div className="card-luxe p-6">
        <h2 className="font-semibold text-obsidian-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-luxe-100 flex items-center justify-center text-luxe-600 text-xs font-bold">3</span>
          Store Information
        </h2>
        <div className="space-y-3 text-sm">
          {[
            { label: 'Store Name', value: 'Fashion World' },
            { label: 'Support Email', value: 'support@fashionworld.com' },
            { label: 'WhatsApp', value: '+254 700 000 001' },
            { label: 'Address', value: 'Kimathi Street, Nairobi, Kenya' },
            { label: 'KRA PIN', value: 'P051XXXXXXM (demo)' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2 border-b border-obsidian-100 last:border-0">
              <span className="text-obsidian-500 font-medium">{label}</span>
              <span className="text-obsidian-800">{value}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-obsidian-400 mt-4">
          Store details are used on invoices and packing slips. Contact your system administrator to update these.
        </p>
      </div>

      {/* Danger zone */}
      <div className="border border-red-200 p-6">
        <h2 className="font-semibold text-red-700 mb-3">Danger Zone</h2>
        <p className="text-sm text-obsidian-600 mb-4">
          Sign out of all sessions on all devices. You will need to log in again.
        </p>
        <button onClick={async () => { await logout(); }} className="text-xs font-medium text-red-600 border border-red-300 px-4 py-2 hover:bg-red-50 transition-colors">
          Sign Out Everywhere
        </button>
      </div>
    </div>
  );
}
