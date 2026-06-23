import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, Copy, ChevronDown, X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { productsApi } from '../../lib/api';
import { formatKES } from '../../lib/types';
import type { Product } from '../../lib/types';

const CATEGORIES = ['NEW IN','WOMEN','MEN','KIDS','ACTIVEWEAR','FOOTWEAR','ACCESSORIES','BEAUTY','MADE IN AFRICA','SALE','BUDGET FRIENDLY','DISCOVER'];

type FormMode = 'create' | 'edit' | null;

// Build full image URL from relative path
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
const getImageSrc = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
};

// Placeholder when image is broken (kept for future use, but not forced)
const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNFMkUyRTIiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5OTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';

export default function DashboardProducts() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Image upload state
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', { search, category: categoryFilter, page }],
    queryFn: () => productsApi.getAll({
      ...(search && { search }),
      ...(categoryFilter && { category: categoryFilter }),
      page,
      limit: 15,
    }).then(r => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => { toast.success('Product deleted'); qc.invalidateQueries({ queryKey: ['admin-products'] }); },
    onError: () => toast.error('Delete failed'),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => productsApi.duplicate(id),
    onSuccess: () => { toast.success('Product duplicated'); qc.invalidateQueries({ queryKey: ['admin-products'] }); },
    onError: () => toast.error('Duplicate failed'),
  });

  const products: Product[] = data?.products || [];
  const pagination = data?.pagination;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>();

  const openCreate = () => {
    reset({});
    setEditingProduct(null);
    setNewFiles([]);
    setExistingImages([]);
    setRemovedImages([]);
    setFormMode('create');
  };

  const openEdit = (product: Product) => {
    reset({
      name: product.name,
      description: product.description,
      shortDescription: product.shortDescription || '',
      price: product.price,
      compareAtPrice: product.compareAtPrice || '',
      category: product.category,
      brand: product.brand || '',
      totalStock: product.totalStock,
      madeInAfrica: product.madeInAfrica,
      featured: product.featured,
      sizes: (product.sizes || []).join(', '),
    });
    setEditingProduct(product);
    setNewFiles([]);
    setExistingImages(product.images || []);
    setRemovedImages([]);
    setFormMode('edit');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewFiles(Array.from(e.target.files));
    }
  };

  const removeExistingImage = (url: string) => {
    setExistingImages(prev => prev.filter(img => img !== url));
    setRemovedImages(prev => [...prev, url]);
  };

  const clearNewFiles = () => {
    setNewFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onFormSubmit = async (formData: any) => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('description', formData.description);
      fd.append('shortDescription', formData.shortDescription || '');
      fd.append('price', formData.price);
      fd.append('compareAtPrice', formData.compareAtPrice || '');
      fd.append('category', formData.category);
      fd.append('brand', formData.brand || '');
      fd.append('totalStock', formData.totalStock || '0');
      fd.append('madeInAfrica', formData.madeInAfrica ? 'true' : 'false');
      fd.append('featured', formData.featured ? 'true' : 'false');
      fd.append('sizes', JSON.stringify(
        formData.sizes ? formData.sizes.split(',').map((s: string) => s.trim()).filter(Boolean) : []
      ));
      fd.append('colors', JSON.stringify(
        formData.colors ? formData.colors.split(',').map((c: string) => ({ name: c.trim(), hex: '#000000' })).filter((c: any) => c.name) : []
      ));
      fd.append('tags', JSON.stringify(
        formData.tags ? formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []
      ));

      // Append new files
      newFiles.forEach(file => {
        fd.append('images', file);
      });

      // If editing, tell backend which images to remove
      if (formMode === 'edit' && removedImages.length > 0) {
        fd.append('removeImages', JSON.stringify(removedImages));
      }

      if (formMode === 'edit' && editingProduct) {
        await productsApi.update(editingProduct._id, fd);
        toast.success('Product updated!');
      } else {
        await productsApi.create(fd);
        toast.success('Product created!');
      }

      qc.invalidateQueries({ queryKey: ['admin-products'] });
      setFormMode(null);
      reset({});
      setNewFiles([]);
      setExistingImages([]);
      setRemovedImages([]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-obsidian-900">Products</h1>
          <p className="text-sm text-obsidian-500 mt-0.5">{pagination?.total ?? 0} products in catalog</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-xs py-2.5 px-4 flex items-center gap-2">
          <Plus size={15} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-obsidian-400" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search products…" className="input-luxe pl-9 text-sm py-2.5" />
        </div>
        <div className="relative">
          <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
            className="input-luxe text-sm py-2.5 pr-8 appearance-none">
            <option value="">All categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-obsidian-400" />
        </div>
      </div>

      {/* Table */}
      <div className="card-luxe overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="space-y-px">{[...Array(8)].map((_, i) => <div key={i} className="h-16 skeleton" />)}</div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-obsidian-400">
              <p className="font-medium">No products found</p>
              <button onClick={openCreate} className="btn-primary text-xs py-2.5 px-4 mt-4">Add First Product</button>
            </div>
          ) : (
            <table className="table-luxe">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            (p.images?.[0] || '')
                              ? p.images[0].startsWith('http')
                                ? p.images[0]
                                : `http://localhost:5000${p.images[0]}`
                              : PLACEHOLDER
                          }
                          alt={p.name}
                          // No onError – let the browser show its own broken icon if truly missing
                          className="w-10 h-12 object-cover bg-obsidian-100 flex-shrink-0"
                        />
                        <div>
                          <p className="text-xs font-medium text-obsidian-900 line-clamp-1 max-w-[200px]">{p.name}</p>
                          <p className="text-[11px] text-obsidian-400">{p.brand || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-xs font-medium text-obsidian-600">{p.category}</td>
                    <td>
                      <div>
                        <span className="text-sm font-bold text-obsidian-900">{formatKES(p.price)}</span>
                        {p.compareAtPrice && (
                          <span className="block text-[11px] text-obsidian-400 line-through">{formatKES(p.compareAtPrice)}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`text-sm font-medium ${p.totalStock === 0 ? 'text-red-600' : p.totalStock < 5 ? 'text-amber-600' : 'text-obsidian-700'}`}>
                        {p.totalStock}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1">
                        {p.featured && <span className="text-[10px] bg-gold-300 text-obsidian-900 px-1.5 py-0.5 font-bold w-fit">FEATURED</span>}
                        {p.madeInAfrica && <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 font-bold w-fit">🌍 AFRICA</span>}
                        {!p.isActive && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 font-bold w-fit">INACTIVE</span>}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(p)} title="Edit"
                          className="p-1.5 text-obsidian-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => duplicateMutation.mutate(p._id)} title="Duplicate"
                          className="p-1.5 text-obsidian-400 hover:text-obsidian-700 hover:bg-obsidian-100 transition-colors">
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() => { if (window.confirm(`Delete "${p.name}"?`)) deleteMutation.mutate(p._id); }}
                          title="Delete"
                          className="p-1.5 text-obsidian-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-obsidian-100">
            <p className="text-xs text-obsidian-500">Page {page} of {pagination.pages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40">← Prev</button>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Product Modal */}
      {formMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setFormMode(null)}>
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-obsidian-100">
              <h2 className="font-semibold text-lg">{formMode === 'create' ? 'Add New Product' : 'Edit Product'}</h2>
              <button onClick={() => setFormMode(null)} className="btn-ghost p-2">✕</button>
            </div>

            <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label-luxe">Product Name *</label>
                  <input className={`input-luxe ${errors.name ? 'border-red-400' : ''}`}
                    {...register('name', { required: 'Required' })} placeholder="e.g. Ankara Wrap Dress" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{String(errors.name.message)}</p>}
                </div>

                <div className="col-span-2">
                  <label className="label-luxe">Description *</label>
                  <textarea rows={4} className={`input-luxe resize-none ${errors.description ? 'border-red-400' : ''}`}
                    {...register('description', { required: 'Required' })} />
                  {errors.description && <p className="text-red-500 text-xs mt-1">{String(errors.description.message)}</p>}
                </div>

                <div className="col-span-2">
                  <label className="label-luxe">Short Description</label>
                  <input className="input-luxe" {...register('shortDescription')} placeholder="One-line summary" />
                </div>

                <div>
                  <label className="label-luxe">Price (KES) *</label>
                  <input type="number" step="0.01" className={`input-luxe ${errors.price ? 'border-red-400' : ''}`}
                    {...register('price', { required: 'Required', min: 0 })} />
                  {errors.price && <p className="text-red-500 text-xs mt-1">{String(errors.price.message)}</p>}
                </div>

                <div>
                  <label className="label-luxe">Compare-at Price (KES)</label>
                  <input type="number" step="0.01" className="input-luxe" {...register('compareAtPrice')} placeholder="Original price for sale display" />
                </div>

                <div>
                  <label className="label-luxe">Category *</label>
                  <div className="relative">
                    <select className={`input-luxe appearance-none pr-8 ${errors.category ? 'border-red-400' : ''}`}
                      {...register('category', { required: 'Required' })}>
                      <option value="">Select category</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-obsidian-400" />
                  </div>
                  {errors.category && <p className="text-red-500 text-xs mt-1">{String(errors.category.message)}</p>}
                </div>

                <div>
                  <label className="label-luxe">Brand</label>
                  <input className="input-luxe" {...register('brand')} placeholder="e.g. Nike, FashionAfrica" />
                </div>

                <div>
                  <label className="label-luxe">Total Stock</label>
                  <input type="number" min="0" className="input-luxe" {...register('totalStock')} />
                </div>

                <div>
                  <label className="label-luxe">Sizes (comma-separated)</label>
                  <input className="input-luxe" {...register('sizes')} placeholder="XS, S, M, L, XL" />
                </div>

                <div className="col-span-2">
                  <label className="label-luxe">Colors (comma-separated names)</label>
                  <input className="input-luxe" {...register('colors')} placeholder="Black, White, Red" />
                </div>

                <div className="col-span-2">
                  <label className="label-luxe">Tags (comma-separated)</label>
                  <input className="input-luxe" {...register('tags')} placeholder="dress, formal, ankara" />
                </div>

                <div className="col-span-2 flex gap-6">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-luxe-500" {...register('madeInAfrica')} />
                    <span className="text-sm font-medium text-obsidian-700">🌍 Made in Africa</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-luxe-500" {...register('featured')} />
                    <span className="text-sm font-medium text-obsidian-700">⭐ Featured product</span>
                  </label>
                </div>

                {/* ── IMAGE UPLOAD SECTION ────────────────────── */}
                <div className="col-span-2">
                  <label className="label-luxe">Product Images</label>

                  {/* Existing images (edit mode) */}
                  {formMode === 'edit' && existingImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {existingImages.map((url, idx) => (
                        <div key={idx} className="relative group w-16 h-16 rounded border overflow-hidden">
                          <img
                            src={getImageSrc(url)}
                            alt="existing"
                            // No onError – show browser broken icon if missing
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(url)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove this image"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* New files preview */}
                  {newFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {newFiles.map((file, idx) => (
                        <div key={idx} className="w-16 h-16 rounded border overflow-hidden">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`preview ${idx}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={clearNewFiles}
                        className="w-16 h-16 flex items-center justify-center border border-dashed border-red-300 text-red-400 hover:bg-red-50 rounded text-xs"
                      >
                        Clear
                      </button>
                    </div>
                  )}

                  {/* Upload button */}
                  <label className="flex items-center gap-2 cursor-pointer bg-obsidian-50 hover:bg-obsidian-100 border border-dashed border-obsidian-300 rounded px-4 py-2 text-sm text-obsidian-600 transition-colors w-fit">
                    <Upload size={16} />
                    Choose Images
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-obsidian-400 mt-1">
                    {formMode === 'create'
                      ? 'Select one or more product images.'
                      : 'New images will be added to existing ones. You can also remove any image above.'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center py-3 text-sm gap-2">
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving…
                    </span>
                  ) : formMode === 'create' ? 'Create Product' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setFormMode(null)} className="btn-secondary px-5 py-3 text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}