/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Fashion World Brand Palette
        luxe: {
          50: '#fef9f3',
          100: '#fef0e0',
          200: '#fbd9b4',
          300: '#f7be84',
          400: '#f29a52',
          500: '#e8782e',
          600: '#c9561a',
          700: '#a63d12',
          800: '#7d2e0e',
          900: '#5c210c',
          950: '#3d1408',
        },
        gold: {
          300: '#e8d58a',
          400: '#d4af37',
          500: '#b8960c',
        },
        obsidian: {
          DEFAULT: '#0d0d0d',
          50: '#f5f5f5',
          100: '#e8e8e8',
          200: '#c8c8c8',
          300: '#9e9e9e',
          400: '#707070',
          500: '#4a4a4a',
          600: '#333333',
          700: '#222222',
          800: '#161616',
          900: '#0d0d0d',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      screens: {
        xs: '375px',
        '3xl': '1920px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },
      height: {
        'screen-90': '90vh',
        'screen-80': '80vh',
        'screen-75': '75vh',
      },
      animation: {
        marquee: 'marquee 30s linear infinite',
        'fade-in': 'fadeIn 0.4s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'shimmer-gradient': 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      },
    },
  },
  plugins: [],
};
