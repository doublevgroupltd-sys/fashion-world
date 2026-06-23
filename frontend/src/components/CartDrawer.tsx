import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { formatKES } from '../lib/types';
import toast from 'react-hot-toast';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, itemCount, subtotal, tax, shippingCost, total } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeCart(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeCart]);

  const handleCheckout = () => {
    if (!user) {
      toast.error('Please sign in to continue to checkout', { icon: '🔒' });
      closeCart();
      navigate('/account/login?redirect=/checkout');
      return;
    }
    closeCart();
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={closeCart}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
            className="cart-drawer"
            role="dialog"
            aria-label="Shopping cart"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-obsidian-100">
              <div className="flex items-center gap-2.5">
                <ShoppingBag size={20} className="text-obsidian-700" />
                <h2 className="font-semibold text-obsidian-900">
                  Your Cart
                  {itemCount() > 0 && (
                    <span className="ml-2 text-sm text-obsidian-400 font-normal">
                      ({itemCount()} item{itemCount() !== 1 ? 's' : ''})
                    </span>
                  )}
                </h2>
              </div>
              <button
                onClick={closeCart}
                aria-label="Close cart"
                className="p-1.5 hover:bg-obsidian-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto py-4 px-5">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-16">
                  <ShoppingBag size={48} className="text-obsidian-200 mb-4" />
                  <h3 className="font-display text-xl font-semibold text-obsidian-900 mb-2">
                    Your cart is empty
                  </h3>
                  <p className="text-sm text-obsidian-500 mb-6">
                    Discover our luxury collection and add items to get started.
                  </p>
                  <button onClick={() => { closeCart(); navigate('/shop'); }} className="btn-primary text-xs px-6 py-3">
                    Explore Collection
                  </button>
                </div>
              ) : (
                <ul className="space-y-4">
                  {items.map((item) => (
                    <li key={item.id} className="flex gap-4">
                      {/* Image */}
                      <Link
                        to={`/product/${item.productId}`}
                        onClick={closeCart}
                        className="flex-shrink-0 w-24 h-28 bg-obsidian-50 overflow-hidden"
                      >
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1594938298870-e41f0ed4e3e2?w=200&q=80'}
                          alt={item.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </Link>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/product/${item.productId}`}
                          onClick={closeCart}
                          className="text-sm font-medium text-obsidian-900 line-clamp-2 leading-snug hover:text-luxe-600 transition-colors"
                        >
                          {item.name}
                        </Link>

                        {(item.size || item.color) && (
                          <p className="text-xs text-obsidian-400 mt-0.5">
                            {[item.size, item.color].filter(Boolean).join(' · ')}
                          </p>
                        )}

                        <p className="text-sm font-bold text-obsidian-900 mt-1">
                          {formatKES(item.price)}
                        </p>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center border border-obsidian-200">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              aria-label="Decrease quantity"
                              className="w-8 h-8 flex items-center justify-center hover:bg-obsidian-50 transition-colors"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.maxStock}
                              aria-label="Increase quantity"
                              className="w-8 h-8 flex items-center justify-center hover:bg-obsidian-50 transition-colors disabled:opacity-40"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(item.id)}
                            aria-label="Remove item"
                            className="p-1.5 text-obsidian-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Subtotal */}
                      <div className="flex-shrink-0 text-right">
                        <span className="text-sm font-bold text-obsidian-900">
                          {formatKES(item.price * item.quantity)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer — totals and checkout */}
            {items.length > 0 && (
              <div className="border-t border-obsidian-100 px-5 py-5 space-y-3">
                {/* Shipping callout */}
                {shippingCost() === 0 ? (
                  <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 text-xs font-medium">
                    <span>✓</span> You qualify for free shipping!
                  </div>
                ) : (
                  <div className="text-xs text-obsidian-500 bg-obsidian-50 px-3 py-2">
                    Add <strong>{formatKES(5000 - subtotal())}</strong> more for free shipping
                  </div>
                )}

                {/* Line items */}
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-obsidian-600">
                    <span>Subtotal</span>
                    <span>{formatKES(subtotal())}</span>
                  </div>
                  <div className="flex justify-between text-obsidian-600">
                    <span>Shipping</span>
                    <span>{shippingCost() === 0 ? 'Free' : formatKES(shippingCost())}</span>
                  </div>
                  <div className="flex justify-between text-obsidian-600">
                    <span>VAT (16%)</span>
                    <span>{formatKES(tax())}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base text-obsidian-900 pt-2 border-t border-obsidian-100">
                    <span>Total</span>
                    <span>{formatKES(total())}</span>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={handleCheckout}
                  className="btn-primary w-full justify-center py-4 text-sm gap-3"
                >
                  {user ? 'Proceed to Checkout' : 'Sign in to Checkout'}
                  <ArrowRight size={16} />
                </button>

                <Link
                  to="/cart"
                  onClick={closeCart}
                  className="block text-center text-xs text-obsidian-500 hover:text-obsidian-900 transition-colors py-1"
                >
                  View full cart
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
