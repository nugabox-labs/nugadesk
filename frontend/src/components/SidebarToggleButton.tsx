import clsx from 'clsx'

import { FaIcon } from './FaIcon'

export function SidebarToggleButton({ open, className }: { open: boolean; className?: string }) {
  return <FaIcon name={open ? 'arrow-left-from-line' : 'arrow-right-from-line'} className={clsx(className)} />
}
