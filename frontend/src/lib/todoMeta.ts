export type TodoPriority = 0 | 1
export type TodoRepeatRule = 'daily' | 'weekly' | 'monthly' | 'yearly'

export const TODO_PRIORITY_NORMAL = 0
export const TODO_PRIORITY_URGENT = 1

export const PRIORITY_OPTIONS: { value: TodoPriority; label: string }[] = [
  { value: 0, label: '보통' },
  { value: 1, label: '긴급' },
]

export const REPEAT_OPTIONS: { value: TodoRepeatRule | ''; label: string }[] = [
  { value: '', label: '없음' },
  { value: 'daily', label: '매일' },
  { value: 'weekly', label: '매주' },
  { value: 'monthly', label: '매월' },
  { value: 'yearly', label: '매년' },
]

const REPEAT_LABELS: Record<TodoRepeatRule, string> = {
  daily: '매일',
  weekly: '매주',
  monthly: '매월',
  yearly: '매년',
}

export function isUrgentPriority(priority: number): boolean {
  return priority === TODO_PRIORITY_URGENT
}

export function repeatLabel(rule: string | null | undefined): string | null {
  if (!rule) return null
  return REPEAT_LABELS[rule as TodoRepeatRule] ?? rule
}

export function normalizePriority(priority: number): TodoPriority {
  return priority >= 1 ? 1 : 0
}
