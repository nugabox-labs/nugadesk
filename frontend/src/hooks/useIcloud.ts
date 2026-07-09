import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../lib/api'

export interface IcloudStatus {
  connected: boolean
  apple_id_email?: string | null
  connected_at?: string | null
  last_sync_at?: string | null
  last_sync_error?: string | null
  reminder_list_count?: number | null
  poll_enabled?: boolean
  poll_interval_seconds?: number
  auto_sync_debounce_seconds?: number
}

export interface IcloudReminderList {
  uid: string
  name: string
}

interface IcloudConnectResponse {
  connected: boolean
  apple_id_email: string
  connected_at: string
  reminder_lists: IcloudReminderList[]
}

export interface IcloudSyncResult {
  ok: boolean
  message: string
  pulled: number
  pushed: number
  updated: number
  deleted: number
  skipped: number
}

export function useIcloudStatus() {
  return useQuery({
    queryKey: ['icloud', 'status'],
    queryFn: () => api.get<IcloudStatus>('/icloud/status'),
    refetchInterval: (query) => (query.state.data?.connected ? 30_000 : false),
  })
}

export function useIcloudLists(enabled: boolean) {
  return useQuery({
    queryKey: ['icloud', 'lists'],
    queryFn: async () => {
      const data = await api.get<{ lists: IcloudReminderList[] }>('/icloud/lists')
      return data.lists
    },
    enabled,
    staleTime: 60_000,
  })
}

export function useIcloudConnect() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { apple_id_email: string; app_specific_password: string }) =>
      api.post<IcloudConnectResponse>('/icloud/connect', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['icloud'] })
    },
  })
}

export function useIcloudDisconnect() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete('/icloud/disconnect'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['icloud'] })
    },
  })
}

export function useIcloudSync() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<IcloudSyncResult>('/icloud/sync'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['icloud'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
