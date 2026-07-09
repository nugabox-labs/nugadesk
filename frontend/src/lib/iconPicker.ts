import clsx from 'clsx'

import { isFaIcon, isImageIcon, isPlainFaIconName } from '../components/CategoryIcon'

/** 제목 미리보기 · 이모지 입력 · FontAwesome 결과 공통 슬롯 */
export const ICON_SLOT_CLASS = 'size-11 shrink-0 rounded-[10px]'

export function iconSlotBoxClass(selected = false) {
  return clsx(
    ICON_SLOT_CLASS,
    'flex items-center justify-center overflow-hidden border transition-colors',
    selected
      ? 'border-primary bg-primary-light text-primary'
      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
  )
}

export function iconSlotContentClass(icon: string): string {
  if (isImageIcon(icon)) return 'size-full object-cover'
  if (isFaIcon(icon) || isPlainFaIconName(icon)) return 'text-base leading-none'
  return 'text-xl leading-none select-none'
}

/** FontAwesome 결과 버튼 안 아이콘 */
export const ICON_SLOT_FA_CLASS = 'text-base leading-none'
