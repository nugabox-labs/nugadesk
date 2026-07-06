import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import clsx from 'clsx'

import { Modal } from '../components/Modal'
import {
  useCreateTaskCategory,
  useDeleteTaskCategory,
  useTaskCategories,
  useUpdateTaskCategory,
} from '../hooks/useTaskCategories'
import { useCreateProject, useDeleteProject, useProjects } from '../hooks/useProjects'
import { useWorkspace } from '../hooks/useWorkspaces'
import type { Project, TaskCategory } from '../lib/types'

function ProjectMiniCard({ project, categoryId }: { project: Project; categoryId: string }) {
  const deleteProject = useDeleteProject(categoryId)
  return (
    <div className="card p-3 flex items-center justify-between gap-2 group">
      <Link to={`project/${project.id}`} className="min-w-0 flex-1">
        <div className="font-semibold text-sm truncate">{project.name}</div>
        {project.description && (
          <div className="text-xs text-gray-500 truncate">{project.description}</div>
        )}
      </Link>
      <button
        type="button"
        className="btn btn-ghost btn-sm px-2 opacity-0 group-hover:opacity-100 text-danger"
        onClick={() => {
          if (confirm(`'${project.name}' 프로젝트를 삭제할까요?`)) deleteProject.mutate(project.id)
        }}
      >
        ✕
      </button>
    </div>
  )
}

function AddProjectRow({ categoryId }: { categoryId: string }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const createProject = useCreateProject(categoryId)

  if (!open) {
    return (
      <button
        type="button"
        className="btn btn-ghost btn-sm w-full justify-start text-gray-500"
        onClick={() => setOpen(true)}
      >
        + 프로젝트 추가
      </button>
    )
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    createProject.mutate(
      { name: name.trim() },
      {
        onSuccess: () => {
          setName('')
          setOpen(false)
        },
      },
    )
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        className="input h-9"
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="프로젝트 이름"
        onBlur={() => !name && setOpen(false)}
      />
      <button type="submit" className="btn btn-primary btn-sm">
        추가
      </button>
    </form>
  )
}

function TaskCategoryBlock({
  category,
  view,
}: {
  category: TaskCategory
  view: 'kanban' | 'list'
}) {
  const { data: projects } = useProjects(category.id)
  const updateCategory = useUpdateTaskCategory(category.workspace_id)
  const deleteCategory = useDeleteTaskCategory(category.workspace_id)
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(category.name)

  return (
    <div className={clsx('card p-4 flex flex-col gap-3', view === 'kanban' ? 'w-72 shrink-0' : 'w-full')}>
      <div className="flex items-center justify-between gap-2">
        {renaming ? (
          <input
            className="input h-8 text-sm"
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              setRenaming(false)
              if (name.trim() && name !== category.name) {
                updateCategory.mutate({ id: category.id, name: name.trim() })
              }
            }}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          />
        ) : (
          <h3 className="font-bold text-sm cursor-pointer" onClick={() => setRenaming(true)}>
            {category.name}
          </h3>
        )}
        <button
          type="button"
          className="btn btn-ghost btn-sm px-2 text-danger"
          onClick={() => {
            if (confirm(`'${category.name}' 업무 분류를 삭제할까요? (30일 내 복구 가능)`)) {
              deleteCategory.mutate(category.id)
            }
          }}
        >
          ✕
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {projects?.map((p) => (
          <ProjectMiniCard key={p.id} project={p} categoryId={category.id} />
        ))}
        <AddProjectRow categoryId={category.id} />
      </div>
    </div>
  )
}

function AddCategoryModal({ workspaceId, onClose }: { workspaceId: string; onClose: () => void }) {
  const [name, setName] = useState('')
  const [icloudListName, setIcloudListName] = useState('')
  const createCategory = useCreateTaskCategory(workspaceId)

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    createCategory.mutate(
      { name: name.trim(), icloud_list_name: icloudListName.trim() || undefined },
      { onSuccess: onClose },
    )
  }

  return (
    <Modal title="업무 분류 추가" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          className="input"
          placeholder="업무 분류 이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
        />
        <input
          className="input"
          placeholder="iCloud 미리알림 리스트 이름 (선택, 추후 연동)"
          value={icloudListName}
          onChange={(e) => setIcloudListName(e.target.value)}
        />
        <div className="flex justify-end gap-2 mt-1">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            취소
          </button>
          <button type="submit" className="btn btn-primary" disabled={createCategory.isPending}>
            추가
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function WorkspaceDetailPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { data: workspace } = useWorkspace(workspaceId)
  const { data: categories, isLoading } = useTaskCategories(workspaceId)
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [showAddCategory, setShowAddCategory] = useState(false)

  if (!workspaceId) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-[8px] flex items-center justify-center text-lg"
            style={{ backgroundColor: `${workspace?.color ?? '#3182f6'}22` }}
          >
            {workspace?.icon}
          </div>
          <h1 className="text-2xl font-bold">{workspace?.name}</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-[10px] bg-gray-100 p-1">
            <button
              type="button"
              className={clsx('btn btn-sm', view === 'kanban' ? 'bg-white shadow-sm' : 'btn-ghost')}
              onClick={() => setView('kanban')}
            >
              칸반
            </button>
            <button
              type="button"
              className={clsx('btn btn-sm', view === 'list' ? 'bg-white shadow-sm' : 'btn-ghost')}
              onClick={() => setView('list')}
            >
              리스트
            </button>
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowAddCategory(true)}>
            + 업무 분류
          </button>
        </div>
      </div>

      {isLoading && <p className="text-gray-400">불러오는 중...</p>}

      <div className={clsx(view === 'kanban' ? 'flex gap-4 overflow-x-auto pb-4' : 'flex flex-col gap-4')}>
        {categories?.map((cat) => (
          <TaskCategoryBlock key={cat.id} category={cat} view={view} />
        ))}
        {categories?.length === 0 && (
          <p className="text-gray-400 text-sm">아직 업무 분류가 없습니다. 위 버튼으로 추가해보세요.</p>
        )}
      </div>

      {showAddCategory && (
        <AddCategoryModal workspaceId={workspaceId} onClose={() => setShowAddCategory(false)} />
      )}
    </div>
  )
}
