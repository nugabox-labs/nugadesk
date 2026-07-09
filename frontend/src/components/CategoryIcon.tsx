import clsx from 'clsx'

import { FaIcon } from './FaIcon'

const FA_ICON_PREFIX = 'fa:'

export function isImageIcon(icon: string | null | undefined): boolean {
  return !!icon && (icon.startsWith('/api/') || icon.startsWith('http://') || icon.startsWith('https://'))
}

export function isFaIcon(icon: string | null | undefined): boolean {
  return !!icon && icon.startsWith(FA_ICON_PREFIX)
}

/** 시드 데이터 등 `fa:` 접두사 없이 저장된 FontAwesome 이름 */
export function isPlainFaIconName(icon: string | null | undefined): boolean {
  return !!icon && /^[a-z0-9-]+$/i.test(icon)
}

export function faIconName(icon: string): string {
  return isFaIcon(icon) ? icon.slice(FA_ICON_PREFIX.length) : icon
}

export function toFaIcon(name: string): string {
  return `${FA_ICON_PREFIX}${name}`
}

export function CategoryIcon({
  icon,
  color,
  className,
}: {
  icon: string | null | undefined
  color?: string | null
  className?: string
}) {
  if (!icon) return null

  if (isImageIcon(icon)) {
    return (
      <div className={clsx('flex items-center justify-center overflow-hidden shrink-0', className)}>
        <img src={icon} alt="" className="w-full h-full object-cover" />
      </div>
    )
  }

  if (isFaIcon(icon) || isPlainFaIconName(icon)) {
    return (
      <FaIcon
        name={faIconName(icon)}
        className={clsx('shrink-0', className)}
        style={color ? { color } : undefined}
      />
    )
  }

  return <span className={clsx('shrink-0 leading-none', className)}>{icon}</span>
}
