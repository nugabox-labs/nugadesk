import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { PersonalIconField, IconPreviewSlot } from './PersonalIconField'
import { FaIcon } from './FaIcon'
import { Modal } from './Modal'
import { useCreateCategory, useUpdateCategory } from '../hooks/useCategories'
import { useIcloudLists, useIcloudStatus } from '../hooks/useIcloud'
import type { Category } from '../lib/types'

const COLOR_OPTIONS = ['#3182f6', '#00c896', '#ff9500', '#f04452', '#8b95a1', '#7c5cff']

export function CategoryFormModal({
  parentId,
  initial,
  hasChildren,
  onClose,
}: {
  /** null when creating a top-level 분류. Ignored when `initial` is set (no reparenting). */
  parentId: string | null
  initial?: Category
  /** Existing children already block iCloud mapping server-side — reflect that in the UI too. */
  hasChildren?: boolean
  onClose: () => void
}) {
  const isTopLevel = initial ? initial.parent_id === null : parentId === null
  const isEdit = !!initial
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()

  const [name, setName] = useState(initial?.name ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? '🗂️')
  const [color, setColor] = useState<string | null>(initial?.color ?? COLOR_OPTIONS[0])
  const [icloudListUid, setIcloudListUid] = useState(initial?.icloud_list_uid ?? '')
  const [icloudListName, setIcloudListName] = useState(initial?.icloud_list_name ?? '')

  const { data: icloudStatus } = useIcloudStatus()
  const { data: icloudLists, isLoading: icloudListsLoading } = useIcloudLists(!!icloudStatus?.connected)

  useEffect(() => {
    if (icloudListUid || !icloudListName || !icloudLists?.length) return
    const match = icloudLists.find((list) => list.name === icloudListName)
    if (match) setIcloudListUid(match.uid)
  }, [icloudListName, icloudListUid, icloudLists])

  const iCloudDisabled = !!hasChildren && !initial?.icloud_list_name && !initial?.icloud_list_uid
  const submitting = createCategory.isPending || updateCategory.isPending

  function handleIcloudListChange(uid: string) {
    if (!uid) {
      setIcloudListUid('')
      setIcloudListName('')
      return
    }
    const list = icloudLists?.find((item) => item.uid === uid)
    setIcloudListUid(uid)
    setIcloudListName(list?.name ?? '')
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    if (isEdit) {
      updateCategory.mutate(
        {
          id: initial.id,
          name: name.trim(),
          ...(isTopLevel ? { icon, color: color ?? undefined } : {}),
          icloud_list_uid: icloudListUid || null,
          icloud_list_name: icloudListName.trim() || null,
        },
        { onSuccess: onClose },
      )
    } else {
      createCategory.mutate(
        {
          name: name.trim(),
          parent_id: parentId,
          ...(isTopLevel ? { icon, color: color ?? undefined } : {}),
          icloud_list_uid: icloudListUid || undefined,
          icloud_list_name: icloudListName.trim() || undefined,
        },
        { onSuccess: onClose },
      )
    }
  }

  return (
    <Modal title={isEdit ? '분류 수정' : '분류 추가'} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        {isTopLevel ? (
          <>
            <div className="flex items-center gap-3">
              <IconPreviewSlot value={icon} />
              <input
                className="input h-11 min-w-0 flex-1"
                placeholder="분류 이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
            </div>
            <PersonalIconField value={icon} onChange={(next) => setIcon(next || '🗂️')} />
          </>
        ) : (
          <input
            className="input"
            placeholder="분류 이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
          />
        )}

        {isTopLevel && (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-gray-700">배경색</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setColor(null)}
                className="h-7 w-7 rounded-full border-2 border-dashed border-gray-300 bg-transparent"
                style={{ borderColor: color === null ? '#191f28' : undefined }}
                aria-label="투명"
                title="투명"
              />
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-7 w-7 rounded-full border-2"
                  style={{ backgroundColor: c, borderColor: color === c ? '#191f28' : 'transparent' }}
                  aria-label={c}
                />
              ))}
              <label
                className="relative flex h-7 w-7 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-gray-200"
                style={{
                  backgroundColor: color && !COLOR_OPTIONS.includes(color) ? color : undefined,
                  borderColor: color && !COLOR_OPTIONS.includes(color) ? '#191f28' : undefined,
                }}
                title="색상 직접 선택"
              >
                {!(color && !COLOR_OPTIONS.includes(color)) && (
                  <FaIcon name="palette" className="text-xs text-gray-500" />
                )}
                <input
                  type="color"
                  value={color ?? '#3182f6'}
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label="색상 직접 선택"
                />
              </label>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">iCloud 미리알림 리스트 (선택)</label>
          {icloudStatus?.connected ? (
            <select
              className="input"
              value={icloudListUid}
              onChange={(e) => handleIcloudListChange(e.target.value)}
              disabled={iCloudDisabled || icloudListsLoading}
            >
              <option value="">연결 안 함</option>
              {icloudLists?.map((list) => (
                <option key={list.uid} value={list.uid}>
                  {list.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="input"
              placeholder="설정 → 연동에서 iCloud를 먼저 연결해 주세요"
              value={icloudListName}
              disabled
            />
          )}
          <p className="text-sm text-gray-500">
            {iCloudDisabled
              ? '하위 분류가 있는 분류는 iCloud 리스트와 연결할 수 없습니다.'
              : icloudStatus?.connected
                ? '동기화 시 이 리스트와 분류의 할일이 맞춰집니다. 하위에 분류를 생성할 수 없습니다.'
                : 'iCloud 연결 후 실제 미리알림 리스트 목록에서 선택할 수 있습니다.'}
          </p>
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            취소
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            저장
          </button>
        </div>
      </form>
    </Modal>
  )
}
