import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from localStorage if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fw_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global response error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fw_token');
      localStorage.removeItem('fw_user');
      // Only redirect if not already on auth pages
      if (!window.location.pathname.startsWith('/account')) {
        window.location.href = '/account/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ─────────────────────────────────────────────────────────────────
export const authApi = {
  registerConsumer: (data: any) => api.post('/auth/register/consumer', data),
  registerAgent: (data: any) => api.post('/auth/register/agent', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  changePassword: (data: any) => api.put('/auth/change-password', data),
  toggleWishlist: (productId: string) => api.post('/auth/wishlist/toggle', { productId }),
};

// ── Products ──────────────────────────────────────────────────────────────
export const productsApi = {
  getAll: (params?: any) => api.get('/products', { params }),
  search: (q: string) => api.get('/products/search', { params: { q } }),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: FormData) => api.post('/products', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData) => api.put(`/products/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => api.delete(`/products/${id}`),
  duplicate: (id: string) => api.post(`/products/${id}/duplicate`),
  bulkUpdate: (ids: string[], updates: any) => api.patch('/products/bulk/update', { ids, updates }),
};

// ── Orders ────────────────────────────────────────────────────────────────
export const ordersApi = {
  create: (data: any) => api.post('/orders', data),
  getAll: (params?: any) => api.get('/orders', { params }),
  getById: (id: string) => api.get(`/orders/${id}`),
  updateStatus: (id: string, data: any) => api.patch(`/orders/${id}/status`, data),
  getAnalytics: () => api.get('/orders/analytics'),
};

// ── Banners ───────────────────────────────────────────────────────────────
export const bannersApi = {
  getActive: () => api.get('/banners'),
  getAll: () => api.get('/banners/all'),
  create: (data: FormData) => api.post('/banners', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData) => api.put(`/banners/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => api.delete(`/banners/${id}`),
  reorder: (orderedIds: string[]) => api.patch('/banners/reorder', { orderedIds }),
};

// ── Customers ─────────────────────────────────────────────────────────────
export const customersApi = {
  getAll: (params?: any) => api.get('/customers', { params }),
  getById: (id: string) => api.get(`/customers/${id}`),
  impersonate: (id: string) => api.post(`/customers/${id}/impersonate`),
  toggleActive: (id: string) => api.patch(`/customers/${id}/toggle-active`),
};

// ── Payments ──────────────────────────────────────────────────────────────
export const paymentsApi = {
  createStripeIntent: (orderId: string) => api.post('/payments/stripe/create-intent', { orderId }),
  confirmStripe: (orderId: string, paymentIntentId?: string) =>
    api.post('/payments/stripe/confirm', { orderId, paymentIntentId }),
  mpesaStkPush: (phone: string, orderId: string) =>
    api.post('/payments/mpesa/stk-push', { phone, orderId }),
  mpesaStatus: (id: string, orderId: string) =>
    api.get(`/payments/mpesa/status/${id}`, { params: { orderId } }),
};
