import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { FaIcon } from './FaIcon'
import { PAGE_CONTAINER_CLASS } from './PageShell'
import { useLayout } from '../context/LayoutContext'
import type { BreadcrumbItem } from '../hooks/usePageMeta'
import { usePageMeta } from '../hooks/usePageMeta'

function BreadcrumbTrail({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  if (items.length === 0) return null
  return (
    <nav aria-label="breadcrumb" className={clsx('flex items-center gap-1.5 min-w-0', className)}>
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-1.5 min-w-0">
          {index > 0 && <span className="text-gray-300 shrink-0">/</span>}
          {item.to ? (
            <Link to={item.to} className="hover:text-gray-600 truncate">
              {item.label}
            </Link>
          ) : (
            <span className="truncate text-gray-500">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
}: {
  title: string
  description?: string
  breadcrumbs: BreadcrumbItem[]
}) {
  return (
    <header className="page-header shrink-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-gray-900 truncate">{title}</h1>
          {description && <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{description}</p>}
        </div>
        <div className="hidden lg:flex items-center shrink-0 max-w-[50%]">
          <BreadcrumbTrail
            items={breadcrumbs}
            className="text-xs text-gray-400 font-medium justify-end"
          />
        </div>
      </div>
    </header>
  )
}

export function MobileBreadcrumbBar({
  breadcrumbs,
  title,
}: {
  breadcrumbs: BreadcrumbItem[]
  title?: string
}) {
  const { toggleDrawer } = useLayout()

  return (
    <div className="lg:hidden app-mobile-header-inner shrink-0">
      <button
        type="button"
        onClick={toggleDrawer}
        className="w-9 h-8 rounded-[10px] bg-gray-200/90 flex items-center justify-center text-gray-700 shrink-0 cursor-pointer"
        aria-label="메뉴 열기"
      >
        <FaIcon name="bars" />
      </button>
      <div className="flex-1 min-w-0 flex items-baseline gap-2">
        {title ? (
          <span className="text-base font-bold text-gray-900 truncate">{title}</span>
        ) : (
          <BreadcrumbTrail items={breadcrumbs} className="text-xs text-gray-400 font-medium flex-1" />
        )}
      </div>
    </div>
  )
}

function DesktopExpandedHeader({
  title,
  description,
  breadcrumbs,
}: {
  title: string
  description?: string
  breadcrumbs: BreadcrumbItem[]
}) {
  if (breadcrumbs.length <= 1) {
    return (
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-gray-900 truncate">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{description}</p>}
      </div>
    )
  }

  return <PageHeader title={title} description={description} breadcrumbs={breadcrumbs} />
}

export function StickyPageHeader() {
  const location = useLocation()
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [compact, setCompact] = useState(false)
  const [barMounted, setBarMounted] = useState(false)
  const [barVisible, setBarVisible] = useState(false)
  const { breadcrumbs, title, description } = usePageMeta()
  const showTitle = breadcrumbs.length <= 1

  useEffect(() => {
    const sentinel = sentinelRef.current
    const scrollParent = sentinel?.closest('main')
    if (!sentinel || !scrollParent) return

    setCompact(false)
    setBarMounted(false)
    setBarVisible(false)

    const observer = new IntersectionObserver(
      ([entry]) => setCompact(!entry.isIntersecting),
      { root: scrollParent, threshold: 0 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [location.pathname])

  useEffect(() => {
    if (compact) {
      setBarMounted(true)
      setBarVisible(false)
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setBarVisible(true))
      })
      return () => cancelAnimationFrame(raf)
    }

    setBarVisible(false)
    const timer = window.setTimeout(() => setBarMounted(false), 220)
    return () => window.clearTimeout(timer)
  }, [compact])

  return (
    <>
      <div className="lg:hidden sticky top-0 z-10 app-sticky-header pt-3 pb-2.5">
        <div className="px-4 lg:px-8">
          <div className={PAGE_CONTAINER_CLASS}>
            <MobileBreadcrumbBar breadcrumbs={breadcrumbs} title={showTitle ? title : undefined} />
          </div>
        </div>
      </div>

      <div className="hidden lg:block px-4 lg:px-8">
        <div className={PAGE_CONTAINER_CLASS}>
          <div ref={sentinelRef} className="pt-6 pb-4">
            <DesktopExpandedHeader title={title} description={description} breadcrumbs={breadcrumbs} />
          </div>
        </div>
      </div>

      {barMounted && (
        <div className="hidden lg:block sticky top-0 z-10 h-0 overflow-visible">
          <div
            className={clsx(
              'app-compact-header-bar',
              barVisible && 'is-visible',
              !barVisible && 'is-leaving',
            )}
          >
            <div className="px-4 lg:px-8 py-2.5">
              <div className={PAGE_CONTAINER_CLASS}>
                <h1 className="text-base font-bold text-gray-900 text-center truncate">{title}</h1>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
