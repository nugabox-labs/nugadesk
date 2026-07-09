import clsx from 'clsx'
import type { CSSProperties } from 'react'

export function FaIcon({
  name,
  className,
  style,
  brand,
}: {
  name: string
  className?: string
  style?: CSSProperties
  brand?: boolean
}) {
  return <i className={clsx(brand ? 'fa-brands' : 'fa-solid', `fa-${name}`, className)} style={style} aria-hidden />
}
