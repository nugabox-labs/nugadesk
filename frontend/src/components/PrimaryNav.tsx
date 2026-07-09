import clsx from 'clsx'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { FaIcon } from './FaIcon'
import { SettingsModal, type SettingsSection } from './SettingsModal'
import { useNav } from '../hooks/useNav'
import { getActivePrimary } from '../lib/nav'
import { useAuthStore } from '../store/auth'

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

/** 설정/프로필 chrome 버튼 — 배경 없이 아이콘 색만 변경 */
function ChromeNavButton({
  onClick,
  icon,
  label,
  compact,
  iconClassName,
}: {
  onClick: () => void
  icon: ReactNode
  label: string
  compact?: boolean
  iconClassName?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={clsx(
        'group flex flex-col items-center rounded-[10px] text-gray-400',
        compact ? 'flex-1 justify-center gap-0.5 py-1' : 'w-full gap-0.5 py-1',
      )}
    >
      <span
        className={clsx(
          'flex items-center justify-center transition-colors group-hover:text-[var(--color-nav-active-text)]',
          iconClassName ?? (compact ? 'w-7 h-7 text-base' : 'w-8 h-8 text-base'),
        )}
      >
        {icon}
      </span>
    </button>
  )
}

function ProfileAvatar({ avatarUrl, size }: { avatarUrl: string | null; size: string }) {
  if (!avatarUrl) {
    return <FaIcon name="circle-user" />
  }
  return (
    <span className={clsx('nav-profile-avatar', size)}>
      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
    </span>
  )
}

export function PrimaryNav({ onNavigate }: { onNavigate: () => void }) {
  const location = useLocation()
  const { data: navItems } = useNav()
  const activePrimary = navItems ? getActivePrimary(location.pathname, navItems) : null
  const avatarUrl = useAuthStore((s) => s.avatarUrl)
  const [settingsSection, setSettingsSection] = useState<SettingsSection | null>(null)

  return (
    <>
      {/* Desktop: vertical rail */}
      <nav
        className="hidden lg:flex w-16 shrink-0 flex-col items-center gap-0.5 py-2 px-1.5"
        style={{ backgroundColor: 'var(--color-primary-nav-bg)' }}
      >
        <div className="flex-1 flex flex-col items-center gap-0.5 w-full">
          {navItems?.map((item) => (
            <NavButton
              key={item.id}
              to={item.route_path}
              active={activePrimary?.id === item.id}
              icon={<FaIcon name={item.icon} />}
              label={item.label}
            />
          ))}
        </div>

        <div className="flex flex-col items-center gap-0.5 w-full">
          <ChromeNavButton
            onClick={() => setSettingsSection('task')}
            icon={<FaIcon name="gear" />}
            label="설정"
          />
          <ChromeNavButton
            onClick={() => setSettingsSection('user')}
            icon={<ProfileAvatar avatarUrl={avatarUrl} size="w-8 h-8" />}
            label="프로필"
            iconClassName="w-9 h-9 text-xl"
          />
        </div>
      </nav>

      {/* Mobile: bottom tab bar */}
      <nav
        className="lg:hidden fixed inset-x-0 bottom-0 z-30 flex items-stretch h-14 shrink-0 px-1"
        style={{ backgroundColor: 'var(--color-primary-nav-bg)' }}
      >
        {navItems?.map((item) => (
          <NavButton
            key={item.id}
            to={item.route_path}
            onClick={onNavigate}
            active={activePrimary?.id === item.id}
            icon={<FaIcon name={item.icon} />}
            label={item.label}
            compact
          />
        ))}
        <ChromeNavButton
          onClick={() => setSettingsSection('task')}
          icon={<FaIcon name="gear" />}
          label="설정"
          compact
        />
        <ChromeNavButton
          onClick={() => setSettingsSection('user')}
          icon={<ProfileAvatar avatarUrl={avatarUrl} size="w-7 h-7" />}
          label="프로필"
          compact
          iconClassName="w-8 h-8 text-lg"
        />
      </nav>

      {settingsSection && (
        <SettingsModal initialSection={settingsSection} onClose={() => setSettingsSection(null)} />
      )}
    </>
  )
}
