import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../lib/api'

export interface BookmarkLink {
  id: string
  title: string
  url: string
  note: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

const LINKS_KEY = ['links'] as const

export function useLinks() {
  return useQuery({
    queryKey: LINKS_KEY,
    queryFn: () => api.get<BookmarkLink[]>('/links'),
  })
}

export function useCreateLink() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { title: string; url: string; note?: string }) =>
      api.post<BookmarkLink>('/links', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LINKS_KEY }),
  })
}

export function useUpdateLink() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; title?: string; url?: string; note?: string | null }) =>
      api.patch<BookmarkLink>(`/links/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LINKS_KEY }),
  })
}

export function useDeleteLink() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/links/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LINKS_KEY }),
  })
}
