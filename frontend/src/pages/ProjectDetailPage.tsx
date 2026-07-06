import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import clsx from 'clsx'
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'

import { Modal } from '../components/Modal'
import { useProject } from '../hooks/useProjects'
import { useCreateTodo, useDeleteTodo, useTodos, useUpdateTodo } from '../hooks/useTodos'
import { useWorkspace } from '../hooks/useWorkspaces'
import type { Todo, TodoStatus } from '../lib/types'

const COLUMNS: { status: TodoStatus; label: string }[] = [
  { status: 'todo', label: 'To Do' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'done', label: 'Done' },
]

const PRIORITY_LABEL: Record<number, string> = { 0: '없음', 1: '낮음', 5: '보통', 9: '높음' }

function TodoCard({ todo, projectId }: { todo: Todo; projectId: string }) {
  const updateTodo = useUpdateTodo(projectId)
  const deleteTodo = useDeleteTodo(projectId)
  const [editing, setEditing] = useState(false)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: todo.id })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={clsx(
          'card p-3 flex flex-col gap-1.5 cursor-grab active:cursor-grabbing',
          isDragging && 'opacity-50 shadow-lg',
        )}
        onDoubleClick={() => setEditing(true)}
      >
        <div className="flex items-start justify-between gap-2">
          <label className="flex items-start gap-2 min-w-0">
            <input
              type="checkbox"
              className="w-4 h-4 mt-0.5 shrink-0"
              checked={todo.status === 'done'}
              onPointerDown={(e) => e.stopPropagation()}
              onChange={(e) => updateTodo.mutate({ id: todo.id, status: e.target.checked ? 'done' : 'todo' })}
            />
            <p
              className={clsx(
                'text-sm font-semibold leading-snug',
                todo.status === 'done' && 'line-through text-gray-400',
              )}
            >
              {todo.title}
            </p>
          </label>
          <button
            type="button"
            className="btn btn-ghost btn-sm px-1.5 shrink-0 text-danger"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => confirm('이 할 일을 삭제할까요?') && deleteTodo.mutate(todo.id)}
          >
            ✕
          </button>
        </div>
        {todo.notes && <p className="text-xs text-gray-500 line-clamp-2">{todo.notes}</p>}
        <div className="flex items-center gap-2 flex-wrap mt-1">
          {todo.due_date && (
            <span className="badge bg-gray-100 text-gray-600">
              {new Date(todo.due_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {todo.priority > 0 && (
            <span className="badge bg-primary-light text-primary">{PRIORITY_LABEL[todo.priority] ?? todo.priority}</span>
          )}
        </div>
      </div>

      {editing && (
        <TodoFormModal
          projectId={projectId}
          initial={todo}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  )
}

function DroppableColumn({
  status,
  label,
  todos,
  projectId,
}: {
  status: TodoStatus
  label: string
  todos: Todo[]
  projectId: string
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'w-72 shrink-0 rounded-[14px] p-3 flex flex-col gap-2 bg-gray-100/60',
        isOver && 'ring-2 ring-primary',
      )}
    >
      <div className="flex items-center justify-between px-1">
        <h3 className="font-bold text-sm">{label}</h3>
        <span className="text-xs text-gray-400">{todos.length}</span>
      </div>
      <div className="flex flex-col gap-2 min-h-[40px]">
        {todos.map((todo) => (
          <TodoCard key={todo.id} todo={todo} projectId={projectId} />
        ))}
      </div>
    </div>
  )
}

function TodoFormModal({
  projectId,
  initial,
  onClose,
}: {
  projectId: string
  initial?: Todo
  onClose: () => void
}) {
  const createTodo = useCreateTodo(projectId)
  const updateTodo = useUpdateTodo(projectId)
  const [title, setTitle] = useState(initial?.title ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [dueDate, setDueDate] = useState(initial?.due_date?.slice(0, 10) ?? '')
  const [priority, setPriority] = useState(initial?.priority ?? 0)

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    const payload = {
      title: title.trim(),
      notes: notes.trim() || undefined,
      due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
      priority,
    }
    if (initial) {
      updateTodo.mutate({ id: initial.id, ...payload }, { onSuccess: onClose })
    } else {
      createTodo.mutate(payload, { onSuccess: onClose })
    }
  }

  return (
    <Modal title={initial ? '할 일 수정' : '할 일 추가'} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          className="input"
          placeholder="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          required
        />
        <textarea
          className="input h-20 py-2"
          placeholder="메모"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="flex gap-2">
          <input
            type="date"
            className="input"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <select
            className="input"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
          >
            <option value={0}>우선순위 없음</option>
            <option value={1}>낮음</option>
            <option value={5}>보통</option>
            <option value={9}>높음</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 mt-1">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            취소
          </button>
          <button type="submit" className="btn btn-primary">
            저장
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function ProjectDetailPage() {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>()
  const { data: workspace } = useWorkspace(workspaceId)
  const { data: project } = useProject(projectId)
  const { data: todos } = useTodos(projectId)
  const [hideCompleted, setHideCompleted] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const updateTodo = useUpdateTodo(projectId)

  const visibleTodos = useMemo(
    () => (hideCompleted ? (todos ?? []).filter((t) => t.status !== 'done') : todos ?? []),
    [todos, hideCompleted],
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    const newStatus = over.id as TodoStatus
    const todo = todos?.find((t) => t.id === active.id)
    if (!todo || todo.status === newStatus) return
    updateTodo.mutate({ id: todo.id, status: newStatus })
  }

  if (!workspaceId || !projectId) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to={`/workspace/${workspaceId}`} className="hover:underline">
          {workspace?.name ?? '워크스페이스'}
        </Link>
        <span>/</span>
        <span className="text-gray-800 font-semibold">{project?.name ?? '프로젝트'}</span>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">{project?.name ?? '할 일'}</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-sm text-gray-600 select-none">
            <input
              type="checkbox"
              checked={hideCompleted}
              onChange={(e) => setHideCompleted(e.target.checked)}
              className="w-4 h-4"
            />
            완료 항목 숨기기
          </label>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
            + 할 일 추가
          </button>
        </div>
      </div>

      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <DroppableColumn
              key={col.status}
              status={col.status}
              label={col.label}
              projectId={projectId}
              todos={visibleTodos.filter((t) => t.status === col.status)}
            />
          ))}
        </div>
      </DndContext>

      {showAdd && <TodoFormModal projectId={projectId} onClose={() => setShowAdd(false)} />}
    </div>
  )
}
