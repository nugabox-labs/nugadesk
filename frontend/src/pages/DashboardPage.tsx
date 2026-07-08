import { useMemo, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

import { Modal } from '../components/Modal'
import { isImageIcon, WorkspaceIcon } from '../components/WorkspaceIcon'
import {
  useCreateWorkspace,
  useDeleteWorkspace,
  useUpdateWorkspace,
} from '../hooks/useWorkspaces'
import { useUploadWorkspaceIcon } from '../hooks/useUploads'
import { useDashboardTree } from '../hooks/useDashboard'
import { useUpdateTodo } from '../hooks/useTodos'
import { ApiError } from '../lib/api'
import type { ProjectTree, TaskCategoryTree, Todo, Workspace, WorkspaceTree } from '../lib/types'

const COLOR_OPTIONS = ['#3182f6', '#00c896', '#ff9500', '#f04452', '#8b95a1', '#7c5cff']
const PRIORITY_LABEL: Record<number, string> = { 1: '낮음', 5: '보통', 9: '높음' }

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
  const [uploadError, setUploadError] = useState<string | null>(null)
  const uploadIcon = useUploadWorkspaceIcon()
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), icon, color })
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadError(null)
    try {
      const { url } = await uploadIcon.mutateAsync(file)
      setIcon(url)
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : '이미지 업로드에 실패했습니다.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-3 items-start">
        <WorkspaceIcon
          icon={icon}
          color={color}
          className="w-14 h-14 rounded-[12px] text-2xl border border-gray-200"
        />
        <div className="flex flex-col gap-1.5">
          <input
            className="input h-9 w-16 text-center text-lg"
            value={isImageIcon(icon) ? '' : icon}
            maxLength={2}
            placeholder="🗂️"
            onChange={(e) => setIcon(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadIcon.isPending}
          >
            {uploadIcon.isPending ? '업로드 중...' : '사진 업로드'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        <input
          className="input flex-1"
          placeholder="워크스페이스 이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
        />
      </div>
      {uploadError && <p className="text-sm text-danger">{uploadError}</p>}
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

function TodoRow({ todo, projectId }: { todo: Todo; projectId: string }) {
  const updateTodo = useUpdateTodo(projectId)

  return (
    <label className="flex items-center gap-2 py-1 cursor-pointer">
      <input
        type="checkbox"
        className="w-3.5 h-3.5 shrink-0"
        checked={todo.status === 'done'}
        onChange={(e) => updateTodo.mutate({ id: todo.id, status: e.target.checked ? 'done' : 'todo' })}
      />
      <span
        className={clsx(
          'text-xs truncate flex-1 min-w-0',
          todo.status === 'done' && 'line-through text-gray-400',
        )}
      >
        {todo.title}
      </span>
      {todo.due_date && (
        <span className="badge bg-gray-100 text-gray-600 shrink-0">
          {new Date(todo.due_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
        </span>
      )}
      {todo.priority > 0 && (
        <span className="badge bg-primary-light text-primary shrink-0">
          {PRIORITY_LABEL[todo.priority] ?? todo.priority}
        </span>
      )}
    </label>
  )
}

function ProjectBlock({
  workspaceId,
  project,
  hideCompleted,
}: {
  workspaceId: string
  project: ProjectTree
  hideCompleted: boolean
}) {
  const todos = hideCompleted ? project.todos.filter((t) => t.status !== 'done') : project.todos

  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <Link
        to={`/workspace/${workspaceId}/project/${project.id}`}
        className="text-xs font-bold text-gray-700 hover:text-primary hover:underline w-fit"
      >
        {project.name}
      </Link>
      {todos.length === 0 ? (
        <p className="text-xs text-gray-400 pl-0.5">할 일 없음</p>
      ) : (
        <div className="flex flex-col">
          {todos.map((todo) => (
            <TodoRow key={todo.id} todo={todo} projectId={project.id} />
          ))}
        </div>
      )}
    </div>
  )
}

function CategoryBlock({
  workspaceId,
  category,
  hideCompleted,
}: {
  workspaceId: string
  category: TaskCategoryTree
  hideCompleted: boolean
}) {
  return (
    <div className="flex flex-col gap-2 border-l-2 border-gray-100 pl-3 min-w-0">
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">{category.name}</h4>
      {category.projects.length === 0 ? (
        <p className="text-xs text-gray-400">프로젝트 없음</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-2.5 border-l-2 border-gray-50 pl-2">
          {category.projects.map((project) => (
            <ProjectBlock key={project.id} workspaceId={workspaceId} project={project} hideCompleted={hideCompleted} />
          ))}
        </div>
      )}
    </div>
  )
}

function WorkspaceSection({
  workspace,
  hideCompleted,
  onEdit,
  onDelete,
}: {
  workspace: WorkspaceTree
  hideCompleted: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(true)

  const todoCount = useMemo(
    () =>
      workspace.task_categories.reduce(
        (sum, cat) => sum + cat.projects.reduce((s, p) => s + p.todos.length, 0),
        0,
      ),
    [workspace],
  )

  return (
    <div className="card p-5 flex flex-col gap-4 group">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          className="flex items-center gap-3 min-w-0 flex-1 text-left"
          onClick={() => setExpanded((v) => !v)}
        >
          <span
            className={clsx(
              'text-gray-400 text-[10px] shrink-0 transition-transform',
              expanded && 'rotate-90',
            )}
          >
            ▶
          </span>
          <WorkspaceIcon icon={workspace.icon} color={workspace.color} className="w-9 h-9 rounded-[10px] text-lg shrink-0" />
          <span className="font-bold truncate">{workspace.name}</span>
          {todoCount > 0 && <span className="text-xs text-gray-400 shrink-0">할 일 {todoCount}개</span>}
        </button>
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link to={`/workspace/${workspace.id}`} className="btn btn-ghost btn-sm">
            전체보기
          </Link>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onEdit}>
            수정
          </button>
          <button type="button" className="btn btn-ghost btn-sm text-danger" onClick={onDelete}>
            삭제
          </button>
        </div>
      </div>

      {expanded &&
        (workspace.task_categories.length === 0 ? (
          <p className="text-sm text-gray-400 pl-1">아직 업무 분류가 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {workspace.task_categories.map((category) => (
              <CategoryBlock
                key={category.id}
                workspaceId={workspace.id}
                category={category}
                hideCompleted={hideCompleted}
              />
            ))}
          </div>
        ))}
    </div>
  )
}

export function DashboardPage() {
  const { data: workspaces, isLoading } = useDashboardTree()
  const createWorkspace = useCreateWorkspace()
  const updateWorkspace = useUpdateWorkspace()
  const deleteWorkspace = useDeleteWorkspace()

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Workspace | null>(null)
  const [hideCompleted, setHideCompleted] = useState(false)

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-sm text-gray-600 select-none">
            <input
              type="checkbox"
              className="w-4 h-4"
              checked={hideCompleted}
              onChange={(e) => setHideCompleted(e.target.checked)}
            />
            완료 항목 숨기기
          </label>
          <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + 워크스페이스 추가
          </button>
        </div>
      </div>

      {isLoading && <p className="text-gray-400">불러오는 중...</p>}

      <div className="flex flex-col gap-4">
        {workspaces?.map((ws) => (
          <WorkspaceSection
            key={ws.id}
            workspace={ws}
            hideCompleted={hideCompleted}
            onEdit={() => setEditing(ws)}
            onDelete={() => {
              if (confirm(`'${ws.name}' 워크스페이스를 삭제할까요? (30일 내 복구 가능)`)) {
                deleteWorkspace.mutate(ws.id)
              }
            }}
          />
        ))}
        {!isLoading && workspaces?.length === 0 && (
          <p className="text-gray-400 text-sm">아직 워크스페이스가 없습니다. 위 버튼으로 추가해보세요.</p>
        )}
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
