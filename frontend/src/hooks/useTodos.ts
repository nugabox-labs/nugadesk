import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../lib/api'
import type { Todo, TodoStatus } from '../lib/types'

export function useTodos(projectId: string | undefined) {
  return useQuery({
    queryKey: ['projects', projectId, 'todos'],
    queryFn: () => api.get<Todo[]>(`/projects/${projectId}/todos`),
    enabled: !!projectId,
  })
}

export function useCreateTodo(projectId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { title: string; notes?: string; due_date?: string; priority?: number }) =>
      api.post<Todo>(`/projects/${projectId}/todos`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'todos'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateTodo(projectId: string | undefined) {
  const queryClient = useQueryClient()
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'todos'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteTodo(projectId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/todos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'todos'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
