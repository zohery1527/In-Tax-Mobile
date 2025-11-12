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
          50: '#eff6ff',
          500: '#007AFF',
          600: '#0066cc',
          700: '#0052a3'
        }
      }
    },
  },
  plugins: [],
}