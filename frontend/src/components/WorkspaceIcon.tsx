import clsx from 'clsx'

export function isImageIcon(icon: string | null | undefined): boolean {
  return !!icon && (icon.startsWith('/api/') || icon.startsWith('http://') || icon.startsWith('https://'))
}

export function WorkspaceIcon({
  icon,
  color,
  className,
}: {
  icon: string | null | undefined
  color?: string | null
  className?: string
}) {
  const isImage = isImageIcon(icon)

  return (
    <div
      className={clsx('flex items-center justify-center overflow-hidden shrink-0', className)}
      style={!isImage ? { backgroundColor: `${color ?? '#3182f6'}22` } : undefined}
    >
      {isImage ? (
        <img src={icon ?? undefined} alt="" className="w-full h-full object-cover" />
      ) : (
        <span>{icon}</span>
      )}
    </div>
  )
}
