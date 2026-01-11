/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Background Layers
        'app-bg': '#0A0A0A',
        'app-panel': '#1A1A1A',
        'app-component': '#2A2A2A',
        'app-input': '#1E1E1E',

        // Legacy aliases (for compatibility)
        'panel-bg': '#1A1A1A',
        'component-bg': '#2A2A2A',
        'input-bg': '#1E1E1E',

        // Borders
        'border': '#3A3A3A',
        'border-subtle': '#2A2A2A',
        'border-hover': '#4A4A4A',

        // Node specific
        'node-handle': '#4A4A4A',

        // Text Colors
        text: {
          primary: '#FFFFFF',
          secondary: '#A0A0A0',
          tertiary: '#6A6A6A',
        },

        // Accent Colors
        accent: {
          blue: '#3B82F6',
          'blue-hover': '#2563EB',
          'blue-active': '#1D4ED8',
          orange: '#F97316',
          cyan: '#06B6D4',
          purple: '#8B5CF6',
          green: '#10B981',
          pink: '#EC4899',
        },

        // Status Colors
        status: {
          success: '#22C55E',
          warning: '#EAB308',
          error: '#EF4444',
          info: '#3B82F6',
        },

        // Legacy status aliases (for compatibility)
        success: '#22C55E',
        warning: '#EAB308',
        error: '#EF4444',
        info: '#3B82F6',
      },
      fontSize: {
        'tiny': ['11px', { lineHeight: '1.5', fontWeight: '500' }],
        'small': ['12px', { lineHeight: '1.5', fontWeight: '400' }],
        'body': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'label': ['14px', { lineHeight: '1.5', fontWeight: '500' }],
        'heading': ['20px', { lineHeight: '1.4', fontWeight: '500' }],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0,0,0,0.3)',
        'modal': '0 8px 32px rgba(0,0,0,0.5)',
        'dropdown': '0 4px 16px rgba(0,0,0,0.4)',
        'node': '0 2px 8px rgba(0,0,0,0.3)',
        'node-hover': '0 4px 16px rgba(0,0,0,0.4)',
        'node-selected': '0 0 0 3px rgba(59,130,246,0.2)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
