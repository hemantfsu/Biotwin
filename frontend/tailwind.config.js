/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}', './public/index.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        brand: {
          50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc',
          400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca',
          800: '#3730a3', 900: '#312e81', 950: '#1e1b4b',
        },
        dark: {
          950: '#050507',
          900: '#0B0D19',
          850: '#0E1019',
          800: '#111327',
          750: '#141629',
          700: '#1A1D2E',
          600: '#1E2235',
          500: '#252940',
          400: '#2E3350',
          300: '#3A4060',
        },
        accent: {
          cyan: '#0DF2BC',
          teal: '#2B6670',
          blue: '#3B82F6',
          purple: '#8B5CF6',
        },
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0,0,0,0.3)',
        'card': '0 2px 8px rgba(0,0,0,0.3), 0 4px 20px rgba(0,0,0,0.2)',
        'card-hover': '0 4px 24px rgba(0,0,0,0.4), 0 0 30px rgba(13,242,188,0.06)',
        'float': '0 20px 60px rgba(0,0,0,0.5)',
        'glow-cyan': '0 0 15px rgba(13,242,188,0.25)',
        'glow-brand': '0 0 20px rgba(99,102,241,0.3)',
        'neon': '0 0 5px rgba(13,242,188,0.3), 0 0 20px rgba(13,242,188,0.1)',
      },
      borderRadius: { '4xl': '2rem' },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delay': 'float 6s ease-in-out infinite 2s',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'blob': 'blob 7s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(13,242,188,0.15)' },
          '50%': { boxShadow: '0 0 25px rgba(13,242,188,0.35)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        blob: {
          '0%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(30px,-50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px,20px) scale(0.9)' },
          '100%': { transform: 'translate(0,0) scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
