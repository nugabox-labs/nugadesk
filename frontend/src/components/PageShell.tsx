import type { ReactNode } from 'react'

export const PAGE_CONTAINER_CLASS = 'max-w-5xl mx-auto w-full'

export function PageShell({
  children,
  compactMobile,
}: {
  children: ReactNode
  /** 모바일에서 상단 sticky 제목과 본문 제목이 겹치지 않도록 여백 조정 */
  compactMobile?: boolean
}) {
  return (
    <div className={PAGE_CONTAINER_CLASS}>
      <div className={compactMobile ? '' : 'mt-1 lg:mt-2'}>{children}</div>
    </div>
  )
}
