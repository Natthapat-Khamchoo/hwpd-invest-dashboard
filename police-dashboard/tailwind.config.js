/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sarabun', 'sans-serif'],
      },
      colors: {
        hwpd: {
          dark: '#0f172a',
          slate: '#1e293b',
          gold: '#facc15',
          goldHover: '#eab308',
        },
        neon: {
          blue: '#3b82f6',
          purple: '#8b5cf6',
          pink: '#ec4899',
          amber: '#f59e0b',
        }
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'zoom-in': 'zoomIn 0.3s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 3s infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
        'spin-reverse': 'spin 15s linear infinite reverse',
        'drop-line': 'drop-line 3s linear infinite',
        'scan-line': 'scan-line 4s linear infinite',
        'scan-vertical': 'scan-vertical 2s linear infinite',
        'blink': 'blink 1s step-end infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        zoomIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          'from': { backgroundPosition: '0 0' },
          'to': { backgroundPosition: '-200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'drop-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'scan-line': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100vw)' },
        },
        'scan-vertical': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        }
      }
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
}