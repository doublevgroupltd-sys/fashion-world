import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Star, Truck, RotateCcw, Shield, X, ZoomIn, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ProductCard from '../components/ProductCard';
import { productsApi, authApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { formatKES, getDiscountPercent } from '../lib/types';
import type { Product } from '../lib/types';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, toggleWishlist } = useAuthStore();
  const { addItem } = useCartStore();

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getById(id!).then((r) => r.data.data),
    enabled: !!id,
  });

  const product: Product | undefined = data?.product;
  const related: Product[] = data?.related || [];

  const isWishlisted = product ? user?.wishlist?.includes(product._id) : false;
  const hasDiscount = product?.compareAtPrice && product.compareAtPrice > product.price;
  const discountPct = hasDiscount ? getDiscountPercent(product!.price, product!.compareAtPrice!) : 0;

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Please sign in to add items to your cart', { icon: '🔒' });
      navigate('/account/login?redirect=' + window.location.pathname);
      return;
    }
    if (!product) return;
    if (product.sizes.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }
    if (product.colors.length > 0 && !selectedColor) {
      toast.error('Please select a color');
      return;
    }
    if (product.totalStock === 0) {
      toast.error('This product is out of stock');
      return;
    }

    addItem({
      productId: product._id,
      name: product.name,
      image: product.images[0] || '',
      price: product.price,
      quantity,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
      maxStock: product.totalStock,
    });
    toast.success('Added to cart!', { icon: '🛍️' });
  };

  const handleWishlist = async () => {
    if (!user) { toast.error('Please sign in'); return; }
    if (!product) return;
    setWishlistLoading(true);
    try {
      await authApi.toggleWishlist(product._id);
      toggleWishlist(product._id);
      toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist ♥');
    } catch { toast.error('Failed to update wishlist'); }
    finally { setWishlistLoading(false); }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product?.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (isLoading) return (
    <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-3">
          <div className="aspect-[3/4] skeleton" />
          <div className="grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => <div key={i} className="aspect-square skeleton" />)}
          </div>
        </div>
        <div className="space-y-4 pt-4">
          {[...Array(6)].map((_, i) => <div key={i} className={`skeleton h-${[4,8,4,16,10,12][i]}`} />)}
        </div>
      </div>
    </div>
  );

  if (isError || !product) return (
    <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 py-24 text-center">
      <h2 className="font-display text-2xl text-obsidian-600 mb-3">Product not found</h2>
      <Link to="/shop" className="btn-primary text-xs py-3 px-6">Back to Shop</Link>
    </div>
  );

  return (
    <>
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-obsidian-400 mb-8" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-obsidian-700">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-obsidian-700">Shop</Link>
          <span>/</span>
          <Link to={`/shop?category=${product.category}`} className="hover:text-obsidian-700">{product.category}</Link>
          <span>/</span>
          <span className="text-obsidian-700 line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16">
          {/* ── Image gallery ── */}
          <div className="space-y-3">
            {/* Main image */}
            <div
              className="relative overflow-hidden bg-obsidian-50 cursor-zoom-in"
              style={{ aspectRatio: '3/4' }}
              onClick={() => setLightboxOpen(true)}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImg}
                  src={product.images[activeImg] || 'https://images.unsplash.com/photo-1594938298870-e41f0ed4e3e2?w=800&q=80'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              </AnimatePresence>

              {/* Badges */}
              {hasDiscount && <span className="badge-sale text-sm">-{discountPct}%</span>}
              {product.madeInAfrica && <span className="badge-africa">🌍 Made in Africa</span>}

              {/* Zoom hint */}
              <div className="absolute bottom-3 right-3 w-8 h-8 bg-white/80 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <ZoomIn size={16} className="text-obsidian-700" />
              </div>
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`aspect-square overflow-hidden bg-obsidian-50 border-2 transition-colors ${i === activeImg ? 'border-obsidian-900' : 'border-transparent hover:border-obsidian-300'}`}
                    aria-label={`View image ${i + 1}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product info ── */}
          <div className="pt-2 lg:pt-0">
            {/* Brand & name */}
            {product.brand && (
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-obsidian-400 mb-2">{product.brand}</p>
            )}
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-obsidian-900 leading-tight mb-3">
              {product.name}
            </h1>

            {/* Rating */}
            {product.rating > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={14} className={s <= Math.round(product.rating) ? 'text-gold-400 fill-gold-400' : 'text-obsidian-200 fill-obsidian-200'} />
                  ))}
                </div>
                <span className="text-sm text-obsidian-500">{product.rating} ({product.reviewCount} reviews)</span>
                {product.soldCount > 0 && <span className="text-xs text-obsidian-400">· {product.soldCount.toLocaleString()} sold</span>}
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="font-display text-3xl font-bold text-obsidian-900">{formatKES(product.price)}</span>
              {hasDiscount && (
                <>
                  <span className="text-xl text-obsidian-400 line-through">{formatKES(product.compareAtPrice!)}</span>
                  <span className="text-sm font-bold text-red-600 bg-red-50 px-2 py-0.5">Save {discountPct}%</span>
                </>
              )}
            </div>

            {/* Short description */}
            {product.shortDescription && (
              <p className="text-sm text-obsidian-600 leading-relaxed mb-6 border-l-2 border-luxe-400 pl-4">
                {product.shortDescription}
              </p>
            )}

            {/* Color selector */}
            {product.colors.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2.5">
                  <label className="label-luxe">Color</label>
                  {selectedColor && <span className="text-xs text-obsidian-600">{selectedColor}</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColor(c.name)}
                      title={c.name}
                      aria-label={`Select color ${c.name}`}
                      aria-pressed={selectedColor === c.name}
                      className={`w-9 h-9 border-2 transition-all ${selectedColor === c.name ? 'border-obsidian-900 scale-110' : 'border-obsidian-200 hover:border-obsidian-400'}`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size selector */}
            {product.sizes.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2.5">
                  <label className="label-luxe">Size</label>
                  <button className="text-xs text-luxe-600 underline">Size guide</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      aria-pressed={selectedSize === s}
                      className={`min-w-[44px] h-11 px-3 text-sm font-medium border transition-all ${
                        selectedSize === s
                          ? 'bg-obsidian-900 text-white border-obsidian-900'
                          : 'bg-white text-obsidian-700 border-obsidian-200 hover:border-obsidian-900'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <label className="label-luxe">Quantity</label>
              <div className="flex items-center border border-obsidian-200 w-fit">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-11 h-11 flex items-center justify-center hover:bg-obsidian-50 transition-colors"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-12 text-center text-sm font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.totalStock, q + 1))}
                  className="w-11 h-11 flex items-center justify-center hover:bg-obsidian-50 transition-colors"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              {product.totalStock < 5 && product.totalStock > 0 && (
                <p className="text-xs text-red-500 font-medium mt-1.5">Only {product.totalStock} left in stock!</p>
              )}
            </div>

            {/* CTA buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={handleAddToCart}
                disabled={product.totalStock === 0}
                className="btn-primary flex-1 py-4 text-sm gap-2.5 disabled:opacity-50"
              >
                <ShoppingBag size={18} />
                {product.totalStock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                onClick={handleWishlist}
                disabled={wishlistLoading}
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                className={`btn-secondary w-14 h-[52px] flex items-center justify-center ${isWishlisted ? 'border-red-500 text-red-500' : ''}`}
              >
                <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={handleShare}
                aria-label="Share product"
                className="btn-ghost w-14 h-[52px] flex items-center justify-center border border-obsidian-200"
              >
                <Share2 size={18} />
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 py-5 border-y border-obsidian-100 mb-6 text-center">
              {[
                { icon: <Truck size={16} />, text: 'Free delivery\nover KES 5,000' },
                { icon: <RotateCcw size={16} />, text: '30-day\nfree returns' },
                { icon: <Shield size={16} />, text: 'Secure\npayment' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex flex-col items-center gap-1.5 text-obsidian-600">
                  {icon}
                  <span className="text-[11px] leading-tight whitespace-pre-line">{text}</span>
                </div>
              ))}
            </div>

            {/* Full description */}
            <div>
              <h3 className="text-sm font-bold tracking-widest uppercase text-obsidian-500 mb-3">Product Details</h3>
              <p className="text-sm text-obsidian-700 leading-relaxed">{product.description}</p>

              {product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {product.tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/shop?search=${encodeURIComponent(tag)}`}
                      className="text-[11px] bg-obsidian-50 text-obsidian-600 px-3 py-1 hover:bg-obsidian-100 transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <section className="mt-20">
            <div className="mb-8">
              <p className="section-eyebrow">You May Also Like</p>
              <h2 className="section-title">Related Products</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
              {related.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          </section>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lightbox-overlay"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              className="absolute top-4 right-4 w-10 h-10 bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close lightbox"
            >
              <X size={20} />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={product.images[activeImg]}
              alt={product.name}
              className="max-w-3xl max-h-[85vh] w-full h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            {product.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {product.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setActiveImg(i); }}
                    className={`w-2 h-2 rounded-full transition-all ${i === activeImg ? 'bg-white scale-125' : 'bg-white/50'}`}
                    aria-label={`Image ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
