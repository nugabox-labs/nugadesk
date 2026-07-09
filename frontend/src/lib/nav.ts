import type { NavPrimaryItem, NavSecondaryItem } from './types'

function prefixMatches(pathname: string, prefix: string): boolean {
  if (prefix === '/') return pathname === '/'
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

/** 현재 경로에 해당하는 1차 메뉴 항목을 반환한다. */
export function getActivePrimary(pathname: string, items: NavPrimaryItem[]): NavPrimaryItem | null {
  if (pathname.startsWith('/category/') || pathname === '/category') {
    return (
      items.find(
        (item) =>
          item.route_path === '/tasks' ||
          item.path_prefixes?.split(',').some((p) => p.trim() === '/category'),
      ) ?? null
    )
  }

  let best: NavPrimaryItem | null = null
  let bestScore = -1

  for (const item of items) {
    const prefixes = [
      item.route_path,
      ...(item.path_prefixes?.split(',').map((s) => s.trim()).filter(Boolean) ?? []),
    ]
    for (const prefix of prefixes) {
      if (!prefixMatches(pathname, prefix)) continue
      const score = prefix === '/' ? 0 : prefix.length
      if (score > bestScore) {
        best = item
        bestScore = score
      }
    }

    for (const secondary of item.secondary_items) {
      if (secondary.item_type !== 'link' || !secondary.route_path) continue
      if (!isSecondaryLinkActive(pathname, secondary)) continue
      const score = secondary.route_path === '/' ? 0 : secondary.route_path.length
      if (score > bestScore) {
        best = item
        bestScore = score
      }
    }
  }

  return best
}

/** 링크형 2차 메뉴가 현재 경로와 일치하는지 판별한다. */
export function isSecondaryLinkActive(pathname: string, item: NavSecondaryItem): boolean {
  if (item.item_type !== 'link' || !item.route_path) return false
  if (item.route_path === '/') return pathname === '/'
  if (item.route_path === '/info') {
    return pathname === '/info' || pathname.startsWith('/info/documents')
  }
  return pathname === item.route_path
}

/** 분류 상세 경로에서 해당 카테고리 2차 항목이 활성인지 판별한다. */
export function isCategorySecondaryActive(pathname: string, categoryId: string): boolean {
  const prefix = `/category/${categoryId}`
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

/** 경로에 맞는 링크형 2차 메뉴 메타를 찾는다. */
export function findPageMetaByPath(pathname: string, items: NavPrimaryItem[]) {
  for (const primary of items) {
    for (const secondary of primary.secondary_items) {
      if (secondary.item_type !== 'link' || !secondary.route_path) continue
      if (!isSecondaryLinkActive(pathname, secondary)) continue
      return {
        title: secondary.page_title || secondary.label,
        description: secondary.page_description ?? undefined,
        primary,
        secondary,
      }
    }
  }
  return null
}
