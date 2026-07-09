import clsx from 'clsx'
import { Outlet } from 'react-router-dom'

import { StickyPageHeader } from './PageHeader'
import { PrimaryNav } from './PrimaryNav'
import { Sidebar } from './Sidebar'
import { LayoutProvider, useLayout } from '../context/LayoutContext'

function DesktopSidebarSlide() {
  const { sidebarOpen, sidebarSlideOpen, closeSidebarSlide } = useLayout()

  if (sidebarOpen || !sidebarSlideOpen) return null

  return (
    <>
      <div
        className="app-drawer-backdrop hidden lg:block fixed inset-y-0 right-0 left-16 z-20"
        onClick={closeSidebarSlide}
        aria-hidden
      />
      <div
        className={clsx(
          'hidden lg:flex fixed inset-y-0 left-16 z-30 transition-transform duration-200 ease-out shadow-lg',
          sidebarSlideOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <Sidebar onNavigate={closeSidebarSlide} />
      </div>
    </>
  )
}

function LayoutBody() {
  const { sidebarOpen, drawerOpen, setDrawerOpen } = useLayout()

  return (
    <div className="h-full flex">
      <PrimaryNav onNavigate={() => setDrawerOpen(false)} />

      {sidebarOpen && (
        <div className="hidden lg:flex">
          <Sidebar onNavigate={() => {}} />
        </div>
      )}

      <DesktopSidebarSlide />

      {drawerOpen && (
        <div
          className="app-drawer-backdrop fixed inset-0 z-20 lg:hidden"
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
        <main className="flex-1 min-w-0 overflow-y-auto pb-20 lg:pb-8">
          <StickyPageHeader />
          <div className="px-4 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export function Layout() {
  return (
    <LayoutProvider>
      <LayoutBody />
    </LayoutProvider>
  )
}
