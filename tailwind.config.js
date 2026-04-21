/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,html}'],
  theme: {
    extend: {
      colors: {
        // Palette sombre cinéma (validable, on peut ajuster)
        bg: {
          DEFAULT: '#0f172a',
          card: '#1e293b',
          elevated: '#334155'
        },
        accent: {
          DEFAULT: '#f59e0b',  // ambre, évoque la lumière tungstène
          hover: '#fbbf24'
        }
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif']
      }
    }
  },
  plugins: []
};