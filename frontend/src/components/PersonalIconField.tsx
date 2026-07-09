import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import clsx from 'clsx'

import {
  CategoryIcon,
  isFaIcon,
  isImageIcon,
  isPlainFaIconName,
  resolveFaIcon,
  toFaIcon,
} from './CategoryIcon'
import { FaIcon } from './FaIcon'
import { FaIconPicker } from './FaIconPicker'
import { useUploadCategoryIcon } from '../hooks/useUploads'
import { ApiError } from '../lib/api'
import { ICON_SLOT_CLASS, iconSlotContentClass } from '../lib/iconPicker'

const FA_ICON_SEARCH_URL = 'https://fontawesome.com/search?o=r&s=solid'

type IconTab = 'emoji' | 'image' | 'fa'

const TABS: { id: IconTab; label: string }[] = [
  { id: 'fa', label: 'FontAwesome' },
  { id: 'emoji', label: '이모지' },
  { id: 'image', label: '이미지' },
]

function iconTab(value: string | null | undefined): IconTab {
  if (!value) return 'fa'
  if (isImageIcon(value)) return 'image'
  if (isFaIcon(value) || isPlainFaIconName(value)) return 'fa'
  return 'emoji'
}

export function IconPreviewSlot({
  value,
  className = ICON_SLOT_CLASS,
  onClear,
}: {
  value: string | null
  className?: string
  onClear?: () => void
}) {
  return (
    <div className="relative shrink-0 self-center">
      <div
        className={clsx(
          className,
          'flex items-center justify-center overflow-hidden',
          value ? 'border border-gray-200' : 'border border-transparent',
        )}
      >
        {value ? <CategoryIcon icon={value} className={iconSlotContentClass(value)} /> : null}
      </div>
      {value && onClear && (
        <button
          type="button"
          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-gray-200 bg-white text-[10px] leading-none text-gray-500 hover:text-gray-800"
          onClick={onClear}
          aria-label="아이콘 제거"
        >
          ×
        </button>
      )}
    </div>
  )
}

export function PersonalIconField({
  value,
  onChange,
  optional = false,
}: {
  value: string | null
  onChange: (icon: string | null) => void
  /** true면 아이콘 없음을 기본값으로 허용 */
  optional?: boolean
}) {
  const uploadIcon = useUploadCategoryIcon()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [tab, setTab] = useState<IconTab>(() => iconTab(value))

  useEffect(() => {
    setTab(iconTab(value))
  }, [value])

  const emojiValue = value && iconTab(value) === 'emoji' ? value : ''
  const faPickerValue =
    value && iconTab(value) === 'fa'
      ? isFaIcon(value)
        ? resolveFaIcon(value).name
        : value
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
    <div className="flex flex-col gap-1.5 text-sm">
      <div className="overflow-hidden rounded-[10px] border border-gray-200">
        <div className="flex gap-0.5 bg-gray-50 p-1">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={clsx(
                'h-7 min-w-0 flex-1 rounded-[7px] px-1 text-[11px] font-semibold transition-colors',
                tab === item.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
              )}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="p-2">
          {tab === 'emoji' && (
            <div className="flex justify-center">
              <input
                className={clsx(
                  ICON_SLOT_CLASS,
                  'input border-gray-200 bg-white p-0 text-center text-xl',
                )}
                value={emojiValue}
                maxLength={2}
                placeholder="😀"
                onChange={(e) => onChange(e.target.value.trim() || (optional ? null : ''))}
              />
            </div>
          )}

          {tab === 'image' && (
            <div className="flex justify-center">
              <button
                type="button"
                title={uploadIcon.isPending ? '업로드 중...' : '파일 선택'}
                className={clsx(
                  ICON_SLOT_CLASS,
                  'flex items-center justify-center gap-1 border border-gray-200 bg-white text-[11px] font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50',
                )}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadIcon.isPending}
              >
                <FaIcon name="image" className="text-sm text-gray-500" />
                <span className="sr-only">{uploadIcon.isPending ? '업로드 중' : '파일 선택'}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {tab === 'fa' && (
            <FaIconPicker
              compact
              value={faPickerValue}
              onSelect={(name, brand) => onChange(toFaIcon(name, brand))}
              searchLink={FA_ICON_SEARCH_URL}
            />
          )}
        </div>
      </div>

      {uploadError && <p className="text-xs text-danger">{uploadError}</p>}
    </div>
  )
}
