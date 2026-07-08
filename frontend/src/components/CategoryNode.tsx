import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

import { CategoryFormModal } from './CategoryFormModal'
import { CategoryIcon } from './CategoryIcon'
import { Modal } from './Modal'
import { ProgressRing } from './ProgressRing'
import { useDeleteCategory } from '../hooks/useCategories'
import { useCreateTodo, useDeleteTodo, useUpdateTodo } from '../hooks/useTodos'
import type { CategoryTree, Todo } from '../lib/types'

const PRIORITY_LABEL: Record<number, string> = { 1: '낮음', 5: '보통', 9: '높음' }

function TodoEditModal({ todo, onClose }: { todo: Todo; onClose: () => void }) {
  const updateTodo = useUpdateTodo()
  const [title, setTitle] = useState(todo.title)
  const [notes, setNotes] = useState(todo.notes ?? '')
  const [dueDate, setDueDate] = useState(todo.due_date?.slice(0, 10) ?? '')
  const [priority, setPriority] = useState(todo.priority)

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    updateTodo.mutate(
      {
        id: todo.id,
        title: title.trim(),
        notes: notes.trim() || undefined,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        priority,
      },
      { onSuccess: onClose },
    )
  }

  return (
    <Modal title="할 일 수정" onClose={onClose}>
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

function TodoRow({ todo }: { todo: Todo }) {
  const updateTodo = useUpdateTodo()
  const deleteTodo = useDeleteTodo()
  const [editing, setEditing] = useState(false)

  return (
    <div className="flex items-center gap-2 py-1">
      <input
        type="checkbox"
        className="checkbox-circle"
        checked={todo.status === 'done'}
        onChange={(e) => updateTodo.mutate({ id: todo.id, status: e.target.checked ? 'done' : 'todo' })}
      />
      <button
        type="button"
        className={clsx(
          'text-xs text-left truncate flex-1 min-w-0',
          todo.status === 'done' && 'line-through text-gray-400',
        )}
        onClick={() => setEditing(true)}
      >
        {todo.title}
      </button>
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
      <button
        type="button"
        className="btn btn-ghost btn-sm px-1.5 shrink-0 text-danger"
        onClick={() => confirm('이 할 일을 삭제할까요?') && deleteTodo.mutate(todo.id)}
      >
        ✕
      </button>
      {editing && <TodoEditModal todo={todo} onClose={() => setEditing(false)} />}
    </div>
  )
}

function AddTodoRow({ categoryId }: { categoryId: string }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const createTodo = useCreateTodo(categoryId)

  if (!open) {
    return (
      <button
        type="button"
        className="btn btn-ghost btn-sm justify-start text-gray-500"
        onClick={() => setOpen(true)}
      >
        + 할 일
      </button>
    )
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    createTodo.mutate(
      { title: title.trim() },
      { onSuccess: () => { setTitle(''); setOpen(false) } },
    )
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        className="input h-9"
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="할 일 제목"
        onBlur={() => !title && setOpen(false)}
      />
      <button type="submit" className="btn btn-primary btn-sm">
        추가
      </button>
    </form>
  )
}

function AddChildCategoryRow({ parentId }: { parentId: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost btn-sm justify-start text-gray-500"
        onClick={() => setOpen(true)}
      >
        + 하위 분류
      </button>
      {open && <CategoryFormModal parentId={parentId} onClose={() => setOpen(false)} />}
    </>
  )
}

function CategoryMenu({
  categoryId,
  onEdit,
  onDelete,
}: {
  categoryId: string
  onEdit: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        className="btn btn-ghost btn-sm px-2"
        aria-label="분류 메뉴"
        onClick={() => setOpen((v) => !v)}
      >
        ⋮
      </button>
      {open && (
        <div className="card absolute right-0 top-full mt-1 z-10 p-1 flex flex-col min-w-[112px] shadow-lg">
          <Link
            to={`/category/${categoryId}`}
            className="btn btn-ghost btn-sm justify-start"
            onClick={() => setOpen(false)}
          >
            자세히 보기
          </Link>
          <button
            type="button"
            className="btn btn-ghost btn-sm justify-start"
            onClick={() => {
              setOpen(false)
              onEdit()
            }}
          >
            수정
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm justify-start text-danger"
            onClick={() => {
              setOpen(false)
              onDelete()
            }}
          >
            삭제
          </button>
        </div>
      )}
    </div>
  )
}

export function CategoryNode({ node, isTopLevel }: { node: CategoryTree; isTopLevel: boolean }) {
  const [expanded, setExpanded] = useState(true)
  const [editing, setEditing] = useState(false)
  const deleteCategory = useDeleteCategory()

  const isMapped = !!(node.icloud_list_uid || node.icloud_list_name)
  const canExpand = node.children.length > 0 || node.todos.length > 0
  const percent = node.todo_count > 0 ? Math.round((node.done_count / node.todo_count) * 100) : 0

  return (
    <div className={clsx('flex flex-col gap-2', !isTopLevel && 'border-l-2 border-gray-100 pl-3')}>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          className="flex items-center gap-2 min-w-0 flex-1 text-left"
          onClick={() => canExpand && setExpanded((v) => !v)}
        >
          {canExpand && (
            <span
              className={clsx(
                'text-gray-400 text-[10px] shrink-0 transition-transform',
                expanded && 'rotate-90',
              )}
            >
              ▶
            </span>
          )}
          {isTopLevel && (
            <CategoryIcon icon={node.icon} color={node.color} className="w-9 h-9 rounded-[10px] text-lg shrink-0" />
          )}
          <span className={clsx('truncate min-w-0', isTopLevel ? 'font-bold' : 'text-sm font-semibold')}>
            {node.name}
          </span>
          {isMapped && <span className="badge bg-primary-light text-primary shrink-0">iCloud</span>}
          {node.todo_count > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
              <ProgressRing percent={percent} />
              {node.done_count}/{node.todo_count}
            </span>
          )}
        </button>
        <CategoryMenu
          categoryId={node.id}
          onEdit={() => setEditing(true)}
          onDelete={() => {
            if (confirm(`'${node.name}' 분류를 삭제할까요? (30일 내 복구 가능)`)) {
              deleteCategory.mutate(node.id)
            }
          }}
        />
      </div>

      {expanded && (
        <div className="flex flex-col gap-2 pl-1">
          {node.children.map((child) => (
            <CategoryNode key={child.id} node={child} isTopLevel={false} />
          ))}
          {node.todos.map((todo) => (
            <TodoRow key={todo.id} todo={todo} />
          ))}
          <div className="flex items-center gap-2">
            {!isMapped && <AddChildCategoryRow parentId={node.id} />}
            <AddTodoRow categoryId={node.id} />
          </div>
        </div>
      )}

      {editing && (
        <CategoryFormModal
          parentId={node.parent_id}
          initial={node}
          hasChildren={node.children.length > 0}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  )
}
