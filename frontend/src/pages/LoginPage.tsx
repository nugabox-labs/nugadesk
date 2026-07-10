import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { AppleSignInButton } from '../components/AppleSignInButton'
import { isAppleSignInAvailable, useAppleAuthConfig, useAppleLogin, useLogin } from '../hooks/useAuth'
import { ApiError } from '../lib/api'
import { useAuthStore } from '../store/auth'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const login = useLogin()
  const appleLogin = useAppleLogin()
  const { data: appleConfig } = useAppleAuthConfig()
  const currentUsername = useAuthStore((s) => s.username)
  const location = useLocation()

  const appleConfigured = appleConfig?.enabled === true
  const appleAvailable = isAppleSignInAvailable(appleConfig)
  const isPending = login.isPending || appleLogin.isPending

  if (currentUsername) {
    const from = (location.state as { from?: string })?.from ?? '/'
    return <Navigate to={from} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await login.mutateAsync({ username, password, remember_me: rememberMe })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '로그인에 실패했습니다.')
    }
  }

  async function handleAppleLogin() {
    setError(null)
    try {
      await appleLogin.mutateAsync(rememberMe)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error && err.message.includes('popup')) {
        setError('Apple 로그인 창이 닫혔습니다.')
      } else {
        setError('Apple 로그인에 실패했습니다.')
      }
    }
  }

  return (
    <div className="h-full flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm card p-8">
        <div className="flex flex-col items-center gap-2 mb-8">
          <img src="/logo-192.png" alt="NUGADESK" className="w-12 h-12 rounded-[10px]" />
          <h1 className="text-xl font-bold">NUGADESK</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            className="input"
            placeholder="아이디"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="비밀번호"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label className="flex items-center gap-2 text-sm text-gray-600 select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4"
            />
            로그인 상태 유지
          </label>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button type="submit" className="btn btn-primary btn-lg mt-2" disabled={isPending}>
            {login.isPending ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {appleConfigured && (
          <>
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">또는</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <AppleSignInButton
              pending={appleLogin.isPending}
              disabled={!appleAvailable || isPending}
              disabledHint="Apple 로그인은 https://work.nugabox.com 에서만 사용할 수 있습니다."
              onClick={handleAppleLogin}
            />
          </>
        )}
      </div>
    </div>
  )
}
