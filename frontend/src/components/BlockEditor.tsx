import type { PartialBlock } from '@blocknote/core'
import { ko } from '@blocknote/core/locales'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/mantine/style.css'
import { useCreateBlockNote } from '@blocknote/react'
import { useMemo } from 'react'

import { useThemeStore, type ThemeMode } from '../store/theme'

function resolveIsDark(mode: ThemeMode): boolean {
  return mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
}

export function BlockEditor({
  content,
  editable,
  editorKey,
  onChange,
}: {
  content: PartialBlock[] | null | undefined
  editable: boolean
  editorKey: string
  onChange?: (blocks: PartialBlock[]) => void
}) {
  const mode = useThemeStore((state) => state.mode)
  const theme = useMemo(() => (resolveIsDark(mode) ? 'dark' : 'light'), [mode])

  const editor = useCreateBlockNote(
    {
      dictionary: ko,
      initialContent: content ?? undefined,
    },
    [editorKey],
  )

  return (
    <div className="block-editor">
      <BlockNoteView
        editor={editor}
        editable={editable}
        theme={theme}
        onChange={() => {
          onChange?.(editor.document)
        }}
      />
    </div>
  )
}
