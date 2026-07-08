/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAF7F2',
        alabaster: '#F5F0E8',
        champagne: '#C4A574',
        charcoal: '#1A1A1A',
        slate: '#4A4A4A',
        blush: '#F0E6DC',
        linen: '#EDE8E0',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        'fib-8': '8px',
        'fib-13': '13px',
        'fib-21': '21px',
        'fib-34': '34px',
      },
      animation: {
        fadeIn: 'fadeIn 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        fadeUp: 'fadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        soft: '0 4px 24px rgba(44, 44, 44, 0.06)',
        card: '0 8px 40px rgba(44, 44, 44, 0.08)',
      },
    },
  },
  plugins: [],
};
