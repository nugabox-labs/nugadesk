import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, ApiError } from '../lib/api'
import { useAuthStore } from '../store/auth'

interface MeResponse {
  username: string
  remember: boolean
  avatar_url: string | null
}

export function useMeQuery() {
  const setUser = useAuthStore((s) => s.setUser)
  const setChecked = useAuthStore((s) => s.setChecked)

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const me = await api.get<MeResponse>('/auth/me')
        setUser(me.username, me.avatar_url)
        return me
      } catch (err) {
        setUser(null)
        if (err instanceof ApiError && err.status === 401) return null
        throw err
      } finally {
        setChecked(true)
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: (payload: { username: string; password: string; remember_me: boolean }) =>
      api.post('/auth/login', payload),
    onSuccess: async (_data, variables) => {
      setUser(variables.username)
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => {
      setUser(null)
      queryClient.clear()
    },
  })
}

export function useUpdateAvatar() {
  const queryClient = useQueryClient()
  const setAvatarUrl = useAuthStore((s) => s.setAvatarUrl)

  return useMutation({
    mutationFn: (avatar_url: string) => api.patch<MeResponse>('/auth/avatar', { avatar_url }),
    onSuccess: (me) => {
      setAvatarUrl(me.avatar_url)
      queryClient.setQueryData(['auth', 'me'], me)
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: { current_password: string; new_password: string }) =>
      api.patch('/auth/password', payload),
  })
}
