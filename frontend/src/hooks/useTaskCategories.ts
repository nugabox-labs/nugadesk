import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../lib/api'
import type { TaskCategory } from '../lib/types'

export function useTaskCategories(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['workspaces', workspaceId, 'task-categories'],
    queryFn: () => api.get<TaskCategory[]>(`/workspaces/${workspaceId}/task-categories`),
    enabled: !!workspaceId,
  })
}

export function useCreateTaskCategory(workspaceId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { name: string; icloud_list_name?: string }) =>
      api.post<TaskCategory>(`/workspaces/${workspaceId}/task-categories`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId, 'task-categories'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateTaskCategory(workspaceId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; name?: string }) =>
      api.patch<TaskCategory>(`/task-categories/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId, 'task-categories'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteTaskCategory(workspaceId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/task-categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId, 'task-categories'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
