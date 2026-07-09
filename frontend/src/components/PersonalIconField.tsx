import { useRef, useState, type ChangeEvent } from 'react'

import {
  CategoryIcon,
  faIconName,
  isFaIcon,
  isImageIcon,
  isPlainFaIconName,
  toFaIcon,
} from './CategoryIcon'
import { FaIconPicker } from './FaIconPicker'
import { useUploadCategoryIcon } from '../hooks/useUploads'
import { ApiError } from '../lib/api'

export function PersonalIconField({
  value,
  onChange,
  label = '아이콘',
  optional = false,
  previewClassName = 'w-10 h-10 rounded-[10px] text-base border border-gray-200',
}: {
  value: string | null
  onChange: (icon: string | null) => void
  label?: string
  /** true면 아이콘 없음을 기본값으로 허용 */
  optional?: boolean
  previewClassName?: string
}) {
  const uploadIcon = useUploadCategoryIcon()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const emojiValue =
    value && !isImageIcon(value) && !isFaIcon(value) && !isPlainFaIconName(value) ? value : ''

  const faPickerValue = value
    ? isFaIcon(value)
      ? faIconName(value)
      : isPlainFaIconName(value)
        ? value
        : undefined
    : undefined

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadError(null)
    try {
      const { url } = await uploadIcon.mutateAsync(file)
      onChange(url)
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : '이미지 업로드에 실패했습니다.')
    }
  }

  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-gray-700">{label}</span>
        {optional && value && (
          <button
            type="button"
            className="text-xs font-semibold text-gray-500 hover:text-gray-800"
            onClick={() => onChange(null)}
          >
            아이콘 없음
          </button>
        )}
      </div>

      <div className="flex items-start gap-3">
        {value ? (
          <CategoryIcon icon={value} className={previewClassName} />
        ) : (
          <div
            className={`${previewClassName} bg-gray-50 text-xs text-gray-400 flex items-center justify-center shrink-0`}
          >
            없음
          </div>
        )}
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          <input
            className="input h-9 w-16 text-center text-lg"
            value={emojiValue}
            maxLength={2}
            placeholder="😀"
            onChange={(e) => onChange(e.target.value.trim() || null)}
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm self-start"
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
      </div>

      <FaIconPicker
        value={faPickerValue}
        onSelect={(name) => onChange(toFaIcon(name))}
      />

      {uploadError && <p className="text-xs text-danger">{uploadError}</p>}
    </div>
  )
}
