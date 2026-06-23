import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { CheckCircle, CreditCard, Smartphone, Package, ChevronDown } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { ordersApi, paymentsApi } from '@/lib/api';
import { formatKES, KENYA_COUNTIES } from '@/lib/types';

interface CheckoutForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  county: string;
  country: string;
  postalCode?: string;
  notes?: string;
}

type PaymentMethod = 'mpesa' | 'card' | 'cod';

export default function CheckoutPage() {
  const { items, subtotal, tax, shippingCost, total, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [step, setStep] = useState<'address' | 'payment' | 'success'>('address');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const [mpesaPhone, setMpesaPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<CheckoutForm>({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      country: 'Kenya',
      county: user?.address?.county || '',
      city: user?.address?.city || '',
    },
  });

  if (items.length === 0 && step !== 'success') {
    return (
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 py-24 text-center">
        <h2 className="font-display text-2xl text-obsidian-600 mb-3">Your cart is empty</h2>
        <Link to="/shop" className="btn-primary text-xs py-3 px-6">Continue Shopping</Link>
      </div>
    );
  }

  const handleAddressSubmit = () => setStep('payment');

  const handlePlaceOrder = async () => {
    setLoading(true);
    const address = getValues();
    try {
      const orderPayload = {
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          size: i.size,
          color: i.color,
        })),
        shippingAddress: {
          firstName: address.firstName,
          lastName: address.lastName,
          phone: address.phone,
          email: address.email,
          street: address.street,
          city: address.city,
          county: address.county,
          country: address.country,
          postalCode: address.postalCode,
        },
        paymentMethod,
        notes: address.notes,
      };

      const { data } = await ordersApi.create(orderPayload);
      const order = data.data.order;
      setCreatedOrder(order);

      // Handle payment
      if (paymentMethod === 'mpesa') {
        await paymentsApi.mpesaStkPush(mpesaPhone || address.phone, order._id);
        toast.success('M-Pesa STK push sent! Enter your PIN to complete.');
      } else if (paymentMethod === 'card') {
        const intentRes = await paymentsApi.createStripeIntent(order._id);
        if (intentRes.data.data.isDemo) {
          await paymentsApi.confirmStripe(order._id);
          toast.success('Payment confirmed! (Demo mode)');
        }
      } else {
        toast.success('Order placed! Pay on delivery.');
      }

      clearCart();
      setStep('success');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Order failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        <h1 className="font-display text-3xl font-semibold text-obsidian-900 mb-3">
          Order Confirmed!
        </h1>
        <p className="text-obsidian-600 mb-2">
          Thank you for your order, <strong>{user?.firstName}</strong>!
        </p>
        {createdOrder && (
          <p className="text-sm text-obsidian-500 mb-6">
            Order number: <span className="font-mono font-bold text-obsidian-900">{createdOrder.orderNumber}</span>
          </p>
        )}
        <p className="text-sm text-obsidian-500 mb-8">
          A confirmation has been sent to <strong>{user?.email}</strong>.
          Your order will be delivered within 3–5 business days.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/account/orders" className="btn-primary text-xs py-3 px-6">
            View My Orders
          </Link>
          <Link to="/shop" className="btn-secondary text-xs py-3 px-6">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 lg:px-8 py-10">
      <h1 className="font-display text-3xl font-semibold text-obsidian-900 mb-8">Checkout</h1>

      <div className="flex items-center gap-2 mb-10">
        {(['address', 'payment'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              step === s ? 'bg-obsidian-900 text-white' :
              i < (['address', 'payment'].indexOf(step)) ? 'bg-green-500 text-white' :
              'bg-obsidian-100 text-obsidian-400'
            }`}>
              {i < (['address', 'payment'].indexOf(step)) ? '✓' : i + 1}
            </div>
            <span className={`text-sm font-medium capitalize ${step === s ? 'text-obsidian-900' : 'text-obsidian-400'}`}>
              {s === 'address' ? 'Shipping Address' : 'Payment'}
            </span>
            {i < 1 && <span className="mx-2 text-obsidian-200">—</span>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(handleAddressSubmit)}>
            {step === 'address' && (
              <div className="space-y-5">
                <h2 className="font-semibold text-lg text-obsidian-900 mb-4">Shipping Address</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-luxe" htmlFor="firstName">First name</label>
                    <input id="firstName" className={`input-luxe ${errors.firstName ? 'border-red-400' : ''}`}
                      {...register('firstName', { required: 'Required' })} />
                    {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                  </div>
                  <div>
                    <label className="label-luxe" htmlFor="lastName">Last name</label>
                    <input id="lastName" className={`input-luxe ${errors.lastName ? 'border-red-400' : ''}`}
                      {...register('lastName', { required: 'Required' })} />
                    {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-luxe" htmlFor="checkout-email">Email</label>
                    <input id="checkout-email" type="email" className={`input-luxe ${errors.email ? 'border-red-400' : ''}`}
                      {...register('email', { required: 'Required' })} />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="label-luxe" htmlFor="checkout-phone">Phone</label>
                    <input id="checkout-phone" type="tel" className={`input-luxe ${errors.phone ? 'border-red-400' : ''}`}
                      placeholder="+254 7XX XXX XXX"
                      {...register('phone', { required: 'Required' })} />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                  </div>
                </div>
                <div>
                  <label className="label-luxe" htmlFor="street">Street address</label>
                  <input id="street" className={`input-luxe ${errors.street ? 'border-red-400' : ''}`}
                    placeholder="e.g. 123 Kimathi Street, Apt 4B"
                    {...register('street', { required: 'Required' })} />
                  {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-luxe" htmlFor="city">City / Town</label>
                    <input id="city" className={`input-luxe ${errors.city ? 'border-red-400' : ''}`}
                      placeholder="e.g. Nairobi"
                      {...register('city', { required: 'Required' })} />
                    {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
                  </div>
                  <div>
                    <label className="label-luxe" htmlFor="county">County</label>
                    <div className="relative">
                      <select id="county" className={`input-luxe appearance-none pr-8 ${errors.county ? 'border-red-400' : ''}`}
                        {...register('county', { required: 'Required' })}>
                        <option value="">Select county</option>
                        {KENYA_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        <option value="International">International</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-obsidian-400" />
                    </div>
                    {errors.county && <p className="text-red-500 text-xs mt-1">{errors.county.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-luxe" htmlFor="country">Country</label>
                    <input id="country" className="input-luxe" defaultValue="Kenya"
                      {...register('country', { required: 'Required' })} />
                  </div>
                  <div>
                    <label className="label-luxe" htmlFor="postalCode">Postal code (optional)</label>
                    <input id="postalCode" className="input-luxe" placeholder="e.g. 00100" {...register('postalCode')} />
                  </div>
                </div>
                <div>
                  <label className="label-luxe" htmlFor="notes">Order notes (optional)</label>
                  <textarea id="notes" rows={3} className="input-luxe resize-none"
                    placeholder="Special delivery instructions..."
                    {...register('notes')} />
                </div>
                <button type="submit" className="btn-primary w-full py-4 text-sm justify-center">
                  Continue to Payment →
                </button>
              </div>
            )}
          </form>

          {step === 'payment' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setStep('address')} className="text-xs text-luxe-600 hover:underline">
                  ← Edit address
                </button>
              </div>
              <h2 className="font-semibold text-lg text-obsidian-900">Payment Method</h2>
              <div className="space-y-3">
                <label className={`flex items-start gap-4 p-4 border-2 cursor-pointer transition-colors ${paymentMethod === 'mpesa' ? 'border-obsidian-900 bg-obsidian-50' : 'border-obsidian-200 hover:border-obsidian-400'}`}>
                  <input type="radio" name="payment" value="mpesa" checked={paymentMethod === 'mpesa'}
                    onChange={() => setPaymentMethod('mpesa')} className="mt-0.5 accent-obsidian-900" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Smartphone size={18} className="text-green-600" />
                      <span className="font-semibold text-sm">M-Pesa</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 font-medium">Recommended</span>
                    </div>
                    <p className="text-xs text-obsidian-500 mt-1">Pay instantly with M-Pesa STK push</p>
                    {paymentMethod === 'mpesa' && (
                      <div className="mt-3">
                        <label className="label-luxe" htmlFor="mpesa-phone">M-Pesa phone number</label>
                        <input
                          id="mpesa-phone"
                          type="tel"
                          value={mpesaPhone}
                          onChange={(e) => setMpesaPhone(e.target.value)}
                          className="input-luxe text-sm py-2.5"
                          placeholder="+254 7XX XXX XXX"
                        />
                      </div>
                    )}
                  </div>
                </label>
                <label className={`flex items-start gap-4 p-4 border-2 cursor-pointer transition-colors ${paymentMethod === 'card' ? 'border-obsidian-900 bg-obsidian-50' : 'border-obsidian-200 hover:border-obsidian-400'}`}>
                  <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')} className="mt-0.5 accent-obsidian-900" />
                  <div>
                    <div className="flex items-center gap-2">
                      <CreditCard size={18} className="text-blue-600" />
                      <span className="font-semibold text-sm">Credit / Debit Card</span>
                    </div>
                    <p className="text-xs text-obsidian-500 mt-1">Visa, Mastercard, American Express · Powered by Stripe</p>
                    {paymentMethod === 'card' && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 text-xs text-blue-700">
                        Demo mode: Card payment will be simulated automatically.
                      </div>
                    )}
                  </div>
                </label>
                <label className={`flex items-start gap-4 p-4 border-2 cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'border-obsidian-900 bg-obsidian-50' : 'border-obsidian-200 hover:border-obsidian-400'}`}>
                  <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')} className="mt-0.5 accent-obsidian-900" />
                  <div>
                    <div className="flex items-center gap-2">
                      <Package size={18} className="text-amber-600" />
                      <span className="font-semibold text-sm">Cash on Delivery</span>
                    </div>
                    <p className="text-xs text-obsidian-500 mt-1">Pay in cash when your order arrives</p>
                  </div>
                </label>
              </div>
              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="btn-primary w-full py-4 text-sm justify-center gap-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing…
                  </span>
                ) : (
                  `Place Order — ${formatKES(total())}`
                )}
              </button>
              <p className="text-xs text-obsidian-400 text-center">
                By placing this order you agree to our{' '}
                <Link to="/terms" className="text-luxe-600 hover:underline">Terms of Service</Link>.
              </p>
            </div>
          )}
        </div>

        <div>
          <div className="bg-obsidian-50 border border-obsidian-100 p-6 sticky top-24">
            <h2 className="font-semibold text-obsidian-900 mb-5">Order Summary</h2>
            <ul className="space-y-4 mb-5">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <div className="relative w-16 h-20 bg-obsidian-100 flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-obsidian-700 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-obsidian-900 line-clamp-2">{item.name}</p>
                    {item.size && <p className="text-[11px] text-obsidian-400 mt-0.5">{item.size}{item.color ? ` · ${item.color}` : ''}</p>}
                    <p className="text-xs font-bold text-obsidian-900 mt-1">{formatKES(item.price * item.quantity)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-obsidian-200 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-obsidian-600">
                <span>Subtotal</span><span>{formatKES(subtotal())}</span>
              </div>
              <div className="flex justify-between text-obsidian-600">
                <span>Shipping</span>
                <span>{shippingCost() === 0 ? <span className="text-green-600 font-medium">Free</span> : formatKES(shippingCost())}</span>
              </div>
              <div className="flex justify-between text-obsidian-600">
                <span>VAT (16%)</span><span>{formatKES(tax())}</span>
              </div>
              <div className="flex justify-between font-bold text-base text-obsidian-900 pt-2 border-t border-obsidian-200">
                <span>Total</span><span>{formatKES(total())}</span>
              </div>
            </div>
            {shippingCost() === 0 && (
              <p className="text-xs text-green-600 font-medium mt-3 text-center">✓ Free shipping applied!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}