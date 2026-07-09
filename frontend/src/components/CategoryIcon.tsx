import clsx from 'clsx'

import { FaIcon } from './FaIcon'

const FA_ICON_PREFIX = 'fa:'
const FA_BRANDS_PREFIX = 'fa-brands:'

export function isImageIcon(icon: string | null | undefined): boolean {
  return !!icon && (icon.startsWith('/api/') || icon.startsWith('http://') || icon.startsWith('https://'))
}

export function isFaIcon(icon: string | null | undefined): boolean {
  return !!icon && (icon.startsWith(FA_ICON_PREFIX) || icon.startsWith(FA_BRANDS_PREFIX))
}

/** 시드 데이터 등 `fa:` 접두사 없이 저장된 FontAwesome 이름 */
export function isPlainFaIconName(icon: string | null | undefined): boolean {
  return !!icon && /^[a-z0-9-]+$/i.test(icon)
}

export function faIconName(icon: string): string {
  return resolveFaIcon(icon).name
}

export function resolveFaIcon(icon: string): { name: string; brand: boolean } {
  if (icon.startsWith(FA_BRANDS_PREFIX)) {
    return { name: icon.slice(FA_BRANDS_PREFIX.length), brand: true }
  }
  if (icon.startsWith(FA_ICON_PREFIX)) {
    return { name: icon.slice(FA_ICON_PREFIX.length), brand: false }
  }
  return { name: icon, brand: false }
}

export function toFaIcon(name: string, brand = false): string {
  return brand ? `${FA_BRANDS_PREFIX}${name}` : `${FA_ICON_PREFIX}${name}`
}

function hasExplicitSize(className?: string): boolean {
  if (!className) return false
  return /\b(w-|h-|size-|min-w-|max-w-|min-h-|max-h-)/.test(className)
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
      <span
        className={clsx(
          'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[inherit]',
          !hasExplicitSize(className) && 'size-[1em]',
          className,
        )}
      >
        <img src={icon} alt="" className="size-full object-cover" />
      </span>
    )
  }

  if (isFaIcon(icon) || isPlainFaIconName(icon)) {
    const { name, brand } = isFaIcon(icon) ? resolveFaIcon(icon) : { name: icon, brand: false }
    return (
      <FaIcon
        name={name}
        brand={brand}
        className={clsx('shrink-0', className)}
        style={color ? { color } : undefined}
      />
    )
  }

  return <span className={clsx('shrink-0 leading-none', className)}>{icon}</span>
}
