/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',   // très clair
          100: '#dbeafe',  // clair
          200: '#bfdbfe',  // moyen-clair
          300: '#93c5fd',  // moyen
          400: '#60a5fa',  // moyen-foncé
          500: '#007AFF',  // VOTRE COULEUR PRINCIPALE
          600: '#0066cc',  // foncé
          700: '#0052a3',  // très foncé
          800: '#003d7a',  // ultra foncé
          900: '#002952',  // presque noir
        }
      }
    },
  },
  plugins: [],
}