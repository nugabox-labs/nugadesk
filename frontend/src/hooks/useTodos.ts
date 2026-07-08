import { useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '../lib/api'
import type { Todo, TodoStatus } from '../lib/types'

function useInvalidateDashboard() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['dashboard'] })
}

export function useCreateTodo(categoryId: string | undefined) {
  const invalidate = useInvalidateDashboard()
  return useMutation({
    mutationFn: (payload: { title: string; notes?: string; due_date?: string; priority?: number }) =>
      api.post<Todo>(`/categories/${categoryId}/todos`, payload),
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
