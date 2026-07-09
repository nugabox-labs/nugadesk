import { create } from 'zustand'

const STORAGE_KEY = 'nugadesk-task-columns'
const MIN_COLUMNS = 1
const MAX_COLUMNS = 4
const DEFAULT_COLUMNS = 2

function clamp(value: number): number {
  return Math.min(MAX_COLUMNS, Math.max(MIN_COLUMNS, value))
}

function readStoredColumns(): number {
  const stored = Number(localStorage.getItem(STORAGE_KEY))
  return Number.isInteger(stored) && stored > 0 ? clamp(stored) : DEFAULT_COLUMNS
}

interface SettingsState {
  taskColumns: number
  setTaskColumns: (columns: number) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  taskColumns: readStoredColumns(),
  setTaskColumns: (columns) => {
    const clamped = clamp(columns)
    localStorage.setItem(STORAGE_KEY, String(clamped))
    set({ taskColumns: clamped })
  },
}))

export { MIN_COLUMNS, MAX_COLUMNS }
