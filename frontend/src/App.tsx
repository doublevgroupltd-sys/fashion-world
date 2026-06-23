import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Layout
import Header from './components/Header';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';

// Pages — Storefront
import HomePage from './pages/Home';
import ShopPage from './pages/Shop';
import ProductDetailPage from './pages/ProductDetail';
import CartPage from './pages/Cart';
import CheckoutPage from './pages/Checkout';

// Pages — Account
import LoginPage from './pages/account/Login';
import RegisterPage from './pages/account/Register';
import AccountOrders from './pages/account/Orders';
import AccountProfile from './pages/account/Profile';

// Pages — Dashboard
import DashboardLayout from './pages/dashboard/Layout';
import DashboardOverview from './pages/dashboard/Overview';
import DashboardOrders from './pages/dashboard/Orders';
import DashboardProducts from './pages/dashboard/Products';
import DashboardBanners from './pages/dashboard/Banners';
import DashboardCustomers from './pages/dashboard/Customers';
import DashboardSettings from './pages/dashboard/Settings';

// Stores
import { useAuthStore } from './store/authStore';

// Styles
import './styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Main store layout (header + footer)
function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1">
        {children}
      </div>
      <Footer />
      <CartDrawer />
    </div>
  );
}

// Impersonation banner
function ImpersonationBanner() {
  const { isImpersonating, originalAgent, stopImpersonation } = useAuthStore();
  const navigate = useNavigate();

  if (!isImpersonating) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-purple-700 text-white px-4 py-2.5 flex items-center justify-between text-xs">
      <span>
        🎭 <strong>Support Mode:</strong> You are impersonating a customer.
        Agent: <strong>{originalAgent}</strong>
      </span>
      <button
        onClick={() => {
          stopImpersonation();
          navigate('/dashboard/customers');
        }}
        className="bg-white text-purple-700 font-bold px-3 py-1 text-xs hover:bg-purple-50 transition-colors"
      >
        Exit Impersonation
      </button>
    </div>
  );
}

function AppRoutes() {
  const { user, fetchMe, token } = useAuthStore();

  // Rehydrate user on app load
  useEffect(() => {
    if (token && !user) {
      fetchMe();
    }
  }, [token, user, fetchMe]);

  return (
    <>
      <ImpersonationBanner />
      <Routes>
        {/* ── Storefront ── */}
        <Route path="/" element={
          <StoreLayout><HomePage /></StoreLayout>
        } />
        <Route path="/shop" element={
          <StoreLayout><ShopPage /></StoreLayout>
        } />
        <Route path="/product/:id" element={
          <StoreLayout><ProductDetailPage /></StoreLayout>
        } />
        <Route path="/cart" element={
          <StoreLayout><CartPage /></StoreLayout>
        } />
        <Route path="/checkout" element={
          <StoreLayout><CheckoutPage /></StoreLayout>
        } />

        {/* ── Account (no footer needed) ── */}
        <Route path="/account/login" element={<LoginPage />} />
        <Route path="/account/register" element={<RegisterPage />} />
        <Route path="/account/register/:type" element={<RegisterPage />} />
        <Route path="/account/orders" element={
          <StoreLayout><AccountOrders /></StoreLayout>
        } />
        <Route path="/account/profile" element={
          <StoreLayout><AccountProfile /></StoreLayout>
        } />
        <Route path="/account/wishlist" element={
          <StoreLayout><AccountProfile /></StoreLayout>
        } />

        {/* ── Agent Dashboard ── */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="orders" element={<DashboardOrders />} />
          <Route path="products" element={<DashboardProducts />} />
          <Route path="banners" element={<DashboardBanners />} />
          <Route path="customers" element={<DashboardCustomers />} />
          <Route path="settings" element={<DashboardSettings />} />
        </Route>

        {/* ── Catch-all ── */}
        <Route path="*" element={
          <StoreLayout>
            <div className="max-w-screen-xl mx-auto px-4 py-24 text-center">
              <h1 className="font-display text-6xl font-bold text-obsidian-200 mb-4">404</h1>
              <h2 className="font-display text-2xl text-obsidian-700 mb-3">Page not found</h2>
              <p className="text-obsidian-500 mb-8">The page you're looking for doesn't exist.</p>
              <a href="/" className="btn-primary text-sm py-3 px-8">Back to Home</a>
            </div>
          </StoreLayout>
        } />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          gutter={8}
          toastOptions={{
            duration: 3500,
            style: {
              background: '#0d0d0d',
              color: '#ffffff',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
              borderRadius: '0',
              padding: '12px 16px',
            },
            success: {
              iconTheme: { primary: '#d4af37', secondary: '#0d0d0d' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
              style: { background: '#1a0000', color: '#ffffff' },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
