import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

import { CategoryFormModal } from './CategoryFormModal'
import { CategoryIcon } from './CategoryIcon'
import { FaIcon } from './FaIcon'
import { Modal } from './Modal'
import { ProgressRing } from './ProgressRing'
import { useDeleteCategory } from '../hooks/useCategories'
import { useCreateTodo, useDeleteTodo, useUpdateTodo } from '../hooks/useTodos'
import { useSettingsStore } from '../store/settings'
import {
  isUrgentPriority,
  normalizePriority,
  PRIORITY_OPTIONS,
  REPEAT_OPTIONS,
  repeatLabel,
  type TodoPriority,
} from '../lib/todoMeta'
import type { CategoryTree, Todo, TodoRepeatRule } from '../lib/types'

type CategoryNodeMode = 'card' | 'detail'

function TodoEditModal({ todo, onClose }: { todo: Todo; onClose: () => void }) {
  const updateTodo = useUpdateTodo()
  const deleteTodo = useDeleteTodo()
  const [title, setTitle] = useState(todo.title)
  const [notes, setNotes] = useState(todo.notes ?? '')
  const [dueDate, setDueDate] = useState(todo.due_date?.slice(0, 10) ?? '')
  const [priority, setPriority] = useState<TodoPriority>(normalizePriority(todo.priority))
  const [repeatRule, setRepeatRule] = useState<TodoRepeatRule | ''>(todo.repeat_rule ?? '')

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
        repeat_rule: repeatRule || null,
      },
      { onSuccess: onClose },
    )
  }

  function handleDelete() {
    if (!confirm('이 할 일을 삭제할까요?')) return
    deleteTodo.mutate(todo.id, { onSuccess: onClose })
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
            onChange={(e) => setPriority(Number(e.target.value) as TodoPriority)}
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={repeatRule}
            onChange={(e) => setRepeatRule(e.target.value as TodoRepeatRule | '')}
          >
            {REPEAT_OPTIONS.map((option) => (
              <option key={option.value || 'none'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-between gap-2 mt-1">
          <button type="button" className="btn btn-ghost text-danger" onClick={handleDelete}>
            삭제
          </button>
          <div className="flex gap-2">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn btn-primary">
              저장
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

function TodoRow({ todo }: { todo: Todo }) {
  const updateTodo = useUpdateTodo()
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
          'text-sm text-left truncate flex-1 min-w-0',
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
      {todo.repeat_rule && (
        <span className="badge bg-gray-100 text-gray-500 shrink-0 inline-flex items-center gap-1">
          <FaIcon name="repeat" className="text-[10px]" />
          {repeatLabel(todo.repeat_rule)}
        </span>
      )}
      {isUrgentPriority(todo.priority) && (
        <span className="badge bg-danger/10 text-danger shrink-0">긴급</span>
      )}
      {editing && <TodoEditModal todo={todo} onClose={() => setEditing(false)} />}
    </div>
  )
}

function AddTodoForm({ categoryId, onClose }: { categoryId: string; onClose: () => void }) {
  const [title, setTitle] = useState('')
  const createTodo = useCreateTodo(categoryId)

  function submit(e?: FormEvent) {
    e?.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    createTodo.mutate({ title: trimmed }, { onSuccess: () => { setTitle(''); onClose() } })
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input
        className="input h-8 min-h-8 flex-1 py-0 text-sm rounded-[var(--radius-btn-sm)]"
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="할 일 제목"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
            e.preventDefault()
            submit()
          }
        }}
        onBlur={(e) => {
          const next = e.relatedTarget
          if (next && e.currentTarget.form?.contains(next)) return
          if (!title.trim()) onClose()
        }}
      />
      <button type="submit" className="btn btn-primary btn-sm shrink-0">
        추가
      </button>
    </form>
  )
}

export function CategoryMenu({
  onEdit,
  onAddCategory,
  onDelete,
}: {
  onEdit: () => void
  onAddCategory?: () => void
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
        <FaIcon name="ellipsis-vertical" />
      </button>
      {open && (
        <div className="card absolute right-0 top-full mt-1 z-10 p-1 flex flex-col min-w-[112px] shadow-lg">
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
          {onAddCategory && (
            <button
              type="button"
              className="btn btn-ghost btn-sm justify-start"
              onClick={() => {
                setOpen(false)
                onAddCategory()
              }}
            >
              분류 추가
            </button>
          )}
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

function CategoryTitleContent({
  node,
  isTopLevel,
  isMapped,
  percent,
  hideCompleted,
}: {
  node: CategoryTree
  isTopLevel: boolean
  isMapped: boolean
  percent: number
  hideCompleted: boolean
}) {
  const remaining = node.todo_count - node.done_count

  return (
    <>
      {isTopLevel && (
        <CategoryIcon icon={node.icon} className="text-lg leading-none text-gray-700" />
      )}
      <span className={clsx('truncate min-w-0', isTopLevel ? 'font-bold' : 'text-sm font-semibold')}>
        {node.name}
      </span>
      {isMapped && <span className="badge bg-primary-light text-primary shrink-0">iCloud</span>}
      {node.todo_count > 0 && (
        <span className="text-xs text-gray-400 shrink-0">
          {hideCompleted ? remaining : `${remaining}/${node.todo_count}`}
        </span>
      )}
      {node.todo_count > 0 && !hideCompleted && <ProgressRing percent={percent} />}
    </>
  )
}

export function CategoryNode({
  node,
  isTopLevel,
  mode = 'card',
}: {
  node: CategoryTree
  isTopLevel: boolean
  mode?: CategoryNodeMode
}) {
  const [expanded, setExpanded] = useState(true)
  const [editing, setEditing] = useState(false)
  const [addingTodo, setAddingTodo] = useState(false)
  const [addingCategory, setAddingCategory] = useState(false)
  const deleteCategory = useDeleteCategory()
  const hideCompleted = useSettingsStore((s) => s.hideCompletedTodos)

  const isMapped = !!(node.icloud_list_uid || node.icloud_list_name)
  const visibleTodos = hideCompleted ? node.todos.filter((todo) => todo.status !== 'done') : node.todos
  const canExpand = node.children.length > 0 || visibleTodos.length > 0 || addingTodo
  const percent = node.todo_count > 0 ? Math.round((node.done_count / node.todo_count) * 100) : 0
  const isCard = mode === 'card'
  const hideTopLevelChrome = isTopLevel && isCard
  // 상세 페이지의 최상위 분류는 페이지 타이틀이 곧 헤더 역할을 하므로 카드 안에 별도 헤더를 두지 않고 내용이 바로 나옴
  const isDetailRoot = isTopLevel && !isCard

  return (
    <div className={clsx('flex flex-col gap-2', !isTopLevel && 'border-l-2 border-gray-100 pl-3')}>
      {!isDetailRoot && (
        <div
          className={clsx(
            'flex items-center justify-between gap-2',
            hideTopLevelChrome && '-mx-4 -mt-4 mb-3 px-4 py-3 rounded-t-[var(--radius-btn-xl)]',
          )}
          style={
            hideTopLevelChrome
              ? { backgroundColor: node.color ? `${node.color}12` : undefined }
              : undefined
          }
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {canExpand && !hideTopLevelChrome && (
              <button
                type="button"
                className="text-gray-400 shrink-0 transition-transform p-0.5"
                aria-label={expanded ? '접기' : '펼치기'}
                onClick={() => setExpanded((v) => !v)}
              >
                <FaIcon
                  name="chevron-right"
                  className={clsx('text-xs transition-transform', expanded && 'rotate-90')}
                />
              </button>
            )}
            {isCard ? (
              <Link
                to={`/category/${node.id}`}
                className="flex items-center gap-2 min-w-0 flex-1 text-left hover:opacity-80"
              >
                <CategoryTitleContent
                  node={node}
                  isTopLevel={isTopLevel}
                  isMapped={isMapped}
                  percent={percent}
                  hideCompleted={hideCompleted}
                />
              </Link>
            ) : (
              <button
                type="button"
                className="flex items-center gap-2 min-w-0 flex-1 text-left"
                onClick={() => canExpand && setExpanded((v) => !v)}
              >
                <CategoryTitleContent
                  node={node}
                  isTopLevel={isTopLevel}
                  isMapped={isMapped}
                  percent={percent}
                  hideCompleted={hideCompleted}
                />
              </button>
            )}
          </div>

          {!isCard && (
            <CategoryMenu
              onEdit={() => setEditing(true)}
              onAddCategory={!isMapped ? () => setAddingCategory(true) : undefined}
              onDelete={() => {
                if (confirm(`'${node.name}' 분류를 삭제할까요? (30일 내 복구 가능)`)) {
                  deleteCategory.mutate(node.id)
                }
              }}
            />
          )}
        </div>
      )}

      {expanded && (
        <div className={clsx('flex flex-col gap-2', !isDetailRoot && 'pl-1')}>
          {node.children.map((child) => (
            <CategoryNode key={child.id} node={child} isTopLevel={false} mode={mode} />
          ))}
          {visibleTodos.map((todo) => (
            <TodoRow key={todo.id} todo={todo} />
          ))}
          {addingTodo ? (
            <AddTodoForm categoryId={node.id} onClose={() => setAddingTodo(false)} />
          ) : (
            <button
              type="button"
              className="group relative flex h-6 items-center py-1"
              onClick={() => setAddingTodo(true)}
              aria-label="할 일 추가"
            >
              <span className="h-px w-full bg-gray-100 transition-colors group-hover:bg-gray-300" />
              <span className="absolute left-1/2 top-1/2 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-gray-700 opacity-0 transition-opacity group-hover:bg-gray-200 group-hover:opacity-100">
                <FaIcon name="plus" className="text-[10px]" />
              </span>
            </button>
          )}
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

      {addingCategory && (
        <CategoryFormModal parentId={node.id} onClose={() => setAddingCategory(false)} />
      )}
    </div>
  )
}
