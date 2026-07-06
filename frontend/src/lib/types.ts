export interface Workspace {
  id: string
  name: string
  icon: string | null
  color: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface TaskCategory {
  id: string
  workspace_id: string
  name: string
  icloud_list_uid: string | null
  icloud_list_name: string | null
  sort_order: number
  created_at: string
}

export interface Project {
  id: string
  task_category_id: string
  name: string
  description: string | null
  status: 'active' | 'archived'
  sort_order: number
  created_at: string
}

export type TodoStatus = 'todo' | 'in_progress' | 'done'

export interface Todo {
  id: string
  project_id: string
  title: string
  notes: string | null
  due_date: string | null
  priority: number
  status: TodoStatus
  sort_order: number
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface VersionInfo {
  version: string
  mode: 'dev' | 'prod'
  gitCommit: string
}
