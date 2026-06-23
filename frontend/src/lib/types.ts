// ── Product ───────────────────────────────────────────────────────────────
export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  images: string[];
  category: string;
  subcategory?: string;
  brand?: string;
  tags: string[];
  sizes: string[];
  colors: Array<{ name: string; hex: string }>;
  variants: Variant[];
  totalStock: number;
  madeInAfrica: boolean;
  featured: boolean;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  soldCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Variant {
  size: string;
  color: string;
  colorHex: string;
  stock: number;
  sku?: string;
}

// ── Banner ────────────────────────────────────────────────────────────────
export interface Banner {
  _id: string;
  title: string;
  subtitle?: string;
  image: string;
  ctaText: string;
  ctaLink: string;
  orderIndex: number;
  isActive: boolean;
  backgroundColor?: string;
  textColor?: string;
}

// ── Order ─────────────────────────────────────────────────────────────────
export interface Order {
  _id: string;
  orderNumber: string;
  customer: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'mpesa' | 'card' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentReference?: string;
  mpesaReceiptNumber?: string;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  discount?: number;
  trackingNumber?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  product: string | Product;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  subtotal: number;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  county: string;
  country: string;
  postalCode?: string;
}

// ── Customer ──────────────────────────────────────────────────────────────
export interface Customer {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'consumer' | 'agent';
  avatar?: string;
  address?: {
    street?: string;
    city?: string;
    county?: string;
    country?: string;
    postalCode?: string;
  };
  wishlist: string[];
  totalSpent: number;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

// ── Analytics ─────────────────────────────────────────────────────────────
export interface Analytics {
  kpis: {
    todayOrders: number;
    monthRevenue: number;
    pendingOrders: number;
    totalCustomers: number;
  };
  recentOrders: Order[];
  last7DaysSales: Array<{ _id: string; revenue: number; orders: number }>;
  lowStockProducts: Array<{ _id: string; name: string; totalStock: number; images: string[] }>;
}

// ── Pagination ────────────────────────────────────────────────────────────
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasMore?: boolean;
}

// ── Kenya counties ────────────────────────────────────────────────────────
export const KENYA_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu',
  'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho',
  'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui',
  'Kwale', 'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera',
  'Marsabit', 'Meru', 'Migori', 'Mombasa', 'Murang\'a', 'Nairobi',
  'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua', 'Nyeri',
  'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi',
  'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot',
];

export const NAV_LINKS = [
  'NEW IN', 'WOMEN', 'MEN', 'KIDS', 'ACTIVEWEAR',
  'FOOTWEAR', 'SHOP BY BODY FIT', 'SALE', 'BUDGET FRIENDLY',
  'ACCESSORIES', 'BEAUTY', 'MADE IN AFRICA', 'DISCOVER',
];

export const formatKES = (amount: number): string =>
  `KES ${amount.toLocaleString('en-KE')}`;

export const getDiscountPercent = (price: number, compareAt: number): number =>
  Math.round(((compareAt - price) / compareAt) * 100);
