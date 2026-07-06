import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../lib/api'
import type { Project } from '../lib/types'

export function useProjects(categoryId: string | undefined) {
  return useQuery({
    queryKey: ['task-categories', categoryId, 'projects'],
    queryFn: () => api.get<Project[]>(`/task-categories/${categoryId}/projects`),
    enabled: !!categoryId,
  })
}

export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => api.get<Project>(`/projects/${projectId}`),
    enabled: !!projectId,
  })
}

export function useCreateProject(categoryId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { name: string; description?: string }) =>
      api.post<Project>(`/task-categories/${categoryId}/projects`, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['task-categories', categoryId, 'projects'] }),
  })
}

export function useUpdateProject(categoryId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; name?: string; description?: string; status?: string }) =>
      api.patch<Project>(`/projects/${id}`, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['task-categories', categoryId, 'projects'] }),
  })
}

export function useDeleteProject(categoryId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['task-categories', categoryId, 'projects'] }),
  })
}
