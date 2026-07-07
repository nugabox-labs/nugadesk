import { Link } from 'react-router-dom'

import { useLogout } from '../hooks/useAuth'
import { useAuthStore } from '../store/auth'
import { ThemeToggle } from './ThemeToggle'
import { VersionBadge } from './VersionBadge'

export function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const username = useAuthStore((s) => s.username)
  const logout = useLogout()

  return (
    <header className="h-16 shrink-0 border-b border-gray-200 bg-white flex items-center justify-between px-4 gap-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="btn btn-ghost btn-sm px-2 lg:hidden"
          onClick={onToggleSidebar}
          aria-label="메뉴 열기/닫기"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo-192.png" alt="NUGADESK" className="w-8 h-8 rounded-[8px]" />
          <span className="font-bold text-lg tracking-tight">NUGADESK</span>
        </Link>
        <VersionBadge />
      </div>

      <div className="flex-1 max-w-md hidden md:block">
        <input type="search" placeholder="검색" className="input h-10" />
      </div>

      <div className="flex items-center gap-2">
        {username && <span className="text-sm text-gray-600 hidden sm:inline">{username}</span>}
        <ThemeToggle />
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => logout.mutate()}>
          로그아웃
        </button>
      </div>
    </header>
  )
}
