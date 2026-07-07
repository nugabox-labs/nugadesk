import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'

import { useThemeStore, type ThemeMode } from '../store/theme'

const OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'system', label: '시스템' },
  { mode: 'light', label: '라이트' },
  { mode: 'dark', label: '다크' },
]

function ThemeIcon({ mode }: { mode: ThemeMode }) {
  if (mode === 'light') {
    return (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M10 1v2M10 17v2M3.5 3.5l1.4 1.4M15.1 15.1l1.4 1.4M1 10h2M17 10h2M3.5 16.5l1.4-1.4M15.1 4.9l1.4-1.4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    )
  }
  if (mode === 'dark') {
    return (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path d="M17 11.5A7 7 0 018.5 3 7 7 0 1017 11.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <rect x="2.5" y="4" width="15" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 17h6M10 14v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function ThemeToggle() {
  const mode = useThemeStore((s) => s.mode)
  const setMode = useThemeStore((s) => s.setMode)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handlePointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="btn btn-ghost btn-sm px-2"
        onClick={() => setOpen((v) => !v)}
        aria-label="테마 설정"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <ThemeIcon mode={mode} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-36 rounded-[14px] border border-gray-200 bg-white shadow-xl py-1.5 z-50"
        >
          {OPTIONS.map((opt) => {
            const selected = opt.mode === mode
            return (
              <button
                key={opt.mode}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  setMode(opt.mode)
                  setOpen(false)
                }}
                className={clsx(
                  'w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-left rounded-[8px]',
                  selected ? 'text-primary' : 'text-gray-700 hover:bg-gray-100',
                )}
              >
                <span className="w-4 shrink-0 flex items-center justify-center">
                  {selected && (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3 8.5l3.5 3.5L13 4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                {opt.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
