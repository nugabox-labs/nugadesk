import { createContext, useContext, useState, type ReactNode } from 'react'

interface LayoutContextValue {
  /** 2차 사이드바 고정 표시 여부 (데스크탑) */
  sidebarOpen: boolean
  toggleSidebar: () => void
  /** 2차 사이드바 접힘 상태에서 슬라이드 오버레이 표시 여부 */
  sidebarSlideOpen: boolean
  openSidebarSlide: () => void
  closeSidebarSlide: () => void
  drawerOpen: boolean
  setDrawerOpen: (open: boolean) => void
  toggleDrawer: () => void
}

const LayoutContext = createContext<LayoutContextValue | null>(null)

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarSlideOpen, setSidebarSlideOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  function toggleSidebar() {
    setSidebarOpen((open) => !open)
    setSidebarSlideOpen(false)
  }

  return (
    <LayoutContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar,
        sidebarSlideOpen,
        openSidebarSlide: () => setSidebarSlideOpen(true),
        closeSidebarSlide: () => setSidebarSlideOpen(false),
        drawerOpen,
        setDrawerOpen,
        toggleDrawer: () => setDrawerOpen((v) => !v),
      }}
    >
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayout() {
  const ctx = useContext(LayoutContext)
  if (!ctx) throw new Error('useLayout must be used within LayoutProvider')
  return ctx
}
