import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../lib/api';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'consumer' | 'agent';
  avatar?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    county?: string;
    country?: string;
    postalCode?: string;
  };
  wishlist?: string[];
  totalSpent?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isImpersonating: boolean;
  originalAgent: string | null;

  setUser: (user: User, token: string) => void;
  clearUser: () => void;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  toggleWishlist: (productId: string) => void;
  startImpersonation: (user: User, token: string, agentEmail: string) => void;
  stopImpersonation: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isImpersonating: false,
      originalAgent: null,

      setUser: (user, token) => {
        localStorage.setItem('fw_token', token);
        localStorage.setItem('fw_user', JSON.stringify(user));
        set({ user, token });
      },

      clearUser: () => {
        localStorage.removeItem('fw_token');
        localStorage.removeItem('fw_user');
        set({ user: null, token: null, isImpersonating: false, originalAgent: null });
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // ignore errors
        } finally {
          get().clearUser();
        }
      },

      fetchMe: async () => {
        set({ isLoading: true });
        try {
          const { data } = await authApi.me();
          const user = data.data.user;
          set({ user, isLoading: false });
          localStorage.setItem('fw_user', JSON.stringify(user));
        } catch {
          get().clearUser();
          set({ isLoading: false });
        }
      },

      updateUser: (data) => {
        const user = get().user;
        if (!user) return;
        const updated = { ...user, ...data };
        set({ user: updated });
        localStorage.setItem('fw_user', JSON.stringify(updated));
      },

      toggleWishlist: (productId) => {
        const user = get().user;
        if (!user) return;
        const wishlist = user.wishlist || [];
        const idx = wishlist.indexOf(productId);
        const updated = idx > -1
          ? wishlist.filter((id) => id !== productId)
          : [...wishlist, productId];
        get().updateUser({ wishlist: updated });
      },

      startImpersonation: (user, token, agentEmail) => {
        const prevToken = get().token;
        const prevUser = get().user;
        // Store original agent info in session
        sessionStorage.setItem('impersonate_prev_token', prevToken || '');
        sessionStorage.setItem('impersonate_prev_user', JSON.stringify(prevUser));
        localStorage.setItem('fw_token', token);
        set({ user, token, isImpersonating: true, originalAgent: agentEmail });
      },

      stopImpersonation: () => {
        const prevToken = sessionStorage.getItem('impersonate_prev_token') || '';
        const prevUserStr = sessionStorage.getItem('impersonate_prev_user');
        const prevUser = prevUserStr ? JSON.parse(prevUserStr) : null;
        sessionStorage.removeItem('impersonate_prev_token');
        sessionStorage.removeItem('impersonate_prev_user');
        localStorage.setItem('fw_token', prevToken);
        set({ user: prevUser, token: prevToken, isImpersonating: false, originalAgent: null });
      },
    }),
    {
      name: 'fw-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isImpersonating: state.isImpersonating,
        originalAgent: state.originalAgent,
      }),
    }
  )
);
