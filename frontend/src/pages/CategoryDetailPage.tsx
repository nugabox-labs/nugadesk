import { useParams } from 'react-router-dom'

import { CategoryNode } from '../components/CategoryNode'
import { PageShell } from '../components/PageShell'
import { useDashboardTree } from '../hooks/useDashboard'
import { findCategoryPath } from '../lib/categoryTree'

export function CategoryDetailPage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const { data: categories, isLoading } = useDashboardTree()

  const path = categoryId && categories ? findCategoryPath(categories, categoryId) : null
  const node = path?.at(-1)

  if (isLoading) return <p className="text-gray-400">불러오는 중...</p>
  if (!node) return <p className="text-gray-400">분류를 찾을 수 없습니다.</p>

  return (
    <PageShell>
      <div className="card p-5">
        <CategoryNode node={node} isTopLevel />
      </div>
    </PageShell>
  )
}
