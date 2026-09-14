/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        clinical: {
          50: '#f0f7fa',
          100: '#ddedf5',
          200: '#bfdeed',
          300: '#91c7df',
          400: '#5ca9cc',
          500: '#388db4',
          600: '#287196',
          700: '#235c7a',
          800: '#214d64',
          900: '#1e4254',
          950: '#0f2734',
        },
        kiosk: {
          surface: '#ffffff',
          panel: '#f8fafc',
          border: '#e2e8f0',
          dark: '#0f172a',
          primary: '#0f766e',
          primaryHover: '#115e59',
          accent: '#0284c7',
        }
      },
      fontSize: {
        'kiosk-xl': ['2rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em' }],
        'kiosk-2xl': ['2.5rem', { lineHeight: '3rem', letterSpacing: '-0.03em' }],
        'kiosk-3xl': ['3.25rem', { lineHeight: '3.75rem', letterSpacing: '-0.03em' }],
      },
      minHeight: {
        'touch': '56px',
        'kiosk-button': '64px',
      }
    },
  },
  plugins: [],
}
