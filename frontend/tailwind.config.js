/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          50: '#E8F3F0',
          100: '#C7E3DC',
          500: '#1F6F5C',
          600: '#1A5C4C',
          700: '#154A3D',
        },
      },
    },
  },
  plugins: [],
}
