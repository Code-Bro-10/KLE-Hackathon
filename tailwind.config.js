/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        background: 'var(--background)',
        surface: 'var(--surface)',
        'surface-blue': 'var(--surface-soft-blue)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        border: 'var(--border)',
        emergency: 'var(--emergency)',
        'emergency-dark': 'var(--emergency-dark)',
        'emergency-soft': 'var(--emergency-soft)',
        urgent: 'var(--urgent)',
        moderate: 'var(--moderate)',
        stable: 'var(--stable)',
        medical: 'var(--medical)',
        dark: 'var(--dark)',
        'dark-card': 'var(--dark-card)',
      },
      borderRadius: {
        sm: '16px',
        md: '24px',
        lg: '32px',
        xl: '40px',
        pill: '999px',
      },
      boxShadow: {
        nav: '0 8px 30px rgba(0,0,0,.06)',
        card: '0 20px 60px rgba(0,0,0,.10)',
        emergency: '0 12px 40px rgba(255,69,58,.25)',
        sm: '0 4px 16px rgba(0,0,0,.06)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 5s ease-in-out infinite',
        'glow': 'glow 2.5s ease-in-out infinite',
        'ring-expand': 'ringExpand 3s ease-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        ringExpand: {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
