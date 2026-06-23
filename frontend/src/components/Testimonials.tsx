import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';

const TESTIMONIALS = [
  {
    id: 1,
    name: 'Amara Njoku',
    location: 'Nairobi, Kenya',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&q=80&fit=crop&crop=face',
    rating: 5,
    text: 'Fashion World completely transformed my wardrobe. The Ankara wrap dress I ordered arrived exactly as described — the quality is exceptional. Fast delivery and beautiful packaging too!',
    product: 'Ankara Wrap Maxi Dress',
  },
  {
    id: 2,
    name: 'David Osei',
    location: 'Accra, Ghana',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80&fit=crop&crop=face',
    rating: 5,
    text: "I've been shopping here for a year and the experience just keeps getting better. The Made in Africa collection is stunning — I love supporting African designers while getting luxury quality.",
    product: 'Kente Peplum Blazer',
  },
  {
    id: 3,
    name: 'Fatima Al-Rashid',
    location: 'Mombasa, Kenya',
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=120&q=80&fit=crop&crop=face',
    rating: 5,
    text: 'The Maasai sandals are a work of art! Every stitch and bead is perfect. I wear them everywhere and get compliments constantly. This is what luxury fashion should look like.',
    product: 'Maasai Beaded Sandals',
  },
  {
    id: 4,
    name: 'Samuel Kiprono',
    location: 'Kisumu, Kenya',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80&fit=crop&crop=face',
    rating: 5,
    text: 'M-Pesa checkout made this so easy! Ordered the linen safari suit on a Friday and it was at my door by Monday. Fits perfectly and looks incredibly sharp for client meetings.',
    product: 'Linen Safari Suit',
  },
  {
    id: 5,
    name: 'Aisha Waweru',
    location: 'Nakuru, Kenya',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80&fit=crop&crop=face',
    rating: 5,
    text: 'The activewear collection is unreal. My compression leggings arrived in two days and the quality rivals anything I\'ve seen in international stores — at a much better price point.',
    product: 'Compression Leggings 7/8',
  },
  {
    id: 6,
    name: 'Grace Muthoni',
    location: 'Eldoret, Kenya',
    avatar: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=120&q=80&fit=crop&crop=face',
    rating: 4,
    text: 'Beautiful selection, professional service. My shea butter body oil smells divine and my skin has never looked better. Will definitely be coming back for more beauty products.',
    product: 'Shea Butter Glow Body Oil',
  },
];

export default function Testimonials() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const visible = 3;

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setCurrent((c) => (c + 1) % TESTIMONIALS.length);
    }, 4000);
    return () => clearInterval(t);
  }, [paused]);

  const displayedStart = current % TESTIMONIALS.length;

  return (
    <section
      className="py-20 bg-luxe-50"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-14">
          <p className="section-eyebrow">Customer Stories</p>
          <h2 className="section-title">Loved Across Africa</h2>
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {[1,2,3,4,5].map(s => (
              <Star key={s} size={18} className="text-gold-400 fill-gold-400" />
            ))}
            <span className="ml-2 text-sm text-obsidian-600 font-medium">4.9/5 from 2,800+ reviews</span>
          </div>
        </div>

        {/* Cards */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: Math.min(visible, TESTIMONIALS.length) }).map((_, offset) => {
              const t = TESTIMONIALS[(displayedStart + offset) % TESTIMONIALS.length];
              return (
                <motion.div
                  key={`${current}-${offset}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: offset * 0.08 }}
                  className="bg-white p-7 border border-obsidian-100 flex flex-col gap-5 hover:shadow-lg transition-shadow duration-300"
                >
                  {/* Quote icon */}
                  <Quote size={28} className="text-luxe-300" />

                  {/* Stars */}
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <Star
                        key={s}
                        size={14}
                        className={s <= t.rating ? 'text-gold-400 fill-gold-400' : 'text-obsidian-200'}
                      />
                    ))}
                  </div>

                  {/* Review text */}
                  <p className="text-obsidian-700 text-sm leading-relaxed flex-1">
                    "{t.text}"
                  </p>

                  {/* Product tag */}
                  <p className="text-[11px] font-semibold tracking-wider uppercase text-luxe-600 border-t border-obsidian-100 pt-4">
                    {t.product}
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="w-11 h-11 rounded-full object-cover border-2 border-obsidian-100"
                    />
                    <div>
                      <p className="text-sm font-semibold text-obsidian-900">{t.name}</p>
                      <p className="text-xs text-obsidian-400">{t.location}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Navigation dots */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Go to testimonial ${i + 1}`}
                className={`transition-all duration-300 h-1.5 rounded-full ${
                  i === current % TESTIMONIALS.length
                    ? 'w-8 bg-luxe-500'
                    : 'w-1.5 bg-obsidian-200 hover:bg-obsidian-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
