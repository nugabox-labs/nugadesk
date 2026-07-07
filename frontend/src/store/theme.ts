import { create } from 'zustand'

export type ThemeMode = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'nugadesk-theme'

function resolveIsDark(mode: ThemeMode): boolean {
  return mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
}

function applyTheme(mode: ThemeMode) {
  document.documentElement.classList.toggle('dark', resolveIsDark(mode))
}

function readStoredMode(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
}

interface ThemeState {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: readStoredMode(),
  setMode: (mode) => {
    localStorage.setItem(STORAGE_KEY, mode)
    applyTheme(mode)
    set({ mode })
  },
}))

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (useThemeStore.getState().mode === 'system') applyTheme('system')
})
