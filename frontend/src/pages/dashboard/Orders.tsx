import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Filter, ChevronDown, Printer, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { ordersApi } from '../../lib/api';
import { formatKES } from '../../lib/types';
import type { Order } from '../../lib/types';

const STATUSES = ['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const STATUS_CLASS: Record<string, string> = {
  pending: 'status-pending',
  confirmed: 'status-confirmed',
  shipped: 'status-shipped',
  delivered: 'status-delivered',
  cancelled: 'status-cancelled',
};
const NEXT_STATUS: Record<string, string> = {
  pending: 'confirmed',
  confirmed: 'shipped',
  shipped: 'delivered',
};

export default function DashboardOrders() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', { status: statusFilter, page }],
    queryFn: () => ordersApi.getAll({
      ...(statusFilter !== 'all' && { status: statusFilter }),
      page,
      limit: 20,
    }).then((r) => r.data.data),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ordersApi.updateStatus(id, { status }),
    onSuccess: (_, vars) => {
      toast.success(`Order status updated to ${vars.status}`);
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      if (selectedOrder?._id === vars.id) {
        setSelectedOrder((o) => o ? { ...o, status: vars.status as any } : null);
      }
    },
    onError: () => toast.error('Failed to update order status'),
  });

  const orders: Order[] = data?.orders || [];
  const pagination = data?.pagination;

  const filteredOrders = search
    ? orders.filter((o) =>
        o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        `${o.customer?.firstName} ${o.customer?.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        o.customer?.email?.toLowerCase().includes(search.toLowerCase())
      )
    : orders;

  const handlePrintInvoice = (order: Order) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${order.orderNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; color: #000; }
          h1 { font-size: 24px; margin-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
          th { background: #f5f5f5; font-weight: bold; }
          .total { font-size: 18px; font-weight: bold; }
          .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>FASHION WORLD</h1>
            <p>Premium Fashion Store</p>
          </div>
          <div style="text-align:right">
            <h2>INVOICE</h2>
            <p><strong>Order:</strong> ${order.orderNumber}</p>
            <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div style="margin-bottom:20px">
          <h3>Bill To:</h3>
          <p>${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>
          ${order.shippingAddress.street}<br>
          ${order.shippingAddress.city}, ${order.shippingAddress.county}<br>
          ${order.shippingAddress.country}<br>
          ${order.shippingAddress.phone}</p>
        </div>
        <table>
          <thead><tr><th>Item</th><th>Size</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.size || '—'}</td>
                <td>${item.quantity}</td>
                <td>KES ${item.price.toLocaleString()}</td>
                <td>KES ${item.subtotal.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr><td colspan="4">Subtotal</td><td>KES ${order.subtotal.toLocaleString()}</td></tr>
            <tr><td colspan="4">Shipping</td><td>KES ${order.shippingCost.toLocaleString()}</td></tr>
            <tr><td colspan="4">VAT (16%)</td><td>KES ${order.tax.toLocaleString()}</td></tr>
            <tr class="total"><td colspan="4"><strong>TOTAL</strong></td><td><strong>KES ${order.total.toLocaleString()}</strong></td></tr>
          </tfoot>
        </table>
        <p style="margin-top:20px">Payment method: ${order.paymentMethod.toUpperCase()}</p>
        <p>Status: ${order.status.toUpperCase()}</p>
        <button onclick="window.print()" style="margin-top:20px;padding:8px 16px;background:#000;color:#fff;border:none;cursor:pointer">Print</button>
      </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-obsidian-900">Orders</h1>
          <p className="text-sm text-obsidian-500 mt-0.5">
            {pagination?.total ?? 0} total orders
          </p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-obsidian-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders, customers…"
            className="input-luxe pl-9 text-sm py-2.5"
          />
        </div>
        <div className="flex items-center gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-obsidian-900 text-white'
                  : 'bg-white border border-obsidian-200 text-obsidian-600 hover:border-obsidian-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card-luxe overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="space-y-px">
              {[...Array(8)].map((_, i) => <div key={i} className="h-14 skeleton" />)}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16 text-obsidian-400">
              <p className="font-medium">No orders found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <table className="table-luxe">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <span className="font-mono text-xs font-bold text-luxe-600">
                        {order.orderNumber}
                      </span>
                    </td>
                    <td>
                      <div>
                        <p className="text-xs font-medium text-obsidian-900">
                          {order.customer?.firstName} {order.customer?.lastName}
                        </p>
                        <p className="text-[11px] text-obsidian-400">{order.customer?.email}</p>
                      </div>
                    </td>
                    <td className="text-xs text-obsidian-500 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="text-xs text-obsidian-600">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</td>
                    <td className="font-medium text-sm">{formatKES(order.total)}</td>
                    <td>
                      <span className="text-xs font-medium uppercase text-obsidian-500">
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td>
                      <span className={STATUS_CLASS[order.status] || 'status-pending'}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 text-obsidian-400 hover:text-obsidian-700 hover:bg-obsidian-100 transition-colors"
                          aria-label="View order details"
                          title="View details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handlePrintInvoice(order)}
                          className="p-1.5 text-obsidian-400 hover:text-obsidian-700 hover:bg-obsidian-100 transition-colors"
                          aria-label="Print invoice"
                          title="Print invoice"
                        >
                          <Printer size={15} />
                        </button>
                        {NEXT_STATUS[order.status] && (
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: order._id, status: NEXT_STATUS[order.status] })}
                            disabled={updateStatusMutation.isPending}
                            className="px-2 py-1 text-[11px] font-medium bg-obsidian-900 text-white hover:bg-luxe-600 transition-colors capitalize disabled:opacity-50"
                            title={`Mark as ${NEXT_STATUS[order.status]}`}
                          >
                            → {NEXT_STATUS[order.status]}
                          </button>
                        )}
                        {order.status === 'pending' && (
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: order._id, status: 'cancelled' })}
                            className="px-2 py-1 text-[11px] font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            title="Cancel order"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-obsidian-100">
            <p className="text-xs text-obsidian-500">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40">← Prev</button>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-obsidian-100">
              <div>
                <h2 className="font-semibold text-lg text-obsidian-900">Order {selectedOrder.orderNumber}</h2>
                <p className="text-xs text-obsidian-500 mt-0.5">{new Date(selectedOrder.createdAt).toLocaleString('en-KE')}</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => handlePrintInvoice(selectedOrder)} className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5">
                  <Printer size={13} /> Print
                </button>
                <button onClick={() => setSelectedOrder(null)} className="btn-ghost p-2">✕</button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status update */}
              <div>
                <p className="label-luxe mb-2">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {['pending','confirmed','shipped','delivered','cancelled'].map(s => (
                    <button
                      key={s}
                      onClick={() => updateStatusMutation.mutate({ id: selectedOrder._id, status: s })}
                      disabled={selectedOrder.status === s || updateStatusMutation.isPending}
                      className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                        selectedOrder.status === s
                          ? 'bg-obsidian-900 text-white'
                          : 'bg-obsidian-50 text-obsidian-600 hover:bg-obsidian-100 disabled:opacity-40'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="label-luxe mb-2">Customer</p>
                  <p className="text-sm font-medium">{selectedOrder.customer?.firstName} {selectedOrder.customer?.lastName}</p>
                  <p className="text-xs text-obsidian-500">{selectedOrder.customer?.email}</p>
                  <p className="text-xs text-obsidian-500">{selectedOrder.customer?.phone}</p>
                </div>
                <div>
                  <p className="label-luxe mb-2">Shipping Address</p>
                  <p className="text-sm">{selectedOrder.shippingAddress.street}</p>
                  <p className="text-xs text-obsidian-500">
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.county}
                  </p>
                  <p className="text-xs text-obsidian-500">{selectedOrder.shippingAddress.country}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="label-luxe mb-3">Order Items</p>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex gap-3 items-center">
                      <img src={item.image} alt={item.name} className="w-12 h-14 object-cover bg-obsidian-100 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-obsidian-400">{[item.size, item.color].filter(Boolean).join(' · ')} × {item.quantity}</p>
                      </div>
                      <p className="text-sm font-bold">{formatKES(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-obsidian-50 p-4 space-y-1.5 text-sm">
                <div className="flex justify-between text-obsidian-600"><span>Subtotal</span><span>{formatKES(selectedOrder.subtotal)}</span></div>
                <div className="flex justify-between text-obsidian-600"><span>Shipping</span><span>{formatKES(selectedOrder.shippingCost)}</span></div>
                <div className="flex justify-between text-obsidian-600"><span>VAT</span><span>{formatKES(selectedOrder.tax)}</span></div>
                <div className="flex justify-between font-bold text-obsidian-900 pt-2 border-t border-obsidian-200"><span>Total</span><span>{formatKES(selectedOrder.total)}</span></div>
                <div className="flex justify-between text-xs text-obsidian-500">
                  <span>Payment</span>
                  <span className="uppercase font-medium">{selectedOrder.paymentMethod} · <span className={selectedOrder.paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-600'}>{selectedOrder.paymentStatus}</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
