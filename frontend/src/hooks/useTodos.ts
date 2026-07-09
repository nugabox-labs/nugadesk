import { useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '../lib/api'
import type { Todo, TodoRepeatRule, TodoStatus } from '../lib/types'

function useInvalidateDashboard() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['dashboard'] })
}

export function useCreateTodo(categoryId: string | undefined) {
  const invalidate = useInvalidateDashboard()
  return useMutation({
    mutationFn: (payload: {
      title: string
      notes?: string
      due_date?: string
      priority?: number
      repeat_rule?: TodoRepeatRule | null
    }) => api.post<Todo>(`/categories/${categoryId}/todos`, payload),
    onSuccess: invalidate,
  })
}

export function useUpdateTodo() {
  const invalidate = useInvalidateDashboard()
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: string
      title?: string
      notes?: string
      due_date?: string | null
      priority?: number
      repeat_rule?: TodoRepeatRule | null
      status?: TodoStatus
      sort_order?: number
    }) => api.patch<Todo>(`/todos/${id}`, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteTodo() {
  const invalidate = useInvalidateDashboard()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/todos/${id}`),
    onSuccess: invalidate,
  })
}
