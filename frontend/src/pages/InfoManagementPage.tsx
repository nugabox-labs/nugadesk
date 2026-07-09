import { Link, useNavigate } from 'react-router-dom'

import { FaIcon } from '../components/FaIcon'
import { PageShell } from '../components/PageShell'
import { useCreateDocument, useDeleteDocument, useDocuments } from '../hooks/useDocuments'
import { ApiError } from '../lib/api'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function InfoManagementPage() {
  const navigate = useNavigate()
  const { data: documents, isLoading } = useDocuments()
  const create = useCreateDocument()
  const deleteDoc = useDeleteDocument()

  async function handleCreate() {
    try {
      const doc = await create.mutateAsync({ title: '제목 없음', content: null })
      navigate(`/info/documents/${doc.id}?edit=1`)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : '문서 생성에 실패했습니다.')
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`"${title}" 문서를 삭제할까요?`)) return
    try {
      await deleteDoc.mutateAsync(id)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : '삭제에 실패했습니다.')
    }
  }

  return (
    <PageShell>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-gray-500">노션에서 옮겨 온 문서와 개인 기록을 관리합니다.</p>
          <button type="button" className="btn btn-primary btn-sm shrink-0" disabled={create.isPending} onClick={handleCreate}>
            {create.isPending ? '생성 중...' : '새 문서'}
          </button>
        </div>

        {isLoading && <p className="text-sm text-gray-400">불러오는 중...</p>}

        {!isLoading && documents?.length === 0 && (
          <div className="card p-8 text-center">
            <p className="text-sm text-gray-500">아직 문서가 없습니다.</p>
            <button type="button" className="btn btn-primary btn-sm mt-4" onClick={handleCreate}>
              첫 문서 만들기
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {documents?.map((doc) => (
            <div key={doc.id} className="card p-4 flex items-center gap-3 group">
              <Link to={`/info/documents/${doc.id}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  {doc.icon ? (
                    <span className="text-lg shrink-0">{doc.icon}</span>
                  ) : (
                    <FaIcon name="file-lines" className="text-gray-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate group-hover:text-primary transition-colors">
                      {doc.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">수정 {formatDate(doc.updated_at)}</p>
                  </div>
                </div>
              </Link>
              <button
                type="button"
                className="btn btn-ghost btn-sm text-gray-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                aria-label="삭제"
                onClick={() => handleDelete(doc.id, doc.title)}
              >
                <FaIcon name="trash" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  )
}
