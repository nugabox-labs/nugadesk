import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../lib/api'
import type { NavPrimaryItem, NavSecondaryItem, NavSecondaryItemType } from '../lib/types'

const NAV_KEY = ['nav'] as const

export function useNav() {
  return useQuery({
    queryKey: NAV_KEY,
    queryFn: () => api.get<NavPrimaryItem[]>('/nav'),
  })
}

function useInvalidateNav() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: NAV_KEY })
}

export function useCreatePrimaryNav() {
  const invalidate = useInvalidateNav()
  return useMutation({
    mutationFn: (payload: {
      label: string
      icon?: string | null
      route_path: string
      path_prefixes?: string | null
      sort_order?: number
    }) => api.post<NavPrimaryItem>('/nav/primary', payload),
    onSuccess: invalidate,
  })
}

export function useUpdatePrimaryNav() {
  const invalidate = useInvalidateNav()
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: string
      label?: string
      icon?: string | null
      route_path?: string
      path_prefixes?: string | null
      sort_order?: number
    }) => api.patch<NavPrimaryItem>(`/nav/primary/${id}`, payload),
    onSuccess: invalidate,
  })
}

export function useDeletePrimaryNav() {
  const invalidate = useInvalidateNav()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/nav/primary/${id}`),
    onSuccess: invalidate,
  })
}

export function useReorderPrimaryNav() {
  const invalidate = useInvalidateNav()
  return useMutation({
    mutationFn: (ids: string[]) => api.put<NavPrimaryItem[]>('/nav/primary/reorder', { ids }),
    onSuccess: invalidate,
  })
}

export function useCreateSecondaryNav() {
  const invalidate = useInvalidateNav()
  return useMutation({
    mutationFn: (payload: {
      primary_id: string
      item_type: NavSecondaryItemType
      label: string
      icon?: string | null
      route_path?: string | null
      page_title?: string | null
      page_description?: string | null
      sort_order?: number
    }) => api.post<NavSecondaryItem>('/nav/secondary', payload),
    onSuccess: invalidate,
  })
}

export function useUpdateSecondaryNav() {
  const invalidate = useInvalidateNav()
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: string
      item_type?: NavSecondaryItemType
      label?: string
      icon?: string | null
      route_path?: string | null
      page_title?: string | null
      page_description?: string | null
      sort_order?: number
    }) => api.patch<NavSecondaryItem>(`/nav/secondary/${id}`, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteSecondaryNav() {
  const invalidate = useInvalidateNav()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/nav/secondary/${id}`),
    onSuccess: invalidate,
  })
}

export function useReorderSecondaryNav() {
  const invalidate = useInvalidateNav()
  return useMutation({
    mutationFn: ({ primaryId, ids }: { primaryId: string; ids: string[] }) =>
      api.put<NavSecondaryItem[]>(`/nav/secondary/reorder?primary_id=${primaryId}`, { ids }),
    onSuccess: invalidate,
  })
}
