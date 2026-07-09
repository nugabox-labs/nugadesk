import { useState } from 'react'
import type { CSSProperties } from 'react'

import { CategoryFormModal } from './CategoryFormModal'
import { CategoryNode } from './CategoryNode'
import { useSettingsStore } from '../store/settings'
import { useDashboardTree } from '../hooks/useDashboard'

export function TaskStatusGrid() {
  const { data: categories, isLoading } = useDashboardTree()
  const taskColumns = useSettingsStore((s) => s.taskColumns)
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base sm:text-lg font-bold">작업 현황</h2>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
          + 분류 추가
        </button>
      </div>

      {isLoading && <p className="text-gray-400">불러오는 중...</p>}

      <div className="task-grid" style={{ '--task-cols': taskColumns } as CSSProperties}>
        {categories?.map((category) => (
          <div key={category.id} className="card-flat p-5">
            <CategoryNode node={category} isTopLevel />
          </div>
        ))}
      </div>
      {!isLoading && categories?.length === 0 && (
        <p className="text-gray-400 text-sm">아직 분류가 없습니다. 위 버튼으로 추가해보세요.</p>
      )}

      {showCreate && <CategoryFormModal parentId={null} onClose={() => setShowCreate(false)} />}
    </div>
  )
}
