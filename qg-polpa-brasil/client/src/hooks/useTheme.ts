import { useSyncExternalStore } from 'react'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'qg-theme'
const CHANGE_EVENT = 'qg-theme-change'

function readStoredTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // localStorage indisponível (modo privado etc.) — tema só não persiste
  }
}

function setTheme(theme: Theme) {
  applyTheme(theme)
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}

// Estado de tema compartilhado entre qualquer componente que precise saber o
// tema atual (o botão de toggle, e páginas com gráficos que não conseguem ler
// variável CSS em atributo SVG). useSyncExternalStore garante que todo mundo
// re-renderiza junto quando o tema muda em QUALQUER instância — client/index.html
// já aplica o tema salvo antes do primeiro paint, então este hook só mantém o
// estado do React em sincronia depois disso.
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readStoredTheme, () => 'dark')

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return { theme, toggleTheme }
}
