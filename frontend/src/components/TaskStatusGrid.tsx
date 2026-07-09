import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'

import { CategoryFormModal } from './CategoryFormModal'
import { CategoryNode } from './CategoryNode'
import { sortTopLevelCategories } from '../lib/sortCategories'
import { TASK_CATEGORY_SORT_OPTIONS, useSettingsStore } from '../store/settings'
import { useDashboardTree } from '../hooks/useDashboard'

export function TaskStatusGrid() {
  const { data: categories, isLoading } = useDashboardTree()
  const taskColumns = useSettingsStore((s) => s.taskColumns)
  const taskCategorySort = useSettingsStore((s) => s.taskCategorySort)
  const setTaskCategorySort = useSettingsStore((s) => s.setTaskCategorySort)
  const [showCreate, setShowCreate] = useState(false)

  const sortedCategories = useMemo(
    () => (categories ? sortTopLevelCategories(categories, taskCategorySort) : undefined),
    [categories, taskCategorySort],
  )

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base sm:text-lg font-bold">작업 현황</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="input h-9 w-auto min-w-[8.5rem] py-0 text-sm font-semibold"
            value={taskCategorySort}
            onChange={(e) => setTaskCategorySort(e.target.value as typeof taskCategorySort)}
            aria-label="분류 정렬"
          >
            {TASK_CATEGORY_SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
            + 분류 추가
          </button>
        </div>
      </div>

      {isLoading && <p className="text-gray-400">불러오는 중...</p>}

      <div className="task-grid" style={{ '--task-cols': taskColumns } as CSSProperties}>
        {sortedCategories?.map((category) => (
          <div key={category.id} className="card-flat p-5">
            <CategoryNode node={category} isTopLevel />
          </div>
        ))}
      </div>
      {!isLoading && sortedCategories?.length === 0 && (
        <p className="text-gray-400 text-sm">아직 분류가 없습니다. 위 버튼으로 추가해보세요.</p>
      )}

      {showCreate && <CategoryFormModal parentId={null} onClose={() => setShowCreate(false)} />}
    </div>
  )
}
