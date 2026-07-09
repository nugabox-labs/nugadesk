import { useMemo, useState } from 'react'

import { FaIcon } from './FaIcon'
import { FA_ICON_NAMES } from '../lib/fontawesomeIcons'

const FA_SEARCH_RESULT_LIMIT = 24

export function FaIconPicker({ onSelect, value }: { onSelect: (name: string) => void; value?: string }) {
  const [query, setQuery] = useState('')
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return FA_ICON_NAMES.filter((name) => name.includes(q)).slice(0, FA_SEARCH_RESULT_LIMIT)
  }, [query])

  return (
    <div className="flex flex-col gap-1.5">
      {value && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="w-8 h-8 rounded-[8px] bg-gray-100 flex items-center justify-center">
            <FaIcon name={value} />
          </span>
          <span>{value}</span>
        </div>
      )}
      <input
        className="input h-9"
        placeholder="FontAwesome 아이콘 검색 (예: house, briefcase)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {results.length > 0 && (
        <div className="grid grid-cols-6 gap-1.5 p-2 rounded-[10px] border border-gray-200 max-h-40 overflow-y-auto">
          {results.map((name) => (
            <button
              key={name}
              type="button"
              title={name}
              className="btn btn-ghost btn-sm aspect-square px-0"
              onClick={() => {
                onSelect(name)
                setQuery('')
              }}
            >
              <FaIcon name={name} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
