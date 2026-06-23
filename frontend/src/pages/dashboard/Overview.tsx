import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  ShoppingCart, DollarSign, Clock, Users, AlertTriangle, ArrowRight, TrendingUp
} from 'lucide-react';
import { ordersApi } from '../../lib/api';
import { formatKES } from '../../lib/types';
import type { Analytics } from '../../lib/types';

const STATUS_CLASS: Record<string, string> = {
  pending: 'status-pending',
  confirmed: 'status-confirmed',
  shipped: 'status-shipped',
  delivered: 'status-delivered',
  cancelled: 'status-cancelled',
};

export default function DashboardOverview() {
  const { data, isLoading } = useQuery<Analytics>({
    queryKey: ['analytics'],
    queryFn: () => ordersApi.getAnalytics().then((r) => r.data.data),
    refetchInterval: 30000,
  });

  const kpis = data?.kpis;
  const chartData = data?.last7DaysSales || [];
  const recentOrders = data?.recentOrders || [];
  const lowStock = data?.lowStockProducts || [];

  const KPI_CARDS = [
    {
      label: "Today's Orders",
      value: kpis?.todayOrders ?? '—',
      icon: <ShoppingCart size={20} />,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Monthly Revenue',
      value: kpis?.monthRevenue !== undefined ? formatKES(kpis.monthRevenue) : '—',
      icon: <DollarSign size={20} />,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Pending Orders',
      value: kpis?.pendingOrders ?? '—',
      icon: <Clock size={20} />,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Total Customers',
      value: kpis?.totalCustomers ?? '—',
      icon: <Users size={20} />,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 skeleton" />)}
        </div>
        <div className="h-64 skeleton" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-obsidian-900">Dashboard Overview</h1>
        <p className="text-sm text-obsidian-500 mt-1">Welcome back. Here's what's happening in your store today.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map(({ label, value, icon, color, bg }) => (
          <div key={label} className="card-luxe p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-obsidian-500 mb-1">{label}</p>
                <p className="text-2xl font-bold text-obsidian-900">{value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg ${bg} ${color} flex items-center justify-center flex-shrink-0`}>
                {icon}
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3">
              <TrendingUp size={12} className="text-green-500" />
              <span className="text-xs text-green-600 font-medium">Live data</span>
            </div>
          </div>
        ))}
      </div>

      {/* Sales chart */}
      <div className="card-luxe p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold text-obsidian-900">Sales — Last 7 Days</h2>
            <p className="text-xs text-obsidian-500 mt-0.5">Revenue and order volume</p>
          </div>
        </div>
        {chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-obsidian-400 text-sm">
            No sales data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="_id"
                tickFormatter={(v) => new Date(v).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}
                tick={{ fontSize: 11, fill: '#707070' }}
              />
              <YAxis
                yAxisId="left"
                tickFormatter={(v) => `KES ${(v / 1000).toFixed(0)}K`}
                tick={{ fontSize: 11, fill: '#707070' }}
              />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#707070' }} />
              <Tooltip
                formatter={(val: number, name: string) =>
                  name === 'revenue' ? [formatKES(val), 'Revenue'] : [val, 'Orders']
                }
                labelFormatter={(l) => new Date(l).toLocaleDateString('en-KE', { weekday: 'long', month: 'long', day: 'numeric' })}
              />
              <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#e8782e" strokeWidth={2.5} dot={{ r: 4 }} name="revenue" />
              <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#d4af37" strokeWidth={2} dot={{ r: 3 }} name="orders" strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 card-luxe">
          <div className="flex items-center justify-between p-5 border-b border-obsidian-100">
            <h2 className="font-semibold text-obsidian-900">Recent Orders</h2>
            <Link to="/dashboard/orders" className="text-xs text-luxe-600 flex items-center gap-1 hover:underline">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-obsidian-400 text-center py-10">No orders yet</p>
            ) : (
              <table className="table-luxe">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.slice(0, 8).map((order: any) => (
                    <tr key={order._id}>
                      <td>
                        <Link to={`/dashboard/orders/${order._id}`} className="text-luxe-600 hover:underline font-mono text-xs">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium text-obsidian-900 text-xs">
                            {order.customer?.firstName} {order.customer?.lastName}
                          </p>
                          <p className="text-[11px] text-obsidian-400">{order.customer?.email}</p>
                        </div>
                      </td>
                      <td className="font-medium">{formatKES(order.total)}</td>
                      <td>
                        <span className={STATUS_CLASS[order.status] || 'status-pending'}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="card-luxe">
          <div className="flex items-center justify-between p-5 border-b border-obsidian-100">
            <h2 className="font-semibold text-obsidian-900 flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-500" />
              Low Stock Alerts
            </h2>
            <Link to="/dashboard/products" className="text-xs text-luxe-600 hover:underline">
              Manage
            </Link>
          </div>
          <div className="p-4 space-y-3">
            {lowStock.length === 0 ? (
              <p className="text-sm text-obsidian-400 text-center py-6">All items are well stocked ✓</p>
            ) : (
              lowStock.map((p: any) => (
                <div key={p._id} className="flex items-center gap-3">
                  <img
                    src={p.images?.[0] || ''}
                    alt={p.name}
                    className="w-10 h-12 object-cover bg-obsidian-100 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-obsidian-900 line-clamp-1">{p.name}</p>
                    <p className={`text-xs font-bold ${p.totalStock === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                      {p.totalStock === 0 ? 'Out of stock' : `${p.totalStock} left`}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
