/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors:{
        primary:{
          50: '#f0f7ff',
          100: '#dbefff',
          200: '#b6d8ff',
          300: '#81b8ff',
          400: '#4d96ff',
          500: '#1f7cff',
          600: '#1666e6',
          700: '#0f4db4',
          800: '#0b3a86',
          900: '#062855'
        }
      }
    },
  },
  plugins: [],
}
