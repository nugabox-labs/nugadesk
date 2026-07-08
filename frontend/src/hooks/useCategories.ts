import { useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '../lib/api'
import type { Category } from '../lib/types'

function useInvalidateDashboard() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['dashboard'] })
}

export function useCreateCategory() {
  const invalidate = useInvalidateDashboard()
  return useMutation({
    mutationFn: (payload: {
      name: string
      parent_id?: string | null
      icon?: string
      color?: string
      icloud_list_uid?: string
      icloud_list_name?: string
    }) => api.post<Category>('/categories', payload),
    onSuccess: invalidate,
  })
}

export function useUpdateCategory() {
  const invalidate = useInvalidateDashboard()
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: string
      name?: string
      icon?: string
      color?: string
      icloud_list_uid?: string | null
      icloud_list_name?: string | null
    }) => api.patch<Category>(`/categories/${id}`, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteCategory() {
  const invalidate = useInvalidateDashboard()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: invalidate,
  })
}
