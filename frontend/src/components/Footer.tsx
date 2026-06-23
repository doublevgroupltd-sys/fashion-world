import { Link } from 'react-router-dom';
import { Instagram, Facebook, Youtube } from 'lucide-react';

// X (Twitter) icon as SVG since lucide doesn't have it
const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.738l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const TikTokIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.67a8.16 8.16 0 004.77 1.52V7.74a4.85 4.85 0 01-1-.05z"/>
  </svg>
);

const SOCIAL = [
  { label: 'Instagram', icon: <Instagram size={18} />, href: 'https://instagram.com' },
  { label: 'Facebook', icon: <Facebook size={18} />, href: 'https://facebook.com' },
  { label: 'X', icon: <XIcon />, href: 'https://x.com' },
  { label: 'TikTok', icon: <TikTokIcon />, href: 'https://tiktok.com' },
  { label: 'YouTube', icon: <Youtube size={18} />, href: 'https://youtube.com' },
];

const LINKS = {
  Company: [
    { label: 'About Us', to: '/about' },
    { label: 'Careers', to: '/careers' },
    { label: 'Press', to: '/press' },
    { label: 'Made in Africa', to: '/shop?category=MADE IN AFRICA' },
  ],
  'Customer Care': [
    { label: 'Contact Us', to: '/contact' },
    { label: 'FAQs', to: '/faqs' },
    { label: 'Shipping Info', to: '/shipping' },
    { label: 'Returns & Exchanges', to: '/returns' },
  ],
  Legal: [
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms of Service', to: '/terms' },
    { label: 'Cookie Policy', to: '/cookies' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-obsidian-900 text-white mt-20">
      {/* Newsletter */}
      <div className="border-b border-obsidian-700">
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-16">
            <div className="md:max-w-xs">
              <h3 className="font-display text-2xl font-semibold mb-2">Stay in the loop</h3>
              <p className="text-obsidian-300 text-sm">New arrivals, exclusive offers, and style inspiration — straight to your inbox.</p>
            </div>
            <form
              className="flex flex-1 max-w-md"
              onSubmit={(e) => { e.preventDefault(); alert('Subscribed! (demo)'); }}
            >
              <input
                type="email"
                placeholder="Your email address"
                required
                className="flex-1 px-4 py-3 bg-obsidian-800 border border-obsidian-600 text-white placeholder:text-obsidian-400 text-sm focus:outline-none focus:border-luxe-400"
              />
              <button type="submit" className="btn-gold px-6 py-3 text-xs whitespace-nowrap">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Links grid */}
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-16">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <span className="font-display text-2xl font-bold tracking-[-0.02em]">
              FASHION<span className="text-luxe-400">WORLD</span>
            </span>
            <p className="text-obsidian-400 text-sm mt-3 mb-6 leading-relaxed">
              Premium fashion for the modern African wardrobe. Curated with care, crafted with purpose.
            </p>
            <div className="flex items-center gap-3">
              {SOCIAL.map(({ label, icon, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 flex items-center justify-center border border-obsidian-600 text-obsidian-300 hover:border-luxe-400 hover:text-luxe-400 transition-colors"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs font-bold tracking-[0.2em] uppercase text-obsidian-400 mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map(({ label, to }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      className="text-sm text-obsidian-300 hover:text-white transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-obsidian-700">
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-obsidian-500">
          <p>© {new Date().getFullYear()} Fashion World. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>🇰🇪 Kenya</span>
            <span>Prices in KES</span>
            <span>M-Pesa · Visa · Mastercard</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
