import clsx from 'clsx'
import { Link, useLocation, useMatch } from 'react-router-dom'

import { useDashboardTree } from '../hooks/useDashboard'
import { useNav } from '../hooks/useNav'
import { getActivePrimary } from '../lib/nav'
import type { NavSecondaryItem } from '../lib/types'

function SecondaryRow({
  to,
  end,
  label,
  onNavigate,
}: {
  to: string
  end?: boolean
  label: string
  onNavigate: () => void
}) {
  const isActive = !!useMatch({ path: to, end: end ?? false })

  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={clsx(
        'px-2.5 py-1.5 rounded-[8px] text-sm font-semibold truncate',
        isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50',
      )}
    >
      {label}
    </Link>
  )
}

function SecondaryHeading({ label }: { label: string }) {
  return (
    <div className="px-2.5 pt-4 pb-1 text-xs font-semibold text-gray-400 tracking-tight">{label}</div>
  )
}

function renderSecondaryItem(
  item: NavSecondaryItem,
  categories: ReturnType<typeof useDashboardTree>['data'],
  onNavigate: () => void,
): React.ReactNode | React.ReactNode[] {
  if (item.item_type === 'heading') {
    return <SecondaryHeading key={item.id} label={item.label} />
  }
  if (item.item_type === 'categories') {
    return categories?.map((category) => (
      <SecondaryRow
        key={category.id}
        to={`/category/${category.id}`}
        label={category.name}
        onNavigate={onNavigate}
      />
    ))
  }
  if (item.item_type === 'link' && item.route_path) {
    return (
      <SecondaryRow
        key={item.id}
        to={item.route_path}
        end={item.route_path === '/'}
        label={item.label}
        onNavigate={onNavigate}
      />
    )
  }
  return null
}

export function Sidebar({ onNavigate }: { onNavigate: () => void }) {
  const location = useLocation()
  const { data: navItems } = useNav()
  const { data: categories } = useDashboardTree()
  const activePrimary = navItems ? getActivePrimary(location.pathname, navItems) : null
  const secondaryItems = [...(activePrimary?.secondary_items ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  )

  return (
    <aside
      className="w-56 shrink-0 bg-gray-50 flex flex-col h-full"
      style={{ borderRight: '1px solid var(--color-nav-border)' }}
    >
      <div className="flex items-center gap-2 px-3 h-14 shrink-0">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-2">
          <img src="/logo-192.png" alt="NUGADESK" className="w-7 h-7 rounded-[7px]" />
          <span className="font-bold text-base tracking-tight">NUGADESK</span>
        </Link>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto px-2 flex flex-col gap-0.5">
        {secondaryItems.flatMap((item) => {
          const rendered = renderSecondaryItem(item, categories, onNavigate)
          return Array.isArray(rendered) ? rendered : rendered ? [rendered] : []
        })}
      </nav>
    </aside>
  )
}
