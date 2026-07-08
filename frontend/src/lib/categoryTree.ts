import type { CategoryTree } from './types'

/** Path from a root category down to `targetId` (inclusive), or null if not found. */
export function findCategoryPath(tree: CategoryTree[], targetId: string): CategoryTree[] | null {
  for (const node of tree) {
    if (node.id === targetId) return [node]
    const childPath = findCategoryPath(node.children, targetId)
    if (childPath) return [node, ...childPath]
  }
  return null
}
