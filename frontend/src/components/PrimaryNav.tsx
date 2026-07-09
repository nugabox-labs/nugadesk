import clsx from 'clsx'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { FaIcon } from './FaIcon'
import { SettingsModal, type SettingsSection } from './SettingsModal'
import { useAuthStore } from '../store/auth'

export type PrimarySection = 'home' | 'tasks' | 'assets' | 'info'

export function getActiveSection(pathname: string): PrimarySection {
  if (pathname.startsWith('/tasks') || pathname.startsWith('/category/')) return 'tasks'
  if (pathname.startsWith('/assets')) return 'assets'
  if (pathname.startsWith('/info')) return 'info'
  return 'home'
}

const PRIMARY_ITEMS: { id: PrimarySection; to: string; icon: string; label: string }[] = [
  { id: 'home', to: '/', icon: 'house', label: '홈' },
  { id: 'tasks', to: '/tasks', icon: 'folder-open', label: '작업' },
  { id: 'assets', to: '/assets', icon: 'sack-dollar', label: '자산' },
  { id: 'info', to: '/info', icon: 'book-open', label: '정보' },
]

function NavButton({
  to,
  onClick,
  active,
  icon,
  label,
  compact,
  iconOnly,
}: {
  to?: string
  onClick?: () => void
  active: boolean
  icon: ReactNode
  label: string
  compact?: boolean
  iconOnly?: boolean
}) {
  const className = clsx(
    'flex flex-col items-center rounded-[10px]',
    compact ? 'flex-1 justify-center gap-0.5 py-1' : 'w-full gap-0.5 py-1',
    active
      ? 'bg-[var(--color-nav-hover-bg)] text-[var(--color-nav-active-text)]'
      : 'text-gray-400 hover:bg-[var(--color-nav-hover-bg)] hover:text-[var(--color-nav-active-text)]',
  )
  const content = (
    <>
      <span
        className={clsx(
          'flex items-center justify-center',
          compact ? 'w-7 h-7 text-base' : 'w-8 h-8 text-base',
        )}
      >
        {icon}
      </span>
      {!iconOnly && (
        <span className={clsx('font-semibold', compact ? 'text-[10px]' : 'text-[11px]')}>{label}</span>
      )}
    </>
  )

  if (to) {
    return (
      <Link to={to} onClick={onClick} className={className} aria-label={iconOnly ? label : undefined}>
        {content}
      </Link>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      aria-label={iconOnly ? label : undefined}
    >
      {content}
    </button>
  )
}

export function PrimaryNav({ onNavigate }: { onNavigate: () => void }) {
  const location = useLocation()
  const active = getActiveSection(location.pathname)
  const avatarUrl = useAuthStore((s) => s.avatarUrl)
  const [settingsSection, setSettingsSection] = useState<SettingsSection | null>(null)

  const avatarIcon = (size: string) =>
    avatarUrl ? (
      <span className={clsx(size, 'rounded-full overflow-hidden')}>
        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
      </span>
    ) : (
      <FaIcon name="circle-user" />
    )

  return (
    <>
      {/* Desktop: vertical rail */}
      <nav
        className="hidden lg:flex w-16 shrink-0 flex-col items-center gap-0.5 py-2 px-1.5"
        style={{ backgroundColor: 'var(--color-primary-nav-bg)' }}
      >
        <div className="flex-1 flex flex-col items-center gap-0.5 w-full">
          {PRIMARY_ITEMS.map((item) => (
            <NavButton
              key={item.id}
              to={item.to}
              active={active === item.id}
              icon={<FaIcon name={item.icon} />}
              label={item.label}
            />
          ))}
        </div>

        <div className="flex flex-col items-center gap-0.5 w-full">
          <NavButton
            active={false}
            onClick={() => setSettingsSection('task')}
            icon={<FaIcon name="gear" />}
            label="설정"
            iconOnly
          />
          <NavButton
            active={false}
            onClick={() => setSettingsSection('user')}
            icon={avatarIcon('w-6 h-6')}
            label="프로필"
            iconOnly
          />
        </div>
      </nav>

      {/* Mobile: bottom tab bar */}
      <nav
        className="lg:hidden fixed inset-x-0 bottom-0 z-30 flex items-stretch h-14 shrink-0 px-1"
        style={{ backgroundColor: 'var(--color-primary-nav-bg)' }}
      >
        {PRIMARY_ITEMS.map((item) => (
          <NavButton
            key={item.id}
            to={item.to}
            onClick={onNavigate}
            active={active === item.id}
            icon={<FaIcon name={item.icon} />}
            label={item.label}
            compact
          />
        ))}
        <NavButton
          active={false}
          onClick={() => setSettingsSection('task')}
          icon={<FaIcon name="gear" />}
          label="설정"
          compact
          iconOnly
        />
        <NavButton
          active={false}
          onClick={() => setSettingsSection('user')}
          icon={avatarIcon('w-5 h-5')}
          label="프로필"
          compact
          iconOnly
        />
      </nav>

      {settingsSection && (
        <SettingsModal initialSection={settingsSection} onClose={() => setSettingsSection(null)} />
      )}
    </>
  )
}
