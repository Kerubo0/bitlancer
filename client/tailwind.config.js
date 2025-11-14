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
          DEFAULT: '#4C0F2E', // Deep burgundy/wine
          dark: '#2D0818', // Darker burgundy for hover states
        },
        accent: {
          DEFAULT: '#B09287', // Rose/terracotta
          light: '#D4B5AA', // Lighter rose for subtle backgrounds
          dark: '#8B6F66', // Darker rose for text on light bg
        },
        background: '#FDFBF9', // Warm off-white
        success: '#16A34A',
        warning: '#EA580C',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
