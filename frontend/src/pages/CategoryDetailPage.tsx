import { Fragment } from 'react'
import { Link, useParams } from 'react-router-dom'

import { CategoryNode } from '../components/CategoryNode'
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
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
        <Link to="/" className="hover:underline">
          대시보드
        </Link>
        {path?.map((ancestor, i) => (
          <Fragment key={ancestor.id}>
            <span>/</span>
            {i === path.length - 1 ? (
              <span className="text-gray-800 font-semibold">{ancestor.name}</span>
            ) : (
              <Link to={`/category/${ancestor.id}`} className="hover:underline">
                {ancestor.name}
              </Link>
            )}
          </Fragment>
        ))}
      </div>

      <div className="card p-5">
        <CategoryNode node={node} isTopLevel />
      </div>
    </div>
  )
}
