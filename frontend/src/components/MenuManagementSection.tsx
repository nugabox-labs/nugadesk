import { useState, type ReactNode } from 'react'
import clsx from 'clsx'

import { FaIcon } from './FaIcon'
import { FaIconPicker } from './FaIconPicker'
import {
  useCreatePrimaryNav,
  useCreateSecondaryNav,
  useDeletePrimaryNav,
  useDeleteSecondaryNav,
  useNav,
  useReorderPrimaryNav,
  useReorderSecondaryNav,
  useUpdatePrimaryNav,
  useUpdateSecondaryNav,
} from '../hooks/useNav'
import { ApiError } from '../lib/api'
import type { NavPrimaryItem, NavSecondaryItem, NavSecondaryItemType } from '../lib/types'

const SECONDARY_TYPE_LABELS: Record<NavSecondaryItemType, string> = {
  link: '링크',
  heading: '분류',
  categories: '분류 목록',
}

function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
}: {
  items: T[]
  onReorder: (ids: string[]) => void
  renderItem: (item: T, dragHandle: ReactNode) => ReactNode
}) {
  const [dragId, setDragId] = useState<string | null>(null)

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) return
    const ids = items.map((i) => i.id)
    const from = ids.indexOf(dragId)
    const to = ids.indexOf(targetId)
    if (from < 0 || to < 0) return
    const next = [...ids]
    next.splice(from, 1)
    next.splice(to, 0, dragId)
    onReorder(next)
    setDragId(null)
  }

  const dragHandle = (
    <span className="cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing">
      <FaIcon name="grip-vertical" />
    </span>
  )

  return (
    <div className="flex flex-col gap-1">
      {items.map((item) => (
        <div
          key={item.id}
          draggable
          onDragStart={() => setDragId(item.id)}
          onDragEnd={() => setDragId(null)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(item.id)}
          className={clsx(dragId === item.id && 'opacity-50')}
        >
          {renderItem(item, dragHandle)}
        </div>
      ))}
    </div>
  )
}

function PrimaryForm({
  initial,
  onDone,
  onCancel,
}: {
  initial?: NavPrimaryItem
  onDone: () => void
  onCancel: () => void
}) {
  const create = useCreatePrimaryNav()
  const update = useUpdatePrimaryNav()
  const [label, setLabel] = useState(initial?.label ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? 'circle')
  const [routePath, setRoutePath] = useState(initial?.route_path ?? '/')
  const [pathPrefixes, setPathPrefixes] = useState(initial?.path_prefixes ?? '')
  const [error, setError] = useState<string | null>(null)
  const pending = create.isPending || update.isPending

  async function submit() {
    setError(null)
    try {
      const payload = {
        label,
        icon,
        route_path: routePath,
        path_prefixes: pathPrefixes.trim() || null,
      }
      if (initial) {
        await update.mutateAsync({ id: initial.id, ...payload })
      } else {
        await create.mutateAsync(payload)
      }
      onDone()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '저장에 실패했습니다.')
    }
  }

  return (
    <div className="flex flex-col gap-3 p-3 rounded-[10px] border border-gray-200 bg-gray-50">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold text-gray-700">이름</span>
          <input className="input h-9" value={label} onChange={(e) => setLabel(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold text-gray-700">경로</span>
          <input className="input h-9" value={routePath} onChange={(e) => setRoutePath(e.target.value)} />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-semibold text-gray-700">추가 경로 접두사 (콤마 구분)</span>
        <input
          className="input h-9"
          placeholder="/category"
          value={pathPrefixes}
          onChange={(e) => setPathPrefixes(e.target.value)}
        />
      </label>
      <div className="flex flex-col gap-1 text-sm">
        <span className="font-semibold text-gray-700">아이콘</span>
        <FaIconPicker value={icon} onSelect={setIcon} />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <button type="button" className="btn btn-primary btn-sm" disabled={pending} onClick={submit}>
          {pending ? '저장 중...' : '저장'}
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>
          취소
        </button>
      </div>
    </div>
  )
}

function SecondaryForm({
  primaryId,
  initial,
  hasCategories,
  onDone,
  onCancel,
}: {
  primaryId: string
  initial?: NavSecondaryItem
  hasCategories: boolean
  onDone: () => void
  onCancel: () => void
}) {
  const create = useCreateSecondaryNav()
  const update = useUpdateSecondaryNav()
  const [itemType, setItemType] = useState<NavSecondaryItemType>(initial?.item_type ?? 'link')
  const [label, setLabel] = useState(initial?.label ?? '')
  const [routePath, setRoutePath] = useState(initial?.route_path ?? '/')
  const [error, setError] = useState<string | null>(null)
  const pending = create.isPending || update.isPending

  const typeOptions: NavSecondaryItemType[] = ['link', 'heading']
  if (!hasCategories || initial?.item_type === 'categories') {
    typeOptions.push('categories')
  }

  async function submit() {
    setError(null)
    try {
      const payload = {
        item_type: itemType,
        label,
        route_path: itemType === 'link' ? routePath : null,
      }
      if (initial) {
        await update.mutateAsync({ id: initial.id, ...payload })
      } else {
        await create.mutateAsync({ primary_id: primaryId, ...payload })
      }
      onDone()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '저장에 실패했습니다.')
    }
  }

  return (
    <div className="flex flex-col gap-3 p-3 rounded-[10px] border border-gray-200 bg-gray-50">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold text-gray-700">유형</span>
          <select
            className="input h-9"
            value={itemType}
            onChange={(e) => setItemType(e.target.value as NavSecondaryItemType)}
            disabled={initial?.item_type === 'categories'}
          >
            {typeOptions.map((t) => (
              <option key={t} value={t}>
                {SECONDARY_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold text-gray-700">이름</span>
          <input className="input h-9" value={label} onChange={(e) => setLabel(e.target.value)} />
        </label>
      </div>
      {itemType === 'link' && (
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold text-gray-700">경로</span>
          <input className="input h-9" value={routePath} onChange={(e) => setRoutePath(e.target.value)} />
        </label>
      )}
      {itemType === 'heading' && (
        <p className="text-xs text-gray-500">소제목은 클릭할 수 없는 텍스트로 2차 메뉴에 표시됩니다.</p>
      )}
      {itemType === 'categories' && (
        <p className="text-xs text-gray-500">분류 목록은 작업 분류 데이터를 자동으로 나열합니다.</p>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <button type="button" className="btn btn-primary btn-sm" disabled={pending} onClick={submit}>
          {pending ? '저장 중...' : '저장'}
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>
          취소
        </button>
      </div>
    </div>
  )
}

export function MenuManagementSection() {
  const { data: navItems, isLoading } = useNav()
  const reorderPrimary = useReorderPrimaryNav()
  const reorderSecondary = useReorderSecondaryNav()
  const deletePrimary = useDeletePrimaryNav()
  const deleteSecondary = useDeleteSecondaryNav()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingPrimaryId, setEditingPrimaryId] = useState<string | 'new' | null>(null)
  const [editingSecondaryId, setEditingSecondaryId] = useState<string | 'new' | null>(null)

  const selected = navItems?.find((item) => item.id === selectedId) ?? navItems?.[0] ?? null

  if (isLoading) return <p className="text-sm text-gray-400">불러오는 중...</p>
  if (!navItems) return <p className="text-sm text-danger">메뉴를 불러오지 못했습니다.</p>

  const secondaryItems = [...(selected?.secondary_items ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  const hasCategories = secondaryItems.some((item) => item.item_type === 'categories')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="font-bold text-lg">1차 메뉴</h3>
        <p className="text-sm text-gray-500 mt-1">왼쪽 아이콘 레일에 표시됩니다. 드래그하여 순서를 바꿀 수 있습니다.</p>
      </div>

      <SortableList
        items={navItems}
        onReorder={(ids) => reorderPrimary.mutate(ids)}
        renderItem={(item, dragHandle) =>
          editingPrimaryId === item.id ? (
            <PrimaryForm
              initial={item}
              onDone={() => setEditingPrimaryId(null)}
              onCancel={() => setEditingPrimaryId(null)}
            />
          ) : (
            <div
              className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-[10px] border',
                selected?.id === item.id
                  ? 'border-primary bg-primary-light/30'
                  : 'border-gray-200 bg-white hover:bg-gray-50',
              )}
            >
              {dragHandle}
              <button
                type="button"
                className="flex items-center gap-2 flex-1 min-w-0 text-left"
                onClick={() => setSelectedId(item.id)}
              >
                <FaIcon name={item.icon} />
                <span className="font-semibold truncate">{item.label}</span>
                <span className="text-xs text-gray-400 truncate">{item.route_path}</span>
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm px-2"
                onClick={() => setEditingPrimaryId(item.id)}
              >
                <FaIcon name="pen" />
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm px-2 text-danger"
                disabled={deletePrimary.isPending}
                onClick={() => {
                  if (confirm(`"${item.label}" 1차 메뉴를 삭제할까요?`)) {
                    deletePrimary.mutate(item.id)
                    if (selectedId === item.id) setSelectedId(null)
                  }
                }}
              >
                <FaIcon name="trash" />
              </button>
            </div>
          )
        }
      />

      {editingPrimaryId === 'new' ? (
        <PrimaryForm onDone={() => setEditingPrimaryId(null)} onCancel={() => setEditingPrimaryId(null)} />
      ) : (
        <button
          type="button"
          className="btn btn-secondary self-start"
          onClick={() => setEditingPrimaryId('new')}
        >
          1차 메뉴 추가
        </button>
      )}

      {selected && (
        <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
          <div>
            <h3 className="font-bold text-lg">2차 메뉴 — {selected.label}</h3>
            <p className="text-sm text-gray-500 mt-1">
              선택한 1차 메뉴의 사이드바 패널 항목입니다. &quot;분류&quot;는 소제목, &quot;분류 목록&quot;은
              작업 분류를 자동 표시합니다.
            </p>
          </div>

          <SortableList
            items={secondaryItems}
            onReorder={(ids) => reorderSecondary.mutate({ primaryId: selected.id, ids })}
            renderItem={(item, dragHandle) =>
              editingSecondaryId === item.id ? (
                <SecondaryForm
                  primaryId={selected.id}
                  initial={item}
                  hasCategories={hasCategories}
                  onDone={() => setEditingSecondaryId(null)}
                  onCancel={() => setEditingSecondaryId(null)}
                />
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-[10px] border border-gray-200 bg-white hover:bg-gray-50">
                  {dragHandle}
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold">{item.label}</span>
                    <span className="ml-2 text-xs text-gray-400">{SECONDARY_TYPE_LABELS[item.item_type]}</span>
                    {item.route_path && (
                      <span className="ml-2 text-xs text-gray-400">{item.route_path}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm px-2"
                    onClick={() => setEditingSecondaryId(item.id)}
                  >
                    <FaIcon name="pen" />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm px-2 text-danger"
                    disabled={deleteSecondary.isPending}
                    onClick={() => {
                      if (confirm(`"${item.label}" 항목을 삭제할까요?`)) {
                        deleteSecondary.mutate(item.id)
                      }
                    }}
                  >
                    <FaIcon name="trash" />
                  </button>
                </div>
              )
            }
          />

          {editingSecondaryId === 'new' ? (
            <SecondaryForm
              primaryId={selected.id}
              hasCategories={hasCategories}
              onDone={() => setEditingSecondaryId(null)}
              onCancel={() => setEditingSecondaryId(null)}
            />
          ) : (
            <button
              type="button"
              className="btn btn-secondary self-start"
              onClick={() => setEditingSecondaryId('new')}
            >
              2차 메뉴 추가
            </button>
          )}
        </div>
      )}
    </div>
  )
}
