import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { bannersApi } from '../lib/api';
import type { Banner } from '../lib/types';

const AUTOPLAY_INTERVAL = 5500;

export default function BannerCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['banners'],
    queryFn: () => bannersApi.getActive().then((r) => r.data.data.banners as Banner[]),
    staleTime: 1000 * 60 * 5,
  });

  const banners = data?.length
    ? data
    : FALLBACK_BANNERS;

  const next = useCallback(() => setCurrent((c) => (c + 1) % banners.length), [banners.length]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + banners.length) % banners.length), [banners.length]);

  useEffect(() => {
    if (paused || banners.length <= 1) return;
    const timer = setInterval(next, AUTOPLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [paused, next, banners.length]);

  if (isLoading) {
    return (
      <div className="relative w-full h-screen-75 md:h-screen-90 bg-obsidian-100 skeleton" />
    );
  }

  const banner = banners[current];

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ height: 'clamp(480px, 85vh, 900px)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Featured collection carousel"
      aria-roledescription="carousel"
    >
      {/* Slides */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          {/* Background image */}
          <img
            src={banner.image}
            alt={banner.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
          />

          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to right, ${banner.backgroundColor || '#000'}cc 0%, ${banner.backgroundColor || '#000'}80 45%, transparent 75%)`,
            }}
          />

          {/* Content */}
          <div className="relative z-10 h-full flex items-center">
            <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 w-full">
              <div className="max-w-xl">
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="text-xs font-bold tracking-[0.3em] uppercase mb-4"
                  style={{ color: banner.textColor || '#ffffff', opacity: 0.7 }}
                >
                  New Collection
                </motion.p>

                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mb-5"
                  style={{ color: banner.textColor || '#ffffff' }}
                >
                  {banner.title}
                </motion.h1>

                {banner.subtitle && (
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.5 }}
                    className="text-base md:text-lg leading-relaxed mb-8 max-w-sm"
                    style={{ color: banner.textColor || '#ffffff', opacity: 0.85 }}
                  >
                    {banner.subtitle}
                  </motion.p>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  <Link
                    to={banner.ctaLink || '/shop'}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-white text-obsidian-900 text-sm font-bold tracking-widest uppercase hover:bg-gold-300 transition-colors duration-300"
                  >
                    {banner.ctaText || 'Shop Now'}
                    <span className="text-lg leading-none">→</span>
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/40 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/40 transition-colors"
          >
            <ChevronRight size={20} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`transition-all duration-300 ${
                  i === current
                    ? 'w-8 h-2 bg-white'
                    : 'w-2 h-2 bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>

          {/* Progress bar */}
          {!paused && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20 z-20">
              <motion.div
                key={current}
                className="h-full bg-white"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: AUTOPLAY_INTERVAL / 1000, ease: 'linear' }}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}

const FALLBACK_BANNERS: Banner[] = [
  {
    _id: '1',
    title: 'New Season, New You',
    subtitle: 'Discover the latest arrivals — luxury fashion curated for the modern African wardrobe',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1600&q=85&auto=format&fit=crop',
    ctaText: 'Shop New In',
    ctaLink: '/shop?category=NEW IN',
    orderIndex: 0,
    isActive: true,
    backgroundColor: '#1a0a00',
    textColor: '#ffffff',
  },
  {
    _id: '2',
    title: 'Made in Africa',
    subtitle: 'Celebrate African craftsmanship — bold prints, rich textures, timeless elegance',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1600&q=85&auto=format&fit=crop',
    ctaText: 'Explore Collection',
    ctaLink: '/shop?category=MADE IN AFRICA',
    orderIndex: 1,
    isActive: true,
    backgroundColor: '#2d1b0e',
    textColor: '#fef3e2',
  },
  {
    _id: '3',
    title: 'Luxury Footwear',
    subtitle: 'Step into confidence — premium sneakers and heels from top global brands',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&q=85&auto=format&fit=crop',
    ctaText: 'Shop Footwear',
    ctaLink: '/shop?category=FOOTWEAR',
    orderIndex: 2,
    isActive: true,
    backgroundColor: '#0d0d0d',
    textColor: '#ffffff',
  },
];
