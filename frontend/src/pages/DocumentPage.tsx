import type { PartialBlock } from '@blocknote/core'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { BlockEditor } from '../components/BlockEditor'
import { FaIcon } from '../components/FaIcon'
import { PageShell } from '../components/PageShell'
import { useDocument, useDeleteDocument, useUpdateDocument } from '../hooks/useDocuments'
import { ApiError } from '../lib/api'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function DocumentPage() {
  const { documentId } = useParams<{ documentId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { data: document, isLoading, error } = useDocument(documentId)
  const update = useUpdateDocument()
  const deleteDoc = useDeleteDocument()

  const [editing, setEditing] = useState(searchParams.get('edit') === '1')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState<PartialBlock[] | null>(null)
  const [editorKey, setEditorKey] = useState('initial')
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!document) return
    setTitle(document.title)
    setContent((document.content as PartialBlock[] | null) ?? null)
    setEditorKey(document.updated_at)
  }, [document])

  useEffect(() => {
    if (searchParams.get('edit') === '1') {
      setEditing(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  function startEditing() {
    setEditing(true)
    setSaveError(null)
  }

  function cancelEditing() {
    if (!document) return
    setTitle(document.title)
    setContent((document.content as PartialBlock[] | null) ?? null)
    setEditorKey(`${document.updated_at}-cancel-${Date.now()}`)
    setEditing(false)
    setSaveError(null)
  }

  async function save() {
    if (!documentId) return
    setSaveError(null)
    try {
      const saved = await update.mutateAsync({
        id: documentId,
        title: title.trim() || '제목 없음',
        content: content as Record<string, unknown>[] | null,
      })
      setTitle(saved.title)
      setContent((saved.content as PartialBlock[] | null) ?? null)
      setEditorKey(saved.updated_at)
      setEditing(false)
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : '저장에 실패했습니다.')
    }
  }

  if (isLoading) {
    return (
      <PageShell>
        <p className="text-sm text-gray-400">불러오는 중...</p>
      </PageShell>
    )
  }

  if (error || !document) {
    return (
      <PageShell>
        <div className="card p-6 text-center">
          <p className="text-sm text-gray-500">문서를 찾을 수 없습니다.</p>
          <Link to="/info" className="btn btn-secondary btn-sm mt-4 inline-flex">
            문서 목록으로
          </Link>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell compactMobile>
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <Link to="/info" className="btn btn-ghost btn-sm shrink-0">
            <FaIcon name="arrow-left" className="mr-1.5" />
            목록
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            {editing ? (
              <>
                <button type="button" className="btn btn-secondary btn-sm" onClick={cancelEditing}>
                  취소
                </button>
                <button type="button" className="btn btn-primary btn-sm" disabled={update.isPending} onClick={save}>
                  {update.isPending ? '저장 중...' : '저장'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm text-danger"
                  onClick={async () => {
                    if (!documentId || !window.confirm('이 문서를 삭제할까요?')) return
                    try {
                      await deleteDoc.mutateAsync(documentId)
                      navigate('/info')
                    } catch (err) {
                      alert(err instanceof ApiError ? err.message : '삭제에 실패했습니다.')
                    }
                  }}
                >
                  삭제
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={startEditing}>
                  편집
                </button>
              </>
            )}
          </div>
        </div>

        {editing ? (
          <input
            className="input text-2xl font-bold border-0 px-0 shadow-none focus:ring-0 bg-transparent"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목"
          />
        ) : (
          <h2 className="text-2xl font-bold text-gray-900">{document.title}</h2>
        )}

        <p className="text-xs text-gray-400 -mt-2">마지막 수정 {formatDate(document.updated_at)}</p>

        {saveError && <p className="text-sm text-danger">{saveError}</p>}

        <BlockEditor
          key={editorKey}
          editorKey={editorKey}
          content={content}
          editable={editing}
          onChange={editing ? setContent : undefined}
        />
      </div>
    </PageShell>
  )
}
