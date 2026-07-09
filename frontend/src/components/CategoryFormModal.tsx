import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

import { CategoryIcon, isFaIcon, isImageIcon, toFaIcon } from './CategoryIcon'
import { FaIconPicker } from './FaIconPicker'
import { Modal } from './Modal'
import { useCreateCategory, useUpdateCategory } from '../hooks/useCategories'
import { useUploadCategoryIcon } from '../hooks/useUploads'
import { ApiError } from '../lib/api'
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
  const [color, setColor] = useState(initial?.color ?? COLOR_OPTIONS[0])
  const [icloudListName, setIcloudListName] = useState(initial?.icloud_list_name ?? '')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const uploadIcon = useUploadCategoryIcon()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const iCloudDisabled = !!hasChildren && !initial?.icloud_list_name && !initial?.icloud_list_uid
  const submitting = createCategory.isPending || updateCategory.isPending

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadError(null)
    try {
      const { url } = await uploadIcon.mutateAsync(file)
      setIcon(url)
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : '이미지 업로드에 실패했습니다.')
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    if (isEdit) {
      updateCategory.mutate(
        {
          id: initial.id,
          name: name.trim(),
          ...(isTopLevel ? { icon, color } : {}),
          icloud_list_name: icloudListName.trim() || null,
        },
        { onSuccess: onClose },
      )
    } else {
      createCategory.mutate(
        {
          name: name.trim(),
          parent_id: parentId,
          ...(isTopLevel ? { icon, color } : {}),
          icloud_list_name: icloudListName.trim() || undefined,
        },
        { onSuccess: onClose },
      )
    }
  }

  return (
    <Modal title={isEdit ? '분류 수정' : '분류 추가'} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        {isTopLevel && (
          <div className="flex gap-3 items-start">
            <CategoryIcon
              icon={icon}
              color={color}
              className="w-14 h-14 rounded-[12px] text-2xl border border-gray-200"
            />
            <div className="flex flex-col gap-1.5">
              <input
                className="input h-9 w-16 text-center text-lg"
                value={isImageIcon(icon) || isFaIcon(icon) ? '' : icon}
                maxLength={2}
                placeholder="🗂️"
                onChange={(e) => setIcon(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadIcon.isPending}
              >
                {uploadIcon.isPending ? '업로드 중...' : '사진 업로드'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <input
              className="input flex-1"
              placeholder="분류 이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>
        )}

        {isTopLevel && <FaIconPicker onSelect={(iconName) => setIcon(toFaIcon(iconName))} />}

        {!isTopLevel && (
          <input
            className="input"
            placeholder="분류 이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
          />
        )}

        {uploadError && <p className="text-sm text-danger">{uploadError}</p>}

        {isTopLevel && (
          <div className="flex gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full border-2"
                style={{ backgroundColor: c, borderColor: color === c ? '#191f28' : 'transparent' }}
                aria-label={c}
              />
            ))}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">iCloud 미리알림 리스트 (선택)</label>
          <input
            className="input"
            placeholder="연결할 iCloud 리스트 이름"
            value={icloudListName}
            onChange={(e) => setIcloudListName(e.target.value)}
            disabled={iCloudDisabled}
          />
          <p className="text-sm text-gray-500">
            {iCloudDisabled
              ? '하위 분류가 있는 분류는 iCloud 리스트와 연결할 수 없습니다.'
              : '이 분류가 해당 iCloud 미리알림 리스트와 동기화됩니다. 하위에 분류를 생성할 수 없습니다.'}
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
