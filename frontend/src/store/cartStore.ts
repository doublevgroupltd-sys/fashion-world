import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  maxStock: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;

  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // Computed
  itemCount: () => number;
  subtotal: () => number;
  tax: () => number;
  shippingCost: () => number;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (newItem) => {
        const items = get().items;
        // Create a unique key based on product+size+color
        const key = `${newItem.productId}-${newItem.size || ''}-${newItem.color || ''}`;

        const existing = items.find(
          (i) =>
            i.productId === newItem.productId &&
            i.size === newItem.size &&
            i.color === newItem.color
        );

        if (existing) {
          // Increment quantity (capped at maxStock)
          set({
            items: items.map((i) =>
              i.id === existing.id
                ? { ...i, quantity: Math.min(i.quantity + newItem.quantity, i.maxStock) }
                : i
            ),
            isOpen: true,
          });
        } else {
          set({
            items: [...items, { ...newItem, id: key + '-' + Date.now() }],
            isOpen: true,
          });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },

      updateQuantity: (id, qty) => {
        if (qty < 1) {
          get().removeItem(id);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity: Math.min(qty, i.maxStock) } : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set({ isOpen: !get().isOpen }),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      tax: () => Math.round(get().subtotal() * 0.16),

      shippingCost: () => (get().subtotal() >= 5000 ? 0 : 300),

      total: () => get().subtotal() + get().tax() + get().shippingCost(),
    }),
    {
      name: 'fw-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
