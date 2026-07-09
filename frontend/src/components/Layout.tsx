import clsx from 'clsx'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import { FaIcon } from './FaIcon'
import { PrimaryNav } from './PrimaryNav'
import { Sidebar } from './Sidebar'

export function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="h-full flex">
      <PrimaryNav onNavigate={() => setDrawerOpen(false)} />

      <div className="hidden lg:flex">
        <Sidebar onNavigate={() => {}} />
      </div>

      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden
        />
      )}
      <div
        className={clsx(
          'lg:hidden fixed inset-y-0 left-0 z-30 transition-transform duration-200',
          drawerOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <Sidebar onNavigate={() => setDrawerOpen(false)} />
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <button
          type="button"
          className="lg:hidden fixed top-3 left-3 z-10 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-gray-600"
          onClick={() => setDrawerOpen((v) => !v)}
          aria-label="메뉴 열기/닫기"
        >
          <FaIcon name="bars" />
        </button>
        <main className="flex-1 min-w-0 overflow-y-auto p-4 pt-16 pb-20 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
