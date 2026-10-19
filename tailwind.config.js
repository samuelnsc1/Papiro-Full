/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1d4ed8',
          hover: '#1e40af',
          subtle: 'rgba(29, 78, 216, 0.12)'
        }
      }
    },
  },
  plugins: [],
}
