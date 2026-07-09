import clsx from 'clsx'
import { useState } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { FaIcon } from './FaIcon'
import { CategoryIcon } from './CategoryIcon'
import { SidebarToggleButton } from './SidebarToggleButton'
import { SettingsModal, type SettingsSection } from './SettingsModal'
import { useLayout } from '../context/LayoutContext'
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
  onClick?: (e: MouseEvent) => void
  active: boolean
  icon: ReactNode
  label: string
  compact?: boolean
  iconOnly?: boolean
}) {
  const className = clsx(
    'flex flex-col items-center rounded-[10px] cursor-pointer',
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
  showLabel,
}: {
  onClick: () => void
  icon: ReactNode
  label: string
  compact?: boolean
  iconClassName?: string
  showLabel?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={clsx(
        'group flex flex-col items-center rounded-[10px] text-gray-400 cursor-pointer',
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
      {showLabel && compact && (
        <span className="text-[10px] font-semibold group-hover:text-[var(--color-nav-active-text)]">
          {label}
        </span>
      )}
    </button>
  )
}

function ProfileAvatar({ avatarUrl, size }: { avatarUrl: string | null; size: string }) {
  const [failed, setFailed] = useState(false)
  if (!avatarUrl || failed) {
    return <FaIcon name="circle-user" />
  }
  return (
    <span className={clsx('nav-profile-avatar rounded-full', size)}>
      <img
        src={avatarUrl}
        alt=""
        className="w-full h-full object-cover rounded-full"
        onError={() => setFailed(true)}
      />
    </span>
  )
}

export function PrimaryNav({ onNavigate }: { onNavigate: () => void }) {
  const location = useLocation()
  const { data: navItems } = useNav()
  const activePrimary = navItems ? getActivePrimary(location.pathname, navItems) : null
  const avatarUrl = useAuthStore((s) => s.avatarUrl)
  const { sidebarOpen, sidebarSlideOpen, toggleSidebar, openSidebarSlide, closeSidebarSlide } = useLayout()
  const [settingsSection, setSettingsSection] = useState<SettingsSection | null>(null)

  function handlePrimaryItemClick(isActive: boolean): boolean {
    if (sidebarOpen) return true
    if (isActive && sidebarSlideOpen) {
      closeSidebarSlide()
      return false
    }
    openSidebarSlide()
    return true
  }

  return (
    <>
      {/* Desktop: vertical rail */}
      <nav
        className="hidden lg:flex w-16 shrink-0 flex-col items-center gap-0.5 py-2 px-1.5"
        style={{ backgroundColor: 'var(--color-primary-nav-bg)' }}
      >
        <div className="flex-1 flex flex-col items-center gap-0.5 w-full">
          {navItems?.map((item) => {
            const isActive = activePrimary?.id === item.id
            return (
              <NavButton
                key={item.id}
                to={item.route_path}
                active={isActive}
                icon={<CategoryIcon icon={item.icon} className="text-base" />}
                label={item.label}
                onClick={(e) => {
                  if (!handlePrimaryItemClick(isActive)) {
                    e.preventDefault()
                  }
                }}
              />
            )
          })}
        </div>

        <div className="flex flex-col items-center gap-0.5 w-full">
          <ChromeNavButton
            onClick={toggleSidebar}
            icon={<SidebarToggleButton open={sidebarOpen} />}
            label={sidebarOpen ? '사이드바 닫기' : '사이드바 열기'}
          />
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
            icon={<CategoryIcon icon={item.icon} className="text-base" />}
            label={item.label}
            compact
          />
        ))}
        <ChromeNavButton
          onClick={() => setSettingsSection('task')}
          icon={<ProfileAvatar avatarUrl={avatarUrl} size="w-7 h-7" />}
          label="설정"
          compact
          showLabel
        />
      </nav>

      {settingsSection && (
        <SettingsModal initialSection={settingsSection} onClose={() => setSettingsSection(null)} />
      )}
    </>
  )
}
