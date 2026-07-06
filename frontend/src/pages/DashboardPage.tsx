import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { Modal } from '../components/Modal'
import {
  useCreateWorkspace,
  useDeleteWorkspace,
  useUpdateWorkspace,
  useWorkspaces,
} from '../hooks/useWorkspaces'
import type { Workspace } from '../lib/types'

const COLOR_OPTIONS = ['#3182f6', '#00c896', '#ff9500', '#f04452', '#8b95a1', '#7c5cff']

function WorkspaceForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: Workspace
  onSubmit: (values: { name: string; icon: string; color: string }) => void
  onCancel: () => void
  submitting: boolean
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? '🗂️')
  const [color, setColor] = useState(initial?.color ?? COLOR_OPTIONS[0])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), icon, color })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          className="input w-16 text-center text-xl"
          value={icon}
          maxLength={2}
          onChange={(e) => setIcon(e.target.value)}
        />
        <input
          className="input flex-1"
          placeholder="워크스페이스 이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
        />
      </div>
      <div className="flex gap-2">
        {COLOR_OPTIONS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            className="w-7 h-7 rounded-full border-2"
            style={{ backgroundColor: c, borderColor: color === c ? '#191f28' : 'transparent' }}
            aria-label={c}
          />
        ))}
      </div>
      <div className="flex justify-end gap-2 mt-2">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          취소
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          저장
        </button>
      </div>
    </form>
  )
}

export function DashboardPage() {
  const { data: workspaces, isLoading } = useWorkspaces()
  const createWorkspace = useCreateWorkspace()
  const updateWorkspace = useUpdateWorkspace()
  const deleteWorkspace = useDeleteWorkspace()

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Workspace | null>(null)

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + 워크스페이스 추가
        </button>
      </div>

      {isLoading && <p className="text-gray-400">불러오는 중...</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {workspaces?.map((ws) => (
          <div key={ws.id} className="card p-5 flex flex-col gap-3 group relative">
            <Link to={`/workspace/${ws.id}`} className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-[10px] flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: `${ws.color ?? '#3182f6'}22` }}
              >
                {ws.icon}
              </div>
              <div className="font-bold truncate">{ws.name}</div>
            </Link>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(ws)}>
                수정
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm text-danger"
                onClick={() => {
                  if (confirm(`'${ws.name}' 워크스페이스를 삭제할까요? (30일 내 복구 가능)`)) {
                    deleteWorkspace.mutate(ws.id)
                  }
                }}
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <Modal title="워크스페이스 추가" onClose={() => setShowCreate(false)}>
          <WorkspaceForm
            submitting={createWorkspace.isPending}
            onCancel={() => setShowCreate(false)}
            onSubmit={(values) => createWorkspace.mutate(values, { onSuccess: () => setShowCreate(false) })}
          />
        </Modal>
      )}

      {editing && (
        <Modal title="워크스페이스 수정" onClose={() => setEditing(null)}>
          <WorkspaceForm
            initial={editing}
            submitting={updateWorkspace.isPending}
            onCancel={() => setEditing(null)}
            onSubmit={(values) =>
              updateWorkspace.mutate({ id: editing.id, ...values }, { onSuccess: () => setEditing(null) })
            }
          />
        </Modal>
      )}
    </div>
  )
}
