import { useState } from 'react'

import { FaIcon } from '../components/FaIcon'
import { PageShell } from '../components/PageShell'
import { useCreateLink, useDeleteLink, useLinks, useUpdateLink } from '../hooks/useLinks'
import { ApiError } from '../lib/api'
import type { BookmarkLink } from '../hooks/useLinks'

function LinkForm({
  initial,
  onDone,
  onCancel,
}: {
  initial?: BookmarkLink
  onDone: () => void
  onCancel: () => void
}) {
  const create = useCreateLink()
  const update = useUpdateLink()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [url, setUrl] = useState(initial?.url ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [error, setError] = useState<string | null>(null)
  const pending = create.isPending || update.isPending

  async function submit() {
    setError(null)
    try {
      const payload = { title, url, note: note.trim() || undefined }
      if (initial) await update.mutateAsync({ id: initial.id, ...payload, note: note.trim() || null })
      else await create.mutateAsync(payload)
      onDone()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '저장에 실패했습니다.')
    }
  }

  return (
    <div className="card p-4 flex flex-col gap-3">
      <input className="input" placeholder="제목" value={title} onChange={(e) => setTitle(e.target.value)} />
      <input className="input" placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)} />
      <input className="input" placeholder="메모 (선택)" value={note} onChange={(e) => setNote(e.target.value)} />
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <button type="button" className="btn btn-primary btn-sm" disabled={pending} onClick={submit}>
          {pending ? '저장 중...' : '저장'}
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>
          취소
        </button>
      </div>
    </div>
  )
}

export function LinksPage() {
  const { data: links, isLoading } = useLinks()
  const deleteLink = useDeleteLink()
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)

  return (
    <PageShell>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-gray-500">자주 쓰는 링크를 추가하고 관리합니다.</p>
          {editingId !== 'new' && (
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setEditingId('new')}>
              링크 추가
            </button>
          )}
        </div>

        {editingId === 'new' && (
          <LinkForm onDone={() => setEditingId(null)} onCancel={() => setEditingId(null)} />
        )}

        {isLoading && <p className="text-sm text-gray-400">불러오는 중...</p>}

        <div className="flex flex-col gap-2">
          {links?.map((link) =>
            editingId === link.id ? (
              <LinkForm
                key={link.id}
                initial={link}
                onDone={() => setEditingId(null)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div key={link.id} className="card p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-primary hover:underline truncate block"
                  >
                    {link.title}
                  </a>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{link.url}</p>
                  {link.note && <p className="text-sm text-gray-500 mt-1">{link.note}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm px-2"
                    onClick={() => setEditingId(link.id)}
                  >
                    <FaIcon name="pen" />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm px-2 text-danger"
                    disabled={deleteLink.isPending}
                    onClick={() => {
                      if (confirm(`"${link.title}" 링크를 삭제할까요?`)) deleteLink.mutate(link.id)
                    }}
                  >
                    <FaIcon name="trash" />
                  </button>
                </div>
              </div>
            ),
          )}
        </div>

        {!isLoading && links?.length === 0 && editingId !== 'new' && (
          <p className="text-sm text-gray-400">등록된 링크가 없습니다.</p>
        )}
      </div>
    </PageShell>
  )
}
