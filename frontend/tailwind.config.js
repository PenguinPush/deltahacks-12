/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/views/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Text colors
        text: {
          primary: '#E8E8E8',
          secondary: '#A8A8A8',
          tertiary: '#6A6A6A',
        },
        // Background colors
        app: {
          bg: '#0A0A0A',
          panel: '#181818',
          component: '#262626',
          input: '#1A1A1A',
        },
        // Border colors
        border: {
          DEFAULT: '#2A2A2A',
          hover: '#3A3A3A',
          subtle: '#1F1F1F',
        },
        // Accent colors
        accent: {
          blue: '#3B82F6',
          'blue-hover': '#2563EB',
          'blue-active': '#1D4ED8',
        },
        // Status colors
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
        },
        // Node colors
        node: {
          handle: '#4A4A4A',
        },
      },
      fontSize: {
        tiny: ['0.75rem', { lineHeight: '1rem' }],
        small: ['0.875rem', { lineHeight: '1.25rem' }],
        body: ['0.9375rem', { lineHeight: '1.5rem' }],
        label: ['0.875rem', { lineHeight: '1.25rem', fontWeight: '500' }],
        heading: ['1.125rem', { lineHeight: '1.75rem', fontWeight: '600' }],
      },
      fontFamily: {
        sans: ['Rubik', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        node: '0 4px 12px rgba(0, 0, 0, 0.4)',
        'node-hover': '0 6px 16px rgba(0, 0, 0, 0.5)',
        'node-selected': '0 0 0 2px rgba(59, 130, 246, 0.3)',
        card: '0 2px 8px rgba(0, 0, 0, 0.3)',
        dropdown: '0 4px 12px rgba(0, 0, 0, 0.5)',
        modal: '0 10px 40px rgba(0, 0, 0, 0.6)',
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        flow: {
          '0%': { strokeDashoffset: '24' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.15s ease-out',
        'slide-in': 'slide-in 0.2s ease-out',
        flow: 'flow 1s linear infinite',
      },
    },
  },
  plugins: [],
};