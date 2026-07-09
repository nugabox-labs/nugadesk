import clsx from 'clsx'
import { Link, useLocation } from 'react-router-dom'

import { CategoryIcon } from './CategoryIcon'
import { useDashboardTree } from '../hooks/useDashboard'
import { useNav } from '../hooks/useNav'
import { getActivePrimary, isCategorySecondaryActive, isSecondaryLinkActive } from '../lib/nav'
import type { NavSecondaryItem } from '../lib/types'

function SecondaryRow({
  to,
  label,
  active,
  onNavigate,
  icon,
}: {
  to: string
  label: string
  active: boolean
  onNavigate: () => void
  icon?: string | null
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={clsx(
        'flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] text-sm font-semibold min-w-0',
        active ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50',
      )}
    >
      {icon ? (
        <CategoryIcon icon={icon} className="w-4 h-4 text-sm shrink-0 rounded-[4px]" />
      ) : null}
      <span className="truncate">{label}</span>
    </Link>
  )
}

function SecondaryHeading({
  label,
  icon,
}: {
  label: string
  icon?: string | null
}) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 pt-4 pb-1 text-xs font-semibold text-gray-400 tracking-tight min-w-0">
      {icon ? <CategoryIcon icon={icon} className="w-3.5 h-3.5 text-xs shrink-0" /> : null}
      <span className="truncate">{label}</span>
    </div>
  )
}

function renderSecondaryItem(
  item: NavSecondaryItem,
  pathname: string,
  categories: ReturnType<typeof useDashboardTree>['data'],
  onNavigate: () => void,
): React.ReactNode | React.ReactNode[] {
  if (item.item_type === 'heading') {
    return <SecondaryHeading key={item.id} label={item.label} icon={item.icon} />
  }
  if (item.item_type === 'categories') {
    return categories?.map((category) => (
      <SecondaryRow
        key={category.id}
        to={`/category/${category.id}`}
        label={category.name}
        icon={category.icon}
        active={isCategorySecondaryActive(pathname, category.id)}
        onNavigate={onNavigate}
      />
    ))
  }
  if (item.item_type === 'link' && item.route_path) {
    return (
      <SecondaryRow
        key={item.id}
        to={item.route_path}
        label={item.label}
        icon={item.icon}
        active={isSecondaryLinkActive(pathname, item)}
        onNavigate={onNavigate}
      />
    )
  }
  return null
}

export function Sidebar({ onNavigate }: { onNavigate: () => void }) {
  const { pathname } = useLocation()
  const { data: navItems } = useNav()
  const { data: categories } = useDashboardTree()
  const activePrimary = navItems ? getActivePrimary(pathname, navItems) : null
  const secondaryItems = [...(activePrimary?.secondary_items ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  )

  return (
    <aside
      className="w-40 lg:w-44 xl:w-52 shrink-0 bg-gray-50 flex flex-col h-full"
      style={{ borderRight: '1px solid var(--color-nav-border)' }}
    >
      <div className="flex items-center gap-2 px-3 h-14 shrink-0">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-2 min-w-0">
          <img src="/logo-192.png" alt="NUGADESK" className="w-7 h-7 rounded-[7px] shrink-0" />
          <span className="font-bold text-sm xl:text-base tracking-tight truncate">NUGADESK</span>
        </Link>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto px-2 flex flex-col gap-0.5">
        {secondaryItems.flatMap((item) => {
          const rendered = renderSecondaryItem(item, pathname, categories, onNavigate)
          return Array.isArray(rendered) ? rendered : rendered ? [rendered] : []
        })}
      </nav>
    </aside>
  )
}
