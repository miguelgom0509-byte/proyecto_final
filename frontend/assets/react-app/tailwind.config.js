/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0B10',
        surface: '#111318',
        surfaceHover: '#1A1D24',
        primary: '#3B82F6',
        primaryHover: '#2563EB',
        textPrimary: '#F1F5F9',
        textSecondary: '#94A3B8',
        borderSubtle: 'rgba(255, 255, 255, 0.06)',
        borderStrong: 'rgba(255, 255, 255, 0.12)',
        accentGreen: '#10B981',
        accentOrange: '#F59E0B',
        accentRed: '#EF4444',
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      }
    },
  },
  plugins: [],
}