import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Eye, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { authApi } from '../lib/api';
import { getImageUrl } from '../lib/imageUtils';   // ← import helper
import type { Product } from '../lib/types';
import { formatKES, getDiscountPercent } from '../lib/types';

// 🎯 Built‑in placeholder that never 404s
const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjgwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjgwMCIgZmlsbD0iI0YyRjJGMiIvPjx0ZXh0IHg9IjMwMCIgeT0iNDAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIwLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';

interface Props {
  product: Product;
  priority?: boolean;
}

export default function ProductCard({ product, priority = false }: Props) {
  const { user, toggleWishlist } = useAuthStore();
  const { addItem } = useCartStore();
  const [imgIdx, setImgIdx] = useState(0);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const isWishlisted = user?.wishlist?.includes(product._id);
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPct = hasDiscount ? getDiscountPercent(product.price, product.compareAtPrice!) : 0;

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to save items to your wishlist');
      return;
    }
    setWishlistLoading(true);
    try {
      await authApi.toggleWishlist(product._id);
      toggleWishlist(product._id);
      toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
    } catch {
      toast.error('Failed to update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to add items to your cart', {
        duration: 3000,
        icon: '🔒',
      });
      return;
    }
    if (product.totalStock === 0) {
      toast.error('This item is out of stock');
      return;
    }
    addItem({
      productId: product._id,
      name: product.name,
      image: getImageUrl(product.images?.[0]),   // ← absolute URL
      price: product.price,
      quantity: 1,
      size: product.sizes?.[0],
      color: product.colors?.[0]?.name,
      maxStock: product.totalStock,
    });
    toast.success('Added to cart!', {
      icon: '🛍️',
      duration: 2000,
    });
  };

  // Decide the final image source
  const imageSrc =
    product.images?.[imgIdx]
      ? getImageUrl(product.images[imgIdx])
      : PLACEHOLDER;   // ← built‑in SVG, never broken

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="group relative"
    >
      <Link to={`/product/${product.slug || product._id}`} className="block">
        {/* Image container */}
        <div className="product-image-wrap">
          <img
            src={imageSrc}
            alt={product.name}
            loading={priority ? 'eager' : 'lazy'}
            width={600}
            height={800}
            onMouseEnter={() => product.images?.length > 1 && setImgIdx(1)}
            onMouseLeave={() => setImgIdx(0)}
            className="transition-transform duration-500 group-hover:scale-105"
          />

          {/* Badges */}
          {hasDiscount && (
            <span className="badge-sale">-{discountPct}%</span>
          )}
          {!hasDiscount && product.category === 'NEW IN' && (
            <span className="badge-new">New</span>
          )}
          {product.madeInAfrica && (
            <span className="badge-africa">🌍 Africa</span>
          )}
          {product.totalStock === 0 && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="text-xs font-bold tracking-widest uppercase text-obsidian-600 bg-white px-3 py-1.5 border border-obsidian-300">
                Sold Out
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="absolute inset-x-0 bottom-0 p-3 flex gap-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={handleAddToCart}
              disabled={product.totalStock === 0}
              aria-label="Add to cart"
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-obsidian-900 text-white text-xs font-bold tracking-widest uppercase hover:bg-luxe-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingBag size={14} />
              {product.totalStock === 0 ? 'Sold Out' : 'Add to Cart'}
            </button>
            <Link
              to={`/product/${product.slug || product._id}`}
              aria-label="Quick view"
              className="w-12 flex items-center justify-center bg-white border border-obsidian-200 text-obsidian-700 hover:bg-obsidian-50 transition-colors"
            >
              <Eye size={16} />
            </Link>
          </div>

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            disabled={wishlistLoading}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className={`absolute top-3 right-3 w-9 h-9 flex items-center justify-center bg-white shadow-sm border border-obsidian-100 transition-all duration-200 hover:scale-110 ${
              isWishlisted ? 'text-red-500' : 'text-obsidian-400 opacity-0 group-hover:opacity-100'
            }`}
          >
            <Heart
              size={16}
              fill={isWishlisted ? 'currentColor' : 'none'}
            />
          </button>

          {/* Image dots */}
          {product.images?.length > 1 && (
            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {product.images.slice(0, 4).map((_, i) => (
                <button
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`}
                  onMouseEnter={() => setImgIdx(i)}
                  aria-label={`View image ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="pt-3 pb-1">
          {product.brand && (
            <p className="text-[10px] font-semibold tracking-widest uppercase text-obsidian-400 mb-1">
              {product.brand}
            </p>
          )}
          <h3 className="text-sm font-medium text-obsidian-900 line-clamp-2 leading-snug mb-2">
            {product.name}
          </h3>

          {/* Rating */}
          {product.rating > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={11}
                    className={star <= Math.round(product.rating) ? 'text-gold-400 fill-gold-400' : 'text-obsidian-200 fill-obsidian-200'}
                  />
                ))}
              </div>
              <span className="text-[10px] text-obsidian-400">({product.reviewCount})</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-obsidian-900">
              {formatKES(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-obsidian-400 line-through">
                {formatKES(product.compareAtPrice!)}
              </span>
            )}
          </div>

          {/* Stock warning */}
          {product.totalStock > 0 && product.totalStock < 5 && (
            <p className="text-[10px] text-red-500 font-medium mt-1">
              Only {product.totalStock} left!
            </p>
          )}
        </div>
      </Link>
    </motion.article>
  );
}