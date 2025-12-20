/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./tabs/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: '#102d62',
        cyan: '#01ccff',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        head: ['Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [],
}