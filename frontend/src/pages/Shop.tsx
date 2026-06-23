import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { productsApi } from '../lib/api';
import type { Product } from '../lib/types';
import { NAV_LINKS } from '../lib/types';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Most Popular' },
];

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const madeInAfrica = searchParams.get('madeInAfrica') || '';
  const featured = searchParams.get('featured') || '';
  const [page, setPage] = useState(1);

  // Reset page on filter change
  useEffect(() => setPage(1), [category, search, sort, minPrice, maxPrice, madeInAfrica, featured]);

  const queryParams = {
    ...(category && { category }),
    ...(search && { search }),
    ...(sort && { sort }),
    ...(minPrice && { minPrice }),
    ...(maxPrice && { maxPrice }),
    ...(madeInAfrica && { madeInAfrica }),
    ...(featured && { featured }),
    page,
    limit: 12,
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['products', queryParams],
    queryFn: () => productsApi.getAll(queryParams).then((r) => r.data.data),
    staleTime: 1000 * 60 * 2,
  });

  const products: Product[] = data?.products || [];
  const pagination = data?.pagination;

  const setFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  const clearFilters = () => {
    setSearchParams(category ? { category } : {});
  };

  const activeFilters = [
    ...(minPrice ? [`Min: KES ${parseInt(minPrice).toLocaleString()}`] : []),
    ...(maxPrice ? [`Max: KES ${parseInt(maxPrice).toLocaleString()}`] : []),
    ...(madeInAfrica ? ['Made in Africa'] : []),
    ...(featured ? ['Featured'] : []),
  ];

  const pageTitle = search
    ? `Search results for "${search}"`
    : category
    ? category
    : 'All Products';

  return (
    <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 py-8">
      {/* Breadcrumb + title */}
      <div className="mb-8">
        <p className="text-xs text-obsidian-400 mb-2">
          Home / {category || 'Shop'}{search ? ` / "${search}"` : ''}
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-obsidian-900">
          {pageTitle}
        </h1>
        {pagination && (
          <p className="text-sm text-obsidian-500 mt-1">{pagination.total} products</p>
        )}
      </div>

      <div className="flex gap-8">
        {/* ── Sidebar filters (desktop) ── */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            {/* Categories */}
            <div>
              <h3 className="text-xs font-bold tracking-widest uppercase text-obsidian-500 mb-3">Category</h3>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => setFilter('category', '')}
                    className={`text-sm w-full text-left px-2 py-1.5 transition-colors ${!category ? 'text-luxe-600 font-semibold' : 'text-obsidian-700 hover:text-luxe-600'}`}
                  >
                    All Products
                  </button>
                </li>
                {NAV_LINKS.filter(l => !['SHOP BY BODY FIT', 'DISCOVER'].includes(l)).map((l) => (
                  <li key={l}>
                    <button
                      onClick={() => setFilter('category', l)}
                      className={`text-sm w-full text-left px-2 py-1.5 transition-colors ${category === l ? 'text-luxe-600 font-semibold' : 'text-obsidian-700 hover:text-luxe-600'}`}
                    >
                      {l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Price range */}
            <div>
              <h3 className="text-xs font-bold tracking-widest uppercase text-obsidian-500 mb-3">Price (KES)</h3>
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Min price"
                  value={minPrice}
                  onChange={(e) => setFilter('minPrice', e.target.value)}
                  className="input-luxe text-sm py-2"
                />
                <input
                  type="number"
                  placeholder="Max price"
                  value={maxPrice}
                  onChange={(e) => setFilter('maxPrice', e.target.value)}
                  className="input-luxe text-sm py-2"
                />
              </div>
            </div>

            {/* Special filters */}
            <div>
              <h3 className="text-xs font-bold tracking-widest uppercase text-obsidian-500 mb-3">Filter</h3>
              <label className="flex items-center gap-2.5 cursor-pointer group mb-2">
                <input
                  type="checkbox"
                  checked={!!madeInAfrica}
                  onChange={(e) => setFilter('madeInAfrica', e.target.checked ? 'true' : '')}
                  className="w-4 h-4 accent-luxe-500"
                />
                <span className="text-sm text-obsidian-700 group-hover:text-luxe-600">Made in Africa 🌍</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={!!featured}
                  onChange={(e) => setFilter('featured', e.target.checked ? 'true' : '')}
                  className="w-4 h-4 accent-luxe-500"
                />
                <span className="text-sm text-obsidian-700 group-hover:text-luxe-600">Featured items</span>
              </label>
            </div>

            {activeFilters.length > 0 && (
              <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium">
                Clear all filters ×
              </button>
            )}
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
            {/* Active filter chips */}
            <div className="flex items-center gap-2 flex-wrap">
              {activeFilters.map((f) => (
                <span key={f} className="inline-flex items-center gap-1.5 text-xs bg-obsidian-100 text-obsidian-700 px-3 py-1.5 font-medium">
                  {f}
                  <button onClick={clearFilters} className="hover:text-red-500" aria-label={`Remove ${f} filter`}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3 ml-auto">
              {/* Mobile filter button */}
              <button
                onClick={() => setFiltersOpen(true)}
                className="lg:hidden btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
              >
                <Filter size={14} />
                Filters
              </button>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setFilter('sort', e.target.value)}
                  className="input-luxe text-xs py-2 pr-8 appearance-none cursor-pointer"
                  aria-label="Sort products"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-obsidian-400" />
              </div>
            </div>
          </div>

          {/* Products grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-[3/4] skeleton" />
                  <div className="h-4 skeleton w-3/4" />
                  <div className="h-4 skeleton w-1/3" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24">
              <p className="font-display text-2xl text-obsidian-400 mb-3">No products found</p>
              <p className="text-obsidian-500 text-sm mb-6">Try adjusting your filters or search term</p>
              <button onClick={clearFilters} className="btn-secondary text-xs py-2.5 px-6">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6 ${isFetching ? 'opacity-60 transition-opacity' : ''}`}>
              {products.map((p, i) => (
                <ProductCard key={p._id} product={p} priority={i < 4} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-xs py-2 px-4 disabled:opacity-40"
              >
                ← Prev
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(pagination.pages, 7) }).map((_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 text-sm font-medium transition-colors ${
                        p === page
                          ? 'bg-obsidian-900 text-white'
                          : 'text-obsidian-700 hover:bg-obsidian-100'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="btn-secondary text-xs py-2 px-4 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filters drawer */}
      <AnimatePresence>
        {filtersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50"
              onClick={() => setFiltersOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed inset-y-0 left-0 z-50 w-80 bg-white overflow-y-auto"
            >
              <div className="flex items-center justify-between p-5 border-b border-obsidian-100">
                <h2 className="font-semibold text-obsidian-900 flex items-center gap-2">
                  <SlidersHorizontal size={16} /> Filters
                </h2>
                <button onClick={() => setFiltersOpen(false)} className="btn-ghost p-1.5">
                  <X size={20} />
                </button>
              </div>
              <div className="p-5 space-y-6">
                {/* Categories */}
                <div>
                  <h3 className="text-xs font-bold tracking-widest uppercase text-obsidian-500 mb-3">Category</h3>
                  <ul className="space-y-1">
                    {NAV_LINKS.filter(l => !['SHOP BY BODY FIT', 'DISCOVER'].includes(l)).map((l) => (
                      <li key={l}>
                        <button
                          onClick={() => { setFilter('category', l); setFiltersOpen(false); }}
                          className={`text-sm w-full text-left px-2 py-2 transition-colors ${category === l ? 'text-luxe-600 font-semibold' : 'text-obsidian-700'}`}
                        >
                          {l}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-bold tracking-widest uppercase text-obsidian-500 mb-3">Price (KES)</h3>
                  <div className="space-y-2">
                    <input type="number" placeholder="Min price" value={minPrice} onChange={(e) => setFilter('minPrice', e.target.value)} className="input-luxe text-sm py-2" />
                    <input type="number" placeholder="Max price" value={maxPrice} onChange={(e) => setFilter('maxPrice', e.target.value)} className="input-luxe text-sm py-2" />
                  </div>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={!!madeInAfrica} onChange={(e) => setFilter('madeInAfrica', e.target.checked ? 'true' : '')} className="w-4 h-4 accent-luxe-500" />
                  <span className="text-sm text-obsidian-700">Made in Africa 🌍</span>
                </label>

                <button onClick={() => { clearFilters(); setFiltersOpen(false); }} className="btn-secondary w-full text-xs py-2.5">
                  Clear All Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
