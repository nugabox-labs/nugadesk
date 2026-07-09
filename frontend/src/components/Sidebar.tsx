import clsx from 'clsx'
import { Link, useLocation, useMatch } from 'react-router-dom'

import { getActiveSection } from './PrimaryNav'
import { useDashboardTree } from '../hooks/useDashboard'

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
        'px-2.5 py-2 rounded-[8px] text-base font-semibold truncate',
        isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50',
      )}
    >
      {label}
    </Link>
  )
}

export function Sidebar({ onNavigate }: { onNavigate: () => void }) {
  const location = useLocation()
  const section = getActiveSection(location.pathname)
  const { data: categories } = useDashboardTree()

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
        {section === 'home' && <SecondaryRow to="/" end label="대시보드" onNavigate={onNavigate} />}

        {section === 'tasks' && (
          <>
            <SecondaryRow to="/tasks" label="작업 관리" onNavigate={onNavigate} />
            {categories?.map((category) => (
              <SecondaryRow
                key={category.id}
                to={`/category/${category.id}`}
                label={category.name}
                onNavigate={onNavigate}
              />
            ))}
          </>
        )}

        {section === 'assets' && <SecondaryRow to="/assets" label="자산 관리" onNavigate={onNavigate} />}
        {section === 'info' && <SecondaryRow to="/info" label="정보 관리" onNavigate={onNavigate} />}
      </nav>
    </aside>
  )
}
