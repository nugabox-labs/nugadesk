import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, ApiError } from '../lib/api'
import { useAuthStore } from '../store/auth'

interface MeResponse {
  username: string
  remember: boolean
}

export function useMeQuery() {
  const setUser = useAuthStore((s) => s.setUser)
  const setChecked = useAuthStore((s) => s.setChecked)

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const me = await api.get<MeResponse>('/auth/me')
        setUser(me.username)
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
