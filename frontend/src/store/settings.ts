import { create } from 'zustand'

const STORAGE_KEY = 'nugadesk-task-columns'
const SORT_STORAGE_KEY = 'nugadesk-task-category-sort'
const MIN_COLUMNS = 1
const MAX_COLUMNS = 4
const DEFAULT_COLUMNS = 2

export type TaskCategorySort =
  | 'sort_order'
  | 'created_at'
  | 'created_at_desc'
  | 'updated_at'
  | 'updated_at_desc'

export const TASK_CATEGORY_SORT_OPTIONS: { value: TaskCategorySort; label: string }[] = [
  { value: 'sort_order', label: '기본 순서' },
  { value: 'created_at', label: '생성일 순' },
  { value: 'created_at_desc', label: '생성일 역순' },
  { value: 'updated_at', label: '업데이트 순' },
  { value: 'updated_at_desc', label: '업데이트 역순' },
]

const DEFAULT_SORT: TaskCategorySort = 'created_at'

function isTaskCategorySort(value: string): value is TaskCategorySort {
  return TASK_CATEGORY_SORT_OPTIONS.some((opt) => opt.value === value)
}

function clamp(value: number): number {
  return Math.min(MAX_COLUMNS, Math.max(MIN_COLUMNS, value))
}

function readStoredColumns(): number {
  const stored = Number(localStorage.getItem(STORAGE_KEY))
  return Number.isInteger(stored) && stored > 0 ? clamp(stored) : DEFAULT_COLUMNS
}

function readStoredSort(): TaskCategorySort {
  const stored = localStorage.getItem(SORT_STORAGE_KEY)
  return stored && isTaskCategorySort(stored) ? stored : DEFAULT_SORT
}

interface SettingsState {
  taskColumns: number
  taskCategorySort: TaskCategorySort
  setTaskColumns: (columns: number) => void
  setTaskCategorySort: (sort: TaskCategorySort) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  taskColumns: readStoredColumns(),
  taskCategorySort: readStoredSort(),
  setTaskColumns: (columns) => {
    const clamped = clamp(columns)
    localStorage.setItem(STORAGE_KEY, String(clamped))
    set({ taskColumns: clamped })
  },
  setTaskCategorySort: (sort) => {
    localStorage.setItem(SORT_STORAGE_KEY, sort)
    set({ taskCategorySort: sort })
  },
}))

export { MIN_COLUMNS, MAX_COLUMNS }
