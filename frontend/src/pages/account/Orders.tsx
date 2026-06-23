import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package, ChevronDown, ChevronUp } from 'lucide-react';
import { ordersApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { formatKES } from '../../lib/types';
import type { Order } from '../../lib/types';

const STATUS_CLASS: Record<string, string> = {
  pending: 'status-pending',
  confirmed: 'status-confirmed',
  shipped: 'status-shipped',
  delivered: 'status-delivered',
  cancelled: 'status-cancelled',
};

export default function AccountOrders() {
  const { user } = useAuthStore();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!user) return <Navigate to="/account/login" replace />;

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersApi.getAll({ limit: 50 }).then(r => r.data.data.orders as Order[]),
  });

  const orders = data || [];

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-obsidian-900">My Orders</h1>
        <p className="text-sm text-obsidian-500 mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 skeleton" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <Package size={48} className="mx-auto text-obsidian-200 mb-4" />
          <h2 className="font-display text-xl text-obsidian-700 mb-2">No orders yet</h2>
          <p className="text-obsidian-500 text-sm mb-6">Your order history will appear here</p>
          <Link to="/shop" className="btn-primary text-xs py-3 px-6">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="card-luxe overflow-hidden">
              {/* Order header */}
              <button
                className="w-full flex items-center justify-between p-5 text-left hover:bg-obsidian-50 transition-colors"
                onClick={() => setExpanded(expanded === order._id ? null : order._id)}
              >
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <p className="font-mono text-sm font-bold text-luxe-600">{order.orderNumber}</p>
                    <p className="text-xs text-obsidian-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <span className={STATUS_CLASS[order.status]}>{order.status}</span>
                  <span className="text-sm font-bold text-obsidian-900">{formatKES(order.total)}</span>
                  <span className="text-xs text-obsidian-500">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                </div>
                {expanded === order._id ? <ChevronUp size={16} className="text-obsidian-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-obsidian-400 flex-shrink-0" />}
              </button>

              {/* Expanded detail */}
              {expanded === order._id && (
                <div className="border-t border-obsidian-100 p-5 space-y-5">
                  {/* Items */}
                  <div className="space-y-3">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex gap-3 items-center">
                        <img src={item.image} alt={item.name} className="w-14 h-16 object-cover bg-obsidian-100 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-obsidian-900">{item.name}</p>
                          <p className="text-xs text-obsidian-400 mt-0.5">
                            {[item.size, item.color].filter(Boolean).join(' · ')} × {item.quantity}
                          </p>
                          <p className="text-sm font-bold text-obsidian-900 mt-1">{formatKES(item.subtotal)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-obsidian-100">
                    <div>
                      <p className="text-xs text-obsidian-500 mb-1">Payment</p>
                      <p className="text-sm font-semibold uppercase text-obsidian-800">{order.paymentMethod}</p>
                      <p className={`text-xs font-medium ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
                        {order.paymentStatus}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-obsidian-500 mb-1">Shipping to</p>
                      <p className="text-sm font-medium text-obsidian-800">{order.shippingAddress.city}</p>
                      <p className="text-xs text-obsidian-400">{order.shippingAddress.county}</p>
                    </div>
                    <div>
                      <p className="text-xs text-obsidian-500 mb-1">Order Total</p>
                      <p className="text-sm font-bold text-obsidian-900">{formatKES(order.total)}</p>
                      {order.shippingCost === 0 && <p className="text-xs text-green-600">Free shipping</p>}
                    </div>
                  </div>

                  {order.trackingNumber && (
                    <div className="bg-blue-50 border border-blue-100 px-4 py-3 text-sm">
                      <span className="font-medium text-blue-800">Tracking: </span>
                      <span className="font-mono text-blue-700">{order.trackingNumber}</span>
                    </div>
                  )}
                  {order.estimatedDelivery && order.status !== 'delivered' && (
                    <p className="text-xs text-obsidian-500">
                      Estimated delivery: <strong>{new Date(order.estimatedDelivery).toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' })}</strong>
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
