import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export interface InfoPageColumnItem {
  icon: string
  label: string
  href?: string
}

export interface InfoPageColumn {
  title: string
  items: InfoPageColumnItem[]
}

function ColumnItemRow({ icon, label, href }: InfoPageColumnItem) {
  const content = (
    <>
      <span className="text-base shrink-0 leading-none">{icon}</span>
      <span className="text-base truncate">{label}</span>
    </>
  )
  const rowClassName = 'flex items-center gap-2 px-2 py-1.5 rounded-[8px] hover:bg-gray-100 text-gray-800'

  if (href) {
    return (
      <Link to={href} className={rowClassName}>
        {content}
      </Link>
    )
  }
  return <div className={rowClassName}>{content}</div>
}

export function InfoPageLayout({
  highlight,
  columns,
  children,
}: {
  highlight?: string
  columns: InfoPageColumn[]
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-8">
      {highlight && <p className="text-sm font-semibold text-gray-600">{highlight}</p>}

      {columns.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
          {columns.map((column) => (
            <div key={column.title} className="flex flex-col gap-1">
              <h3 className="text-base font-bold text-gray-700 pb-2 border-b border-gray-200">
                {column.title}
              </h3>
              <div className="flex flex-col">
                {column.items.map((item) => (
                  <ColumnItemRow key={item.label} {...item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {children}
    </div>
  )
}
