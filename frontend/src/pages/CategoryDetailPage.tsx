import { useState } from 'react'
import { useParams } from 'react-router-dom'

import { CategoryFormModal } from '../components/CategoryFormModal'
import { CategoryNode } from '../components/CategoryNode'
import { PageShell } from '../components/PageShell'
import { useDeleteCategory } from '../hooks/useCategories'
import { useDashboardTree } from '../hooks/useDashboard'
import { findCategoryPath } from '../lib/categoryTree'

export function CategoryDetailPage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const { data: categories, isLoading } = useDashboardTree()
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState(false)
  const deleteCategory = useDeleteCategory()

  const path = categoryId && categories ? findCategoryPath(categories, categoryId) : null
  const node = path?.at(-1)

  if (isLoading) return <p className="text-gray-400">불러오는 중...</p>
  if (!node) return <p className="text-gray-400">분류를 찾을 수 없습니다.</p>

  const isMapped = !!(node.icloud_list_uid || node.icloud_list_name)

  return (
    <PageShell>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="btn btn-ghost btn-sm text-danger"
            onClick={() => {
              if (confirm(`'${node.name}' 분류를 삭제할까요? (30일 내 복구 가능)`)) {
                deleteCategory.mutate(node.id)
              }
            }}
          >
            삭제
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
            수정
          </button>
          {!isMapped && (
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
              + 분류 추가
            </button>
          )}
        </div>
        <div className="card p-5">
          <CategoryNode node={node} isTopLevel mode="detail" />
        </div>
      </div>

      {showCreate && <CategoryFormModal parentId={node.id} onClose={() => setShowCreate(false)} />}
      {editing && (
        <CategoryFormModal
          parentId={node.parent_id}
          initial={node}
          hasChildren={node.children.length > 0}
          onClose={() => setEditing(false)}
        />
      )}
    </PageShell>
  )
}
