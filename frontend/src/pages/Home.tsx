import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, Truck, RotateCcw, Shield, Headphones } from 'lucide-react';
import BannerCarousel from '../components/BannerCarousel';
import ProductCard from '../components/ProductCard';
import Testimonials from '../components/Testimonials';
import { productsApi } from '../lib/api';
import type { Product } from '../lib/types';

const CATEGORIES = [
  {
    name: 'Women',
    query: 'WOMEN',
    image: '/images/categories/women.jpg',
    fallbackColor: '#fef9f3',
  },
  {
    name: 'Men',
    query: 'MEN',
    image: '/images/categories/men.jpg',
    fallbackColor: '#f0f4ff',
  },
  {
    name: 'Kids',
    query: 'KIDS',
    image: '/images/categories/kids.jpg',
    fallbackColor: '#fff3f3',
  },
  {
    name: 'Activewear',
    query: 'ACTIVEWEAR',
    image: '/images/categories/activewear.jpg',
    fallbackColor: '#f0fff4',
  },
  {
    name: 'Footwear',
    query: 'FOOTWEAR',
    image: '/images/categories/footwear.jpg',
    fallbackColor: '#fdfff0',
  },
  {
    name: 'Accessories',
    query: 'ACCESSORIES',
    image: '/images/categories/accessories.jpg',
    fallbackColor: '#fff8f0',
  },
];

// ── BRANDS – now using local images from /public/images/brands/ ──
const BRANDS = [
  { name: 'Nike', logo: '/images/brands/nike.png' },
  { name: 'Adidas', logo: '/images/brands/adidas.png' },
  { name: 'Zara', logo: '/images/brands/zara.png' },
  { name: 'H&M', logo: '/images/brands/hm.png' },
  { name: 'Hugo Boss', logo: '/images/brands/hugoboss.png' },
];

const FEATURES = [
  { icon: <Truck size={24} />, title: 'Free Shipping', desc: 'On orders over KES 5,000' },
  { icon: <RotateCcw size={24} />, title: '30-Day Returns', desc: 'No questions asked' },
  { icon: <Shield size={24} />, title: 'Secure Payments', desc: 'M-Pesa · Visa · Mastercard' },
  { icon: <Headphones size={24} />, title: '24/7 Support', desc: 'Chat, email, WhatsApp' },
];

export default function HomePage() {
  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productsApi.getAll({ featured: 'true', limit: 8 }).then((r) => r.data.data.products as Product[]),
  });

  const { data: newInData, isLoading: newInLoading } = useQuery({
    queryKey: ['products', 'new-in'],
    queryFn: () => productsApi.getAll({ category: 'NEW IN', limit: 4 }).then((r) => r.data.data.products as Product[]),
  });

  const { data: africaData } = useQuery({
    queryKey: ['products', 'africa'],
    queryFn: () => productsApi.getAll({ madeInAfrica: 'true', limit: 4 }).then((r) => r.data.data.products as Product[]),
  });

  return (
    <main>
      {/* ── Hero Carousel ── */}
      <BannerCarousel />

      {/* ── Features bar ── */}
      <section className="bg-obsidian-50 border-y border-obsidian-100">
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-obsidian-200">
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3 px-6 py-5">
                <span className="text-luxe-500 flex-shrink-0">{icon}</span>
                <div>
                  <p className="text-sm font-semibold text-obsidian-900">{title}</p>
                  <p className="text-xs text-obsidian-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Category tiles ── */}
      <section className="py-16 max-w-screen-2xl mx-auto px-4 lg:px-8">
        <div className="text-center mb-10">
          <p className="section-eyebrow">Shop by Category</p>
          <h2 className="section-title">Find Your Style</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {CATEGORIES.map(({ name, query, image, fallbackColor }) => (
            <Link
              key={name}
              to={`/shop?category=${encodeURIComponent(query)}`}
              className="group relative overflow-hidden aspect-[3/4] block rounded-lg"
              style={{ backgroundColor: fallbackColor }}
            >
              <img
                src={image}
                alt={name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-white font-display font-semibold text-lg leading-tight">{name}</p>
                <p className="text-white/70 text-xs mt-1 font-medium group-hover:text-white transition-colors">
                  Shop now →
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── New In ── */}
      <section className="py-16 bg-obsidian-50">
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="section-eyebrow">Just Arrived</p>
              <h2 className="section-title">New In</h2>
            </div>
            <Link to="/shop?category=NEW IN" className="btn-secondary text-xs py-2.5 px-5 hidden md:flex items-center gap-2">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          {newInLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-[3/4] skeleton" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
              {(newInData || []).map((p, i) => (
                <ProductCard key={p._id} product={p} priority={i < 2} />
              ))}
            </div>
          )}

          <div className="text-center mt-8 md:hidden">
            <Link to="/shop?category=NEW IN" className="btn-secondary text-xs py-2.5 px-6">
              View All New In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Featured products ── */}
      <section className="py-16">
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="section-eyebrow">Editor's Picks</p>
              <h2 className="section-title">Featured Collection</h2>
            </div>
            <Link to="/shop?featured=true" className="btn-secondary text-xs py-2.5 px-5 hidden md:flex items-center gap-2">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          {featuredLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-[3/4] skeleton" />
                  <div className="h-4 skeleton w-3/4" />
                  <div className="h-4 skeleton w-1/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {(featuredData || []).map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}

          <div className="text-center mt-10 md:hidden">
            <Link to="/shop" className="btn-secondary text-xs py-2.5 px-6">
              Browse All Products
            </Link>
          </div>
        </div>
      </section>

      {/* ── Made in Africa Banner ── */}
      <section className="py-0">
        <div className="relative overflow-hidden" style={{ height: '440px' }}>
          <img
            src="https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1600&q=80&fit=crop"
            alt="Made in Africa collection"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-obsidian-900/85 via-obsidian-900/60 to-transparent" />
          <div className="relative z-10 h-full flex items-center">
            <div className="max-w-screen-2xl mx-auto px-4 lg:px-12 w-full">
              <div className="max-w-lg">
                <p className="text-gold-300 text-xs font-bold tracking-[0.3em] uppercase mb-4">🌍 Proudly African</p>
                <h2 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
                  Crafted in Africa,<br />Worn by the World
                </h2>
                <p className="text-white/80 text-base mb-8 leading-relaxed">
                  Discover handcrafted pieces from artisans across Kenya, Ghana, Nigeria, and beyond. Every purchase supports local creators.
                </p>
                <Link to="/shop?category=MADE IN AFRICA" className="btn-gold px-8 py-4 text-sm">
                  Explore Made in Africa →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Made in Africa products ── */}
      {africaData && africaData.length > 0 && (
        <section className="py-16 bg-luxe-50">
          <div className="max-w-screen-2xl mx-auto px-4 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="section-eyebrow">African Artisans</p>
                <h2 className="section-title">Made in Africa</h2>
              </div>
              <Link to="/shop?category=MADE IN AFRICA" className="btn-secondary text-xs py-2.5 px-5 hidden md:flex items-center gap-2">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
              {africaData.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Brands marquee (local logos) ── */}
      <section className="py-12 border-y border-obsidian-100 overflow-hidden">
        <div className="flex items-center">
          <div className="flex animate-marquee gap-16 items-center pr-16" aria-hidden="true">
            {[...BRANDS, ...BRANDS].map((brand, i) => (
              <div
                key={`${brand.name}-${i}`}
                className="flex-shrink-0 flex items-center justify-center h-12 w-28 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all"
              >
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    // Hide broken image, show just the gray placeholder area
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex animate-marquee gap-16 items-center pr-16 absolute" aria-hidden="true">
            {[...BRANDS, ...BRANDS].map((brand, i) => (
              <div
                key={`${brand.name}-dup-${i}`}
                className="flex-shrink-0 flex items-center justify-center h-12 w-28 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all"
              >
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <Testimonials />

      {/* ── Sale CTA ── */}
      <section className="py-16">
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-8">
          <div className="bg-obsidian-900 text-white p-12 md:p-16 text-center">
            <p className="text-gold-300 text-xs font-bold tracking-[0.3em] uppercase mb-4">Limited Time</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">Up to 70% Off</h2>
            <p className="text-obsidian-300 text-base mb-8 max-w-md mx-auto">
              Don't miss out on our biggest sale of the season. Premium fashion at unbeatable prices.
            </p>
            <Link to="/shop?category=SALE" className="btn-gold px-10 py-4 text-sm">
              Shop the Sale →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}