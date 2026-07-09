import { useMemo } from 'react'
import { useLocation, useParams } from 'react-router-dom'

import { useDashboardTree } from './useDashboard'
import { useNav } from './useNav'
import { findCategoryPath } from '../lib/categoryTree'
import { findPageMetaByPath, getActivePrimary } from '../lib/nav'

export interface BreadcrumbItem {
  label: string
  to?: string
}

export function usePageMeta(overrides?: { title?: string; description?: string }) {
  const { pathname } = useLocation()
  const { categoryId } = useParams<{ categoryId: string }>()
  const { data: navItems } = useNav()
  const { data: categories } = useDashboardTree()

  return useMemo(() => {
    const activePrimary = navItems ? getActivePrimary(pathname, navItems) : null
    const navMeta = navItems ? findPageMetaByPath(pathname, navItems) : null
    const categoryPath =
      categoryId && categories ? findCategoryPath(categories, categoryId) : null
    const categoryNode = categoryPath?.at(-1)

    const breadcrumbs: BreadcrumbItem[] = []
    if (activePrimary) {
      breadcrumbs.push({ label: activePrimary.label, to: activePrimary.route_path })
    }
    if (categoryPath && categoryPath.length > 0) {
      const tasksSecondary = activePrimary?.secondary_items.find(
        (item) => item.item_type === 'link' && item.route_path === '/tasks',
      )
      if (tasksSecondary) {
        breadcrumbs.push({ label: tasksSecondary.label, to: '/tasks' })
      }
      categoryPath.forEach((node, index) => {
        const isLast = index === categoryPath.length - 1
        breadcrumbs.push({
          label: node.name,
          to: isLast ? undefined : `/category/${node.id}`,
        })
      })
    } else if (navMeta?.secondary && navMeta.secondary.route_path !== activePrimary?.route_path) {
      breadcrumbs.push({ label: navMeta.secondary.label })
    }

    const title =
      overrides?.title ??
      categoryNode?.name ??
      navMeta?.title ??
      activePrimary?.page_title ??
      activePrimary?.label ??
      'NUGADESK'

    const description =
      overrides?.description ?? (categoryNode ? undefined : navMeta?.description)

    return { title, description, breadcrumbs, activePrimary }
  }, [pathname, categoryId, navItems, categories, overrides?.title, overrides?.description])
}
