/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Background layers (design.md)
        app: {
          bg: '#0A0A0A',
          panel: '#1A1A1A',
          component: '#2A2A2A',
          input: '#1E1E1E',
        },
        // Borders & dividers
        border: {
          subtle: '#2A2A2A',
          DEFAULT: '#3A3A3A',
          hover: '#4A4A4A',
        },
        // Text hierarchy
        text: {
          primary: '#FFFFFF',
          secondary: '#A0A0A0',
          tertiary: '#6A6A6A',
        },
        // Primary actions
        accent: {
          blue: '#3B82F6',
          'blue-hover': '#2563EB',
          'blue-active': '#1D4ED8',
        },
        // Component categories
        category: {
          compute: '#F97316',
          storage: '#06B6D4',
          network: '#8B5CF6',
          data: '#10B981',
          messaging: '#EC4899',
          ai: '#10B981',
        },
        // Status colors
        status: {
          success: '#22C55E',
          warning: '#EAB308',
          error: '#EF4444',
          info: '#3B82F6',
        },
        // Node specific
        node: {
          bg: '#2A2A2A',
          border: '#3A3A3A',
          handle: '#4A4A4A',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      fontSize: {
        'hero': ['36px', { lineHeight: '1.2', fontWeight: '300' }],
        'heading': ['20px', { lineHeight: '1.4', fontWeight: '500' }],
        'label': ['14px', { lineHeight: '1.5', fontWeight: '500' }],
        'body': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'small': ['12px', { lineHeight: '1.4', fontWeight: '400' }],
        'tiny': ['11px', { lineHeight: '1.3', fontWeight: '500' }],
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0,0,0,0.3)',
        'modal': '0 8px 32px rgba(0,0,0,0.5)',
        'dropdown': '0 4px 16px rgba(0,0,0,0.4)',
        'node': '0 2px 8px rgba(0,0,0,0.3)',
        'node-hover': '0 4px 16px rgba(0,0,0,0.4)',
        'node-selected': '0 0 0 3px rgba(59,130,246,0.2)',
      },
      borderRadius: {
        'sm': '4px',
        'md': '6px',
        'lg': '12px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flow': 'flow 2s linear infinite',
        'slide-in': 'slideIn 0.2s ease',
        'fade-in': 'fadeIn 0.15s ease',
        'shake': 'shake 0.5s ease-in-out',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        flow: {
          '0%': { strokeDashoffset: '24' },
          '100%': { strokeDashoffset: '0' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(59,130,246,0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(59,130,246,0.8)' },
        },
      },
      transitionTimingFunction: {
        'standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
