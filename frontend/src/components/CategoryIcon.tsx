import clsx from 'clsx'

import { FaIcon } from './FaIcon'

const FA_ICON_PREFIX = 'fa:'

export function isImageIcon(icon: string | null | undefined): boolean {
  return !!icon && (icon.startsWith('/api/') || icon.startsWith('http://') || icon.startsWith('https://'))
}

export function isFaIcon(icon: string | null | undefined): boolean {
  return !!icon && icon.startsWith(FA_ICON_PREFIX)
}

export function faIconName(icon: string): string {
  return icon.slice(FA_ICON_PREFIX.length)
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
  const isImage = isImageIcon(icon)
  const isFa = isFaIcon(icon)

  return (
    <div
      className={clsx('flex items-center justify-center overflow-hidden shrink-0', className)}
      style={!isImage ? { backgroundColor: `${color ?? '#3182f6'}22` } : undefined}
    >
      {isImage ? (
        <img src={icon ?? undefined} alt="" className="w-full h-full object-cover" />
      ) : isFa ? (
        <FaIcon name={faIconName(icon as string)} style={{ color: color ?? '#3182f6' }} />
      ) : (
        <span>{icon}</span>
      )}
    </div>
  )
}
