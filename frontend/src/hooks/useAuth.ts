import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, ApiError } from '../lib/api'
import type { AppleAuthConfig } from '../lib/appleAuth'
import {
  initAppleAuth,
  isAppleOriginAvailable,
  loadAppleSdk,
  redirectToAppleSignIn,
  setAppleAuthPending,
  signInWithApple,
} from '../lib/appleAuth'
import { useAuthStore } from '../store/auth'

interface MeResponse {
  username: string
  remember: boolean
  avatar_url: string | null
  apple_linked: boolean
}

async function fetchAppleConfig(): Promise<AppleAuthConfig> {
  const config = await api.get<AppleAuthConfig>('/auth/apple/config')
  if (!config.enabled || !config.client_id || !config.redirect_uri) {
    throw new ApiError(503, 'Apple 로그인이 설정되지 않았습니다.')
  }
  if (!isAppleOriginAvailable(config)) {
    throw new ApiError(400, 'Apple 로그인은 등록된 도메인에서만 사용할 수 있습니다.')
  }
  return config
}

async function getAppleIdTokenPopup(): Promise<string> {
  const config = await fetchAppleConfig()
  await loadAppleSdk()
  initAppleAuth(config.client_id!, config.redirect_uri!, true)
  const appleResponse = await signInWithApple()
  return appleResponse.authorization.id_token
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

export function useAppleAuthConfig() {
  return useQuery({
    queryKey: ['auth', 'apple', 'config'],
    queryFn: () => api.get<AppleAuthConfig>('/auth/apple/config'),
    staleTime: 5 * 60 * 1000,
  })
}

/** 로그인 페이지: Apple authorize URL로 직접 리다이렉트 (fragment 모드, POST 405 회피) */
export function useAppleLogin() {
  return useMutation({
    mutationFn: async (remember_me: boolean) => {
      const config = await fetchAppleConfig()
      setAppleAuthPending('login', remember_me)
      redirectToAppleSignIn(config.client_id!, config.redirect_uri!)
    },
  })
}

/** 설정: 팝업 모드로 현재 계정에 Apple ID 연결 */
export function useAppleLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const id_token = await getAppleIdTokenPopup()
      return api.post<MeResponse>('/auth/apple/link', { id_token })
    },
    onSuccess: (me) => {
      queryClient.setQueryData(['auth', 'me'], me)
    },
  })
}

export async function completeAppleLogin(id_token: string, remember_me: boolean): Promise<MeResponse> {
  await api.post('/auth/apple/login', { id_token, remember_me })
  return api.get<MeResponse>('/auth/me')
}

export async function completeAppleLink(id_token: string): Promise<MeResponse> {
  return api.post<MeResponse>('/auth/apple/link', { id_token })
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

export function isAppleSignInAvailable(config: AppleAuthConfig | undefined): boolean {
  return isAppleOriginAvailable(config)
}
