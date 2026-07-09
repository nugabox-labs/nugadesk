import type { NavPrimaryItem } from './types'

function prefixMatches(pathname: string, prefix: string): boolean {
  if (prefix === '/') return pathname === '/'
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

/** 현재 경로에 해당하는 1차 메뉴 항목을 반환한다. */
export function getActivePrimary(pathname: string, items: NavPrimaryItem[]): NavPrimaryItem | null {
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
  }

  return best ?? items[0] ?? null
}
