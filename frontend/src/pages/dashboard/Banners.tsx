// ─── Banners.tsx ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit2, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { bannersApi } from '../../lib/api';
import type { Banner } from '../../lib/types';

type BannerFormMode = 'create' | 'edit' | null;

export function DashboardBanners() {
  const qc = useQueryClient();
  const [formMode, setFormMode] = useState<BannerFormMode>(null);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['banners-all'],
    queryFn: () => bannersApi.getAll().then(r => r.data.data.banners as Banner[]),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bannersApi.delete(id),
    onSuccess: () => { toast.success('Banner deleted'); qc.invalidateQueries({ queryKey: ['banners-all'] }); qc.invalidateQueries({ queryKey: ['banners'] }); },
    onError: () => toast.error('Delete failed'),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>();

  const openCreate = () => { reset({}); setEditing(null); setFormMode('create'); };
  const openEdit = (banner: Banner) => {
    reset({ title: banner.title, subtitle: banner.subtitle, ctaText: banner.ctaText, ctaLink: banner.ctaLink, imageUrl: banner.image, isActive: banner.isActive });
    setEditing(banner);
    setFormMode('edit');
  };

  const onSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', data.title);
      fd.append('subtitle', data.subtitle || '');
      fd.append('ctaText', data.ctaText);
      fd.append('ctaLink', data.ctaLink);
      fd.append('imageUrl', data.imageUrl || '');
      fd.append('isActive', data.isActive !== false ? 'true' : 'false');

      if (formMode === 'edit' && editing) {
        await bannersApi.update(editing._id, fd);
        toast.success('Banner updated!');
      } else {
        await bannersApi.create(fd);
        toast.success('Banner created!');
      }
      qc.invalidateQueries({ queryKey: ['banners-all'] });
      qc.invalidateQueries({ queryKey: ['banners'] });
      setFormMode(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const banners: Banner[] = data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-obsidian-900">Hero Banners</h1>
          <p className="text-sm text-obsidian-500 mt-0.5">Manage your homepage carousel banners</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-xs py-2.5 px-4 flex items-center gap-2">
          <Plus size={15} /> Add Banner
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 skeleton" />)}</div>
      ) : (
        <div className="space-y-4">
          {banners.length === 0 ? (
            <div className="card-luxe p-12 text-center text-obsidian-400">
              <p>No banners yet.</p>
              <button onClick={openCreate} className="btn-primary text-xs py-2.5 px-4 mt-4">Create First Banner</button>
            </div>
          ) : banners.map((banner) => (
            <div key={banner._id} className="card-luxe p-4 flex gap-4 items-center">
              <GripVertical size={16} className="text-obsidian-300 flex-shrink-0 cursor-grab" />
              <div className="w-24 h-14 flex-shrink-0 overflow-hidden bg-obsidian-100">
                <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-obsidian-900">{banner.title}</p>
                {banner.subtitle && <p className="text-xs text-obsidian-500 truncate mt-0.5">{banner.subtitle}</p>}
                <p className="text-xs text-luxe-600 mt-1">{banner.ctaText} → {banner.ctaLink}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 ${banner.isActive ? 'bg-green-100 text-green-700' : 'bg-obsidian-100 text-obsidian-500'}`}>
                  {banner.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
                <button onClick={() => openEdit(banner)} className="p-1.5 text-obsidian-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => { if (window.confirm('Delete this banner?')) deleteMutation.mutate(banner._id); }}
                  className="p-1.5 text-obsidian-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setFormMode(null)}>
          <div className="bg-white max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-obsidian-100">
              <h2 className="font-semibold text-lg">{formMode === 'create' ? 'Add New Banner' : 'Edit Banner'}</h2>
              <button onClick={() => setFormMode(null)} className="btn-ghost p-2">✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="label-luxe">Headline *</label>
                <input className={`input-luxe ${errors.title ? 'border-red-400' : ''}`} {...register('title', { required: 'Required' })} placeholder="New Season, New You" />
                {errors.title && <p className="text-red-500 text-xs mt-1">{String(errors.title.message)}</p>}
              </div>
              <div>
                <label className="label-luxe">Subtitle</label>
                <textarea rows={2} className="input-luxe resize-none" {...register('subtitle')} placeholder="Short supporting text below headline" />
              </div>
              <div>
                <label className="label-luxe">Image URL * <span className="text-obsidian-400 font-normal">(or upload file)</span></label>
                <input className={`input-luxe ${errors.imageUrl ? 'border-red-400' : ''}`} {...register('imageUrl', { required: formMode === 'create' ? 'Image URL is required' : false })}
                  placeholder="https://images.unsplash.com/..." />
                {errors.imageUrl && <p className="text-red-500 text-xs mt-1">{String(errors.imageUrl.message)}</p>}
                <p className="text-[11px] text-obsidian-400 mt-1">Use Unsplash URLs (1600×900px recommended)</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-luxe">CTA Button Text *</label>
                  <input className={`input-luxe ${errors.ctaText ? 'border-red-400' : ''}`} {...register('ctaText', { required: 'Required' })} placeholder="Shop Now" />
                </div>
                <div>
                  <label className="label-luxe">CTA Link *</label>
                  <input className={`input-luxe ${errors.ctaLink ? 'border-red-400' : ''}`} {...register('ctaLink', { required: 'Required' })} placeholder="/shop?category=NEW IN" />
                </div>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-luxe-500" defaultChecked {...register('isActive')} />
                <span className="text-sm text-obsidian-700">Active (visible on homepage)</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center py-3 text-sm">
                  {submitting ? 'Saving…' : formMode === 'create' ? 'Create Banner' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setFormMode(null)} className="btn-secondary px-5 py-3 text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardBanners;
