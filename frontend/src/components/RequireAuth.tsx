import { Navigate, Outlet } from 'react-router-dom'

import { useMeQuery } from '../hooks/useAuth'
import { useAuthStore } from '../store/auth'

export function RequireAuth() {
  const { isLoading } = useMeQuery()
  const { username, checked } = useAuthStore()

  if (isLoading && !checked) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        불러오는 중...
      </div>
    )
  }

  if (!username) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
