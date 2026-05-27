/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#16a34a',
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Paleta azul-marinho escuro — substitui o slate cinza em todo o projeto
        slate: {
          50:  '#f0f5fa',
          100: '#dce8f4',
          200: '#b8d0e8',
          300: '#8aafc8',
          400: '#6090b0',
          500: '#3d6a90',
          600: '#2a4d6e',
          700: '#1d3a55',   // bordas, hover, divisores
          800: '#122438',   // fundo de cards e painéis
          900: '#0c1828',   // fundo da página e sidebar
          950: '#070f1c',   // fundo mais escuro (loading, overlays)
        },
      },
    },
  },
  plugins: [],
}
