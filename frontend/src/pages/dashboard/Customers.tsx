import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Eye, UserX, UserCheck, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { customersApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { formatKES } from '../../lib/types';
import type { Customer } from '../../lib/types';

export default function DashboardCustomers() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { startImpersonation, user: currentUser } = useAuthStore();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', { search, role: roleFilter, page }],
    queryFn: () => customersApi.getAll({
      ...(search && { search }),
      ...(roleFilter && { role: roleFilter }),
      page,
      limit: 20,
    }).then(r => r.data.data),
  });

  const { data: customerDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['customer-detail', selected?._id],
    queryFn: () => customersApi.getById(selected._id).then(r => r.data.data),
    enabled: !!selected,
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id: string) => customersApi.toggleActive(id),
    onSuccess: () => {
      toast.success('Account status updated');
      qc.invalidateQueries({ queryKey: ['customers'] });
      if (selected) {
        setSelected((prev: any) => ({ ...prev, isActive: !prev.isActive }));
      }
    },
    onError: () => toast.error('Update failed'),
  });

  const handleImpersonate = async (customer: Customer) => {
    if (!window.confirm(`You are about to impersonate ${customer.firstName} ${customer.lastName}. This will be logged. Continue?`)) return;
    try {
      const { data } = await customersApi.impersonate(customer._id);
      const { user, token, originalAgent } = data.data;
      startImpersonation(user, token, originalAgent || currentUser?.email || '');
      toast.success(`Now viewing as ${user.firstName} ${user.lastName}`);
      navigate('/');
    } catch {
      toast.error('Impersonation failed');
    }
  };

  const customers: Customer[] = data?.customers || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-obsidian-900">Customers</h1>
        <p className="text-sm text-obsidian-500 mt-0.5">{pagination?.total ?? 0} registered accounts</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-obsidian-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email…"
            className="input-luxe pl-9 text-sm py-2.5"
          />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'consumer', 'agent'].map(r => (
            <button key={r} onClick={() => { setRoleFilter(r === 'all' ? '' : r); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                (roleFilter === r || (r === 'all' && !roleFilter))
                  ? 'bg-obsidian-900 text-white'
                  : 'bg-white border border-obsidian-200 text-obsidian-600 hover:border-obsidian-400'
              }`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer table */}
        <div className="lg:col-span-2 card-luxe overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="space-y-px">{[...Array(8)].map((_, i) => <div key={i} className="h-14 skeleton" />)}</div>
            ) : customers.length === 0 ? (
              <div className="text-center py-16 text-obsidian-400">
                <p>No customers found</p>
              </div>
            ) : (
              <table className="table-luxe">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Role</th>
                    <th>Spent</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c._id} className={selected?._id === c._id ? 'bg-luxe-50' : ''}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-obsidian-200 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-obsidian-600">
                            {c.firstName[0]}{c.lastName[0]}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-obsidian-900">{c.firstName} {c.lastName}</p>
                            <p className="text-[11px] text-obsidian-400">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`text-[10px] font-bold px-2 py-0.5 ${c.role === 'agent' ? 'bg-gold-300 text-obsidian-900' : 'bg-obsidian-100 text-obsidian-600'}`}>
                          {c.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="text-xs font-medium">{formatKES(c.totalSpent || 0)}</td>
                      <td className="text-xs text-obsidian-500 whitespace-nowrap">
                        {new Date(c.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </td>
                      <td>
                        <span className={`text-[10px] font-bold px-2 py-0.5 ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setSelected(c)} title="View details"
                            className="p-1.5 text-obsidian-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => toggleActiveMutation.mutate(c._id)}
                            title={c.isActive ? 'Deactivate account' : 'Activate account'}
                            className="p-1.5 text-obsidian-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          >
                            {c.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                          </button>
                          {c.role === 'consumer' && (
                            <button onClick={() => handleImpersonate(c)} title="Impersonate (support)"
                              className="p-1.5 text-obsidian-400 hover:text-purple-600 hover:bg-purple-50 transition-colors">
                              <LogIn size={14} />
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

        {/* Customer detail panel */}
        <div className="card-luxe">
          {!selected ? (
            <div className="p-8 text-center text-obsidian-400">
              <Eye size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a customer to view details</p>
            </div>
          ) : detailLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-6 skeleton" />)}
            </div>
          ) : customerDetail ? (
            <div className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-obsidian-200 rounded-full flex items-center justify-center text-base font-bold text-obsidian-600 flex-shrink-0">
                    {customerDetail.customer.firstName[0]}{customerDetail.customer.lastName[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-obsidian-900">{customerDetail.customer.firstName} {customerDetail.customer.lastName}</p>
                    <p className="text-xs text-obsidian-500">{customerDetail.customer.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="text-obsidian-400 hover:text-obsidian-700 text-lg leading-none">×</button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'Orders', value: customerDetail.stats.totalOrders },
                  { label: 'Total Spent', value: formatKES(customerDetail.stats.totalSpent || 0) },
                  { label: 'Avg Order', value: formatKES(Math.round(customerDetail.stats.avgOrderValue || 0)) },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center p-3 bg-obsidian-50">
                    <p className="text-sm font-bold text-obsidian-900">{value}</p>
                    <p className="text-[10px] text-obsidian-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Info */}
              <div className="space-y-2 mb-5 text-xs">
                {customerDetail.customer.phone && (
                  <div className="flex justify-between">
                    <span className="text-obsidian-500">Phone</span>
                    <span className="font-medium text-obsidian-800">{customerDetail.customer.phone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-obsidian-500">Role</span>
                  <span className={`font-bold uppercase ${customerDetail.customer.role === 'agent' ? 'text-gold-500' : 'text-obsidian-700'}`}>
                    {customerDetail.customer.role}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-obsidian-500">Status</span>
                  <span className={`font-bold ${customerDetail.customer.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {customerDetail.customer.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-obsidian-500">Joined</span>
                  <span className="font-medium text-obsidian-800">
                    {new Date(customerDetail.customer.createdAt).toLocaleDateString('en-KE')}
                  </span>
                </div>
                {customerDetail.customer.lastLogin && (
                  <div className="flex justify-between">
                    <span className="text-obsidian-500">Last login</span>
                    <span className="font-medium text-obsidian-800">
                      {new Date(customerDetail.customer.lastLogin).toLocaleDateString('en-KE')}
                    </span>
                  </div>
                )}
              </div>

              {/* Recent orders */}
              {customerDetail.orders.length > 0 && (
                <div>
                  <p className="label-luxe mb-3">Recent Orders</p>
                  <div className="space-y-2">
                    {customerDetail.orders.slice(0, 5).map((order: any) => (
                      <div key={order._id} className="flex items-center justify-between text-xs p-2 bg-obsidian-50">
                        <span className="font-mono font-bold text-luxe-600">{order.orderNumber}</span>
                        <span className="text-obsidian-500">{new Date(order.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</span>
                        <span className="font-medium">{formatKES(order.total)}</span>
                        <span className={`capitalize font-semibold ${
                          order.status === 'delivered' ? 'text-green-600' :
                          order.status === 'cancelled' ? 'text-red-600' : 'text-amber-600'
                        }`}>{order.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2 mt-5 pt-4 border-t border-obsidian-100">
                {customerDetail.customer.role === 'consumer' && (
                  <button onClick={() => handleImpersonate(customerDetail.customer)}
                    className="btn-secondary text-xs py-2 flex items-center justify-center gap-2">
                    <LogIn size={13} /> Impersonate (Support)
                  </button>
                )}
                <button
                  onClick={() => toggleActiveMutation.mutate(customerDetail.customer._id)}
                  className={`text-xs py-2 flex items-center justify-center gap-2 ${
                    customerDetail.customer.isActive
                      ? 'btn-ghost border border-red-200 text-red-600 hover:bg-red-50'
                      : 'btn-secondary'
                  }`}
                >
                  {customerDetail.customer.isActive ? <><UserX size={13} /> Deactivate Account</> : <><UserCheck size={13} /> Activate Account</>}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
