import { useState } from 'react'

import { CategoryFormModal } from '../components/CategoryFormModal'
import { CategoryNode } from '../components/CategoryNode'
import { useDashboardTree } from '../hooks/useDashboard'

export function DashboardPage() {
  const { data: categories, isLoading } = useDashboardTree()
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + 분류 추가
        </button>
      </div>

      {isLoading && <p className="text-gray-400">불러오는 중...</p>}

      <div className="flex flex-col gap-4">
        {categories?.map((category) => (
          <div key={category.id} className="card p-5">
            <CategoryNode node={category} isTopLevel />
          </div>
        ))}
        {!isLoading && categories?.length === 0 && (
          <p className="text-gray-400 text-sm">아직 분류가 없습니다. 위 버튼으로 추가해보세요.</p>
        )}
      </div>

      {showCreate && <CategoryFormModal parentId={null} onClose={() => setShowCreate(false)} />}
    </div>
  )
}
