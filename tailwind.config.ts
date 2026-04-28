import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#b8ceff',
          300: '#8aaeff',
          400: '#5c8cff',
          500: '#2d6aff',
          600: '#1a52db',
          700: '#103cb0',
          800: '#0a2878',
          900: '#061a52',
          950: '#030e30',
        },
        surface: '#f4f6fb',
      },
      fontFamily: {
        sans: ['Heebo', 'Segoe UI', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.06), 0 4px 16px 0 rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.1), 0 8px 32px 0 rgba(0,0,0,0.06)',
        sidebar: '4px 0 24px 0 rgba(3,14,48,0.18)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
}

export default config
