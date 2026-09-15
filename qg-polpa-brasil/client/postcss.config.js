import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default {
  plugins: {
    // Caminho absoluto pro tailwind.config.js desta mesma pasta — com {} (ou
    // um caminho relativo) o plugin resolve a partir do cwd do processo (a
    // raiz do repo, quando "vite client" roda de lá), e acaba achando o
    // tailwind.config.js órfão da raiz em vez deste, ou resolvendo `content`
    // relativo à pasta errada.
    tailwindcss: { config: resolve(__dirname, './tailwind.config.js') },
    autoprefixer: {},
  },
}
