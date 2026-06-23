import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { formatKES } from '../lib/types';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, tax, shippingCost, total, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!user) {
      toast.error('Please sign in to proceed to checkout', { icon: '🔒' });
      navigate('/account/login?redirect=/checkout');
      return;
    }
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 py-24 text-center">
        <ShoppingBag size={56} className="mx-auto text-obsidian-200 mb-5" />
        <h1 className="font-display text-3xl font-semibold text-obsidian-900 mb-3">Your cart is empty</h1>
        <p className="text-obsidian-500 mb-8">Explore our collection and add items to get started.</p>
        <Link to="/shop" className="btn-primary text-sm py-3 px-8">Explore Collection</Link>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-semibold text-obsidian-900">
          Shopping Cart <span className="text-obsidian-400 text-xl font-normal">({items.length})</span>
        </h1>
        <button onClick={clearCart} className="text-xs text-obsidian-400 hover:text-red-500 transition-colors">
          Clear cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 p-4 bg-white border border-obsidian-100">
              <Link to={`/product/${item.productId}`} className="flex-shrink-0 w-28 h-36 overflow-hidden bg-obsidian-50">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              </Link>

              <div className="flex-1 min-w-0">
                <Link to={`/product/${item.productId}`} className="text-sm font-semibold text-obsidian-900 hover:text-luxe-600 transition-colors line-clamp-2">
                  {item.name}
                </Link>
                {(item.size || item.color) && (
                  <p className="text-xs text-obsidian-500 mt-1">{[item.size, item.color].filter(Boolean).join(' · ')}</p>
                )}
                <p className="text-base font-bold text-obsidian-900 mt-2">{formatKES(item.price)}</p>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-obsidian-200">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label="Decrease"
                      className="w-9 h-9 flex items-center justify-center hover:bg-obsidian-50 transition-colors"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.maxStock}
                      aria-label="Increase"
                      className="w-9 h-9 flex items-center justify-center hover:bg-obsidian-50 transition-colors disabled:opacity-40"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <button onClick={() => removeItem(item.id)} aria-label="Remove item"
                    className="p-2 text-obsidian-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-shrink-0 text-right">
                <p className="text-base font-bold text-obsidian-900">{formatKES(item.price * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div>
          <div className="bg-obsidian-50 border border-obsidian-100 p-6 sticky top-24">
            <h2 className="font-semibold text-obsidian-900 mb-5">Order Summary</h2>

            <div className="space-y-3 text-sm mb-5">
              <div className="flex justify-between text-obsidian-600">
                <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span>{formatKES(subtotal())}</span>
              </div>
              <div className="flex justify-between text-obsidian-600">
                <span>Shipping</span>
                <span>{shippingCost() === 0 ? <span className="text-green-600 font-medium">Free</span> : formatKES(shippingCost())}</span>
              </div>
              <div className="flex justify-between text-obsidian-600">
                <span>VAT (16%)</span>
                <span>{formatKES(tax())}</span>
              </div>
              <div className="flex justify-between font-bold text-lg text-obsidian-900 pt-3 border-t border-obsidian-200">
                <span>Total</span>
                <span>{formatKES(total())}</span>
              </div>
            </div>

            {shippingCost() > 0 && (
              <p className="text-xs text-obsidian-500 bg-white border border-obsidian-100 px-3 py-2 mb-4">
                Add <strong>{formatKES(5000 - subtotal())}</strong> more for free shipping
              </p>
            )}
            {shippingCost() === 0 && (
              <p className="text-xs text-green-600 font-medium bg-green-50 px-3 py-2 mb-4">✓ Free shipping applied!</p>
            )}

            <button onClick={handleCheckout} className="btn-primary w-full justify-center py-4 text-sm gap-2">
              {user ? 'Proceed to Checkout' : 'Sign in to Checkout'}
              <ArrowRight size={16} />
            </button>

            <Link to="/shop" className="block text-center text-xs text-obsidian-500 hover:text-obsidian-900 transition-colors mt-4">
              ← Continue Shopping
            </Link>

            <div className="mt-5 pt-4 border-t border-obsidian-200">
              <p className="text-[11px] text-obsidian-400 text-center">
                Secure checkout · M-Pesa · Visa · Mastercard
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
