import type { CategoryTree } from '../lib/types'
import type { TaskCategorySort } from '../store/settings'

export function sortTopLevelCategories(
  categories: CategoryTree[],
  sort: TaskCategorySort,
): CategoryTree[] {
  const sorted = [...categories]

  switch (sort) {
    case 'created_at':
      return sorted.sort((a, b) => a.created_at.localeCompare(b.created_at))
    case 'created_at_desc':
      return sorted.sort((a, b) => b.created_at.localeCompare(a.created_at))
    case 'updated_at':
      return sorted.sort((a, b) => a.updated_at.localeCompare(b.updated_at))
    case 'updated_at_desc':
      return sorted.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    case 'sort_order':
    default:
      return sorted.sort(
        (a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at),
      )
  }
}
