import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** @type {import('tailwindcss').Config} */
export default {
  // Caminhos absolutos — o plugin do PostCSS resolve `content` a partir do
  // cwd do processo (a raiz do repo, quando "vite client" roda de lá), não
  // a partir desta pasta; caminhos relativos aqui nunca casavam com nenhum
  // arquivo e o Tailwind gerava zero classes utilitárias.
  content: [resolve(__dirname, './index.html'), resolve(__dirname, './src/**/*.{ts,tsx}')],
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
        // Paleta azul-marinho escuro — substitui o slate cinza em todo o projeto.
        // Cada tom aponta pra uma variável CSS (definida em index.css, formato
        // "R G B") em vez de um hex fixo, pra poder virar clara no tema light sem
        // editar nenhuma página — a imensa maioria do app usa bg/border/text-slate-*
        // como "cor semântica de painel", não como cinza literal. O padrão
        // rgb(var(--x) / <alpha-value>) é a forma documentada do Tailwind pra cor
        // vinda de variável CSS continuar aceitando modificador de opacidade
        // (bg-slate-700/50 etc.) — sem isso, essas classes eram descartadas na
        // hora de gerar o CSS. slate-950 fica de fora (valor fixo, ver index.css):
        // é usado só como overlay de modal, que deve continuar escuro nos dois temas.
        slate: {
          50:  'rgb(var(--slate-50) / <alpha-value>)',
          100: 'rgb(var(--slate-100) / <alpha-value>)',
          200: 'rgb(var(--slate-200) / <alpha-value>)',
          300: 'rgb(var(--slate-300) / <alpha-value>)',
          400: 'rgb(var(--slate-400) / <alpha-value>)',
          500: 'rgb(var(--slate-500) / <alpha-value>)',
          600: 'rgb(var(--slate-600) / <alpha-value>)',
          700: 'rgb(var(--slate-700) / <alpha-value>)',   // bordas, hover, divisores
          800: 'rgb(var(--slate-800) / <alpha-value>)',   // fundo de cards e painéis
          900: 'rgb(var(--slate-900) / <alpha-value>)',   // fundo da página
          950: '#070f1c',                                  // overlay de modal — fixo, não tematiza
        },
      },
    },
  },
  plugins: [],
}
