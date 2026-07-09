import clsx from 'clsx'
import type { CSSProperties } from 'react'

export function FaIcon({
  name,
  className,
  style,
  brand,
  light,
}: {
  name: string
  className?: string
  style?: CSSProperties
  brand?: boolean
  light?: boolean
}) {
  const weight = brand ? 'fa-brands' : light ? 'fa-light' : 'fa-solid'
  return <i className={clsx(weight, `fa-${name}`, className)} style={style} aria-hidden />
}
