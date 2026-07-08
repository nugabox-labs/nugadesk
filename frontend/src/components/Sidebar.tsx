import clsx from 'clsx'
import { NavLink } from 'react-router-dom'

import { useDashboardTree } from '../hooks/useDashboard'
import { CategoryIcon } from './CategoryIcon'

export function Sidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const { data: categories } = useDashboardTree()

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={onNavigate}
          aria-hidden
        />
      )}
      <aside
        className={clsx(
          'w-64 shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-y-auto',
          'fixed lg:static inset-y-0 left-0 z-30 transition-transform duration-200 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <nav className="p-3 flex flex-col gap-1">
          <NavLink
            to="/"
            end
            onClick={onNavigate}
            className={({ isActive }) =>
              clsx(
                'px-3 py-2 rounded-[10px] text-sm font-semibold',
                isActive ? 'bg-primary-light text-primary' : 'text-gray-700 hover:bg-gray-100',
              )
            }
          >
            대시보드
          </NavLink>
        </nav>

        <div className="px-3 pt-2 pb-1 text-xs font-bold text-gray-400 uppercase tracking-wide">
          분류
        </div>
        <nav className="px-3 flex flex-col gap-1 pb-4">
          {categories?.map((category) => (
            <NavLink
              key={category.id}
              to={`/category/${category.id}`}
              onClick={onNavigate}
              className={({ isActive }) =>
                clsx(
                  'px-3 py-2 rounded-[10px] text-sm font-semibold flex items-center gap-2',
                  isActive ? 'bg-primary-light text-primary' : 'text-gray-700 hover:bg-gray-100',
                )
              }
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: category.color ?? '#3182f6' }}
              />
              <CategoryIcon
                icon={category.icon}
                color={category.color}
                className="w-4 h-4 rounded-[4px] text-xs"
              />
              <span className="truncate">{category.name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
