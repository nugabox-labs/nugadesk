import { useMemo, useState } from 'react'

import { resolveFaIcon } from './CategoryIcon'
import { FaIcon } from './FaIcon'
import { FA_ICON_NAMES } from '../lib/fontawesomeIcons'
import { ICON_SLOT_FA_CLASS, iconSlotBoxClass } from '../lib/iconPicker'

const FA_SEARCH_RESULT_LIMIT = 48

export function FaIconPicker({
  onSelect,
  value,
  searchLink,
  compact = false,
}: {
  onSelect: (name: string, brand?: boolean) => void
  value?: string
  /** FontAwesome 공식 검색 페이지 링크 */
  searchLink?: string
  compact?: boolean
}) {
  const [query, setQuery] = useState('')

  const selected = value ? resolveFaIcon(value.startsWith('fa') ? value : `fa:${value}`) : null

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return FA_ICON_NAMES.filter((name) => name.includes(q)).slice(0, FA_SEARCH_RESULT_LIMIT)
  }, [query])

  return (
    <div className={compact ? 'flex flex-col gap-1.5' : 'flex flex-col gap-2'}>
      {!compact && value && selected && (
        <div className="flex items-center gap-2 rounded-[8px] bg-gray-100 px-2.5 py-1.5 text-sm text-gray-700">
          <span className={iconSlotBoxClass()}>
            <FaIcon name={selected.name} brand={selected.brand} className={ICON_SLOT_FA_CLASS} />
          </span>
          <span className="truncate font-medium">{selected.name}</span>
        </div>
      )}

      <div className="flex gap-1.5">
        <input
          className={compact ? 'input h-9 min-w-0 flex-1 text-sm' : 'input h-9 min-w-0 flex-1'}
          placeholder={compact ? '이름 검색 (house)' : '아이콘 이름 검색 (예: house, briefcase)'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {searchLink && (
          <a
            href={searchLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary h-9 w-9 shrink-0 px-0"
            title="FontAwesome에서 아이콘 검색"
            aria-label="FontAwesome에서 아이콘 검색"
          >
            <FaIcon name="magnifying-glass" className="text-sm" />
          </a>
        )}
      </div>

      {results.length > 0 && (
        <div className="flex max-h-[9.75rem] flex-wrap gap-1.5 overflow-y-auto rounded-[8px] border border-gray-200 bg-gray-50 p-1.5">
          {results.map((name) => (
            <button
              key={name}
              type="button"
              title={name}
              className={iconSlotBoxClass(name === value)}
              onClick={() => {
                onSelect(name)
                setQuery('')
              }}
            >
              <FaIcon name={name} className={ICON_SLOT_FA_CLASS} />
            </button>
          ))}
        </div>
      )}

      {query.trim() && results.length === 0 && (
        <p className="text-[11px] text-gray-500">검색 결과 없음</p>
      )}
    </div>
  )
}
