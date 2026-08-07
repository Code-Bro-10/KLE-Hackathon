/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        background: '#FFFFFF',
        surface: '#F7F7F8',
        'surface-blue': '#F0F2FA',
        'text-primary': '#1D1D1F',
        'text-secondary': '#707074',
        'text-muted': '#9A9A9F',
        border: '#E8E8EA',
        emergency: '#FF453A',
        'emergency-dark': '#D92D20',
        'emergency-soft': '#FFF1F0',
        urgent: '#FF9F0A',
        moderate: '#FFD60A',
        stable: '#30D158',
        medical: '#0A84FF',
        dark: '#1D1E22',
        'dark-card': '#25262B',
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
