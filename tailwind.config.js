
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#102d62',
          light: '#1a3e7d',
          dark: '#0a1d40',
        },
        cyan: {
          DEFAULT: '#01ccff',
          light: '#33d6ff',
          dark: '#00a3cc',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        head: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 20px 50px -12px rgba(0, 0, 0, 0.05)',
        'cyan-glow': '0 10px 15px -3px rgba(1, 204, 255, 0.2)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
