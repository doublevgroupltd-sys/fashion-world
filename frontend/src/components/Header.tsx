import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ShoppingBag, User, Heart, Menu, X, ChevronDown,
  LogOut, LayoutDashboard, Package, Settings
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { productsApi } from '../lib/api';
import { NAV_LINKS } from '../lib/types';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function Header() {
  const { user, logout } = useAuthStore();
  const { itemCount, openCart } = useCartStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  // Search
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    productsApi.search(debouncedQuery)
      .then(({ data }) => setSearchResults(data.data.products || []))
      .catch(() => setSearchResults([]))
      .finally(() => setSearchLoading(false));
  }, [debouncedQuery]);

  // Click outside close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setSearchQuery('');
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    setUserMenuOpen(false);
    navigate('/');
  }, [logout, navigate]);

  const cartCount = itemCount();

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-obsidian-900 text-white text-center text-xs py-2 tracking-widest font-medium">
        FREE SHIPPING ON ORDERS OVER KES 5,000 · USE CODE <span className="text-gold-300 font-bold">LUXE10</span> FOR 10% OFF
      </div>

      <header className={`sticky top-0 z-40 bg-white transition-shadow duration-300 ${scrolled ? 'shadow-md' : 'shadow-none border-b border-obsidian-100'}`}>
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-8">
          <div className="flex items-center h-[72px] gap-4">

            {/* Mobile menu button */}
            <button
              className="lg:hidden btn-ghost p-2"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            {/* Logo */}
            <Link to="/" className="flex-shrink-0 mr-4 lg:mr-8">
              <span className="font-display text-2xl font-bold tracking-[-0.02em] text-obsidian-900">
                FASHION<span className="text-luxe-500">WORLD</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-0 flex-1" aria-label="Main navigation">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link}
                  to={`/shop?category=${encodeURIComponent(link)}`}
                  className="px-3 py-1 text-[11px] font-semibold tracking-wider text-obsidian-700 hover:text-luxe-600 transition-colors whitespace-nowrap"
                >
                  {link}
                </Link>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-1 ml-auto">
              {/* Search */}
              <div ref={searchRef} className="relative">
                <button
                  className="btn-ghost p-2.5"
                  onClick={() => setSearchOpen((v) => !v)}
                  aria-label="Search"
                >
                  <Search size={20} />
                </button>

                <AnimatePresence>
                  {searchOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-[360px] bg-white border border-obsidian-200 shadow-xl z-50"
                    >
                      <div className="p-3 border-b border-obsidian-100">
                        <div className="flex items-center gap-2">
                          <Search size={16} className="text-obsidian-400 flex-shrink-0" />
                          <input
                            autoFocus
                            type="text"
                            placeholder="Search products, brands…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && searchQuery) {
                                navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
                                setSearchOpen(false);
                                setSearchQuery('');
                              }
                            }}
                            className="flex-1 text-sm outline-none placeholder:text-obsidian-400"
                          />
                          {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="text-obsidian-400 hover:text-obsidian-700">
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {searchLoading && (
                        <div className="p-4 text-sm text-obsidian-500 text-center">Searching…</div>
                      )}

                      {!searchLoading && searchResults.length > 0 && (
                        <ul className="py-1 max-h-80 overflow-y-auto">
                          {searchResults.map((p) => (
                            <li key={p._id}>
                              <Link
                                to={`/product/${p.slug || p._id}`}
                                onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-obsidian-50 transition-colors"
                              >
                                <img
                                  src={p.images?.[0] || '/placeholder.jpg'}
                                  alt={p.name}
                                  className="w-12 h-12 object-cover flex-shrink-0 bg-obsidian-100"
                                />
                                <div>
                                  <p className="text-sm font-medium text-obsidian-900 line-clamp-1">{p.name}</p>
                                  <p className="text-xs text-obsidian-500">{p.category} · KES {p.price.toLocaleString()}</p>
                                </div>
                              </Link>
                            </li>
                          ))}
                          <li className="px-4 py-2 border-t border-obsidian-100">
                            <button
                              onClick={() => {
                                navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
                                setSearchOpen(false);
                                setSearchQuery('');
                              }}
                              className="text-xs text-luxe-600 font-medium hover:underline"
                            >
                              See all results for "{searchQuery}"
                            </button>
                          </li>
                        </ul>
                      )}

                      {!searchLoading && searchQuery.length >= 2 && searchResults.length === 0 && (
                        <div className="p-4 text-sm text-obsidian-500 text-center">
                          No products found for "{searchQuery}"
                        </div>
                      )}

                      {!searchQuery && (
                        <div className="p-4">
                          <p className="text-xs font-semibold tracking-wider uppercase text-obsidian-500 mb-2">Popular</p>
                          <div className="flex flex-wrap gap-2">
                            {['Ankara Dress', 'Sneakers', 'Blazer', 'Maasai Sandals'].map((t) => (
                              <button
                                key={t}
                                onClick={() => setSearchQuery(t)}
                                className="px-3 py-1 text-xs border border-obsidian-200 hover:border-luxe-500 hover:text-luxe-600 transition-colors"
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Wishlist */}
              {user && (
                <Link to="/account/wishlist" className="btn-ghost p-2.5" aria-label="Wishlist">
                  <Heart size={20} />
                </Link>
              )}

              {/* User menu */}
              <div ref={userMenuRef} className="relative">
                <button
                  className="btn-ghost p-2.5"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  aria-label="Account"
                >
                  <User size={20} />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-white border border-obsidian-200 shadow-xl z-50"
                    >
                      {user ? (
                        <>
                          <div className="px-4 py-3 border-b border-obsidian-100">
                            <p className="text-sm font-semibold text-obsidian-900">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-obsidian-500 mt-0.5">{user.email}</p>
                            {user.role === 'agent' && (
                              <span className="inline-block mt-1 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 bg-gold-300 text-obsidian-900">
                                AGENT
                              </span>
                            )}
                          </div>
                          <div className="py-1">
                            {user.role === 'agent' && (
                              <Link
                                to="/dashboard"
                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-obsidian-700 hover:bg-obsidian-50"
                                onClick={() => setUserMenuOpen(false)}
                              >
                                <LayoutDashboard size={15} />
                                Dashboard
                              </Link>
                            )}
                            <Link
                              to="/account/orders"
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-obsidian-700 hover:bg-obsidian-50"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <Package size={15} />
                              My Orders
                            </Link>
                            <Link
                              to="/account/profile"
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-obsidian-700 hover:bg-obsidian-50"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <Settings size={15} />
                              Profile Settings
                            </Link>
                            <button
                              onClick={handleLogout}
                              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                            >
                              <LogOut size={15} />
                              Sign Out
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="p-3 flex flex-col gap-2">
                          <Link to="/account/login" onClick={() => setUserMenuOpen(false)} className="btn-primary w-full justify-center text-xs py-2.5">
                            Sign In
                          </Link>
                          <Link to="/account/register" onClick={() => setUserMenuOpen(false)} className="btn-secondary w-full justify-center text-xs py-2.5">
                            Create Account
                          </Link>
                          <div className="border-t border-obsidian-100 pt-2 mt-1">
                            <Link to="/account/register/agent" onClick={() => setUserMenuOpen(false)} className="text-xs text-center block text-obsidian-500 hover:text-luxe-600">
                              Register as Agent
                            </Link>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Cart */}
              <button
                className="btn-ghost p-2.5 relative"
                onClick={openCart}
                aria-label={`Cart, ${cartCount} items`}
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 flex items-center justify-center bg-luxe-500 text-white text-[10px] font-bold rounded-full">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed inset-y-0 left-0 z-50 w-[300px] bg-white flex flex-col overflow-y-auto"
            >
              <div className="flex items-center justify-between px-5 h-16 border-b border-obsidian-100">
                <span className="font-display text-xl font-bold text-obsidian-900">FASHION<span className="text-luxe-500">WORLD</span></span>
                <button className="btn-ghost p-1.5" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                  <X size={20} />
                </button>
              </div>

              {user ? (
                <div className="px-5 py-4 bg-obsidian-50 border-b border-obsidian-100">
                  <p className="font-semibold text-sm">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-obsidian-500">{user.email}</p>
                </div>
              ) : (
                <div className="px-5 py-4 flex gap-2 border-b border-obsidian-100">
                  <Link to="/account/login" onClick={() => setMobileOpen(false)} className="btn-primary flex-1 justify-center text-xs py-2.5">Sign In</Link>
                  <Link to="/account/register" onClick={() => setMobileOpen(false)} className="btn-secondary flex-1 justify-center text-xs py-2.5">Register</Link>
                </div>
              )}

              <nav className="flex-1 py-4">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link}
                    to={`/shop?category=${encodeURIComponent(link)}`}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center px-5 py-3.5 text-sm font-medium text-obsidian-800 hover:bg-luxe-50 hover:text-luxe-600 border-b border-obsidian-50 transition-colors"
                  >
                    {link}
                    {(link === 'SALE' || link === 'NEW IN') && (
                      <span className="ml-2 text-[9px] font-bold tracking-wider px-1.5 py-0.5 bg-red-500 text-white">
                        {link === 'SALE' ? 'HOT' : 'NEW'}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>

              {user && (
                <div className="border-t border-obsidian-100 py-2">
                  {user.role === 'agent' && (
                    <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 px-5 py-3 text-sm text-obsidian-700 hover:bg-obsidian-50">
                      <LayoutDashboard size={15} /> Dashboard
                    </Link>
                  )}
                  <Link to="/account/orders" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 px-5 py-3 text-sm text-obsidian-700 hover:bg-obsidian-50">
                    <Package size={15} /> My Orders
                  </Link>
                  <button onClick={handleLogout} className="flex items-center gap-2.5 w-full px-5 py-3 text-sm text-red-600 hover:bg-red-50">
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
