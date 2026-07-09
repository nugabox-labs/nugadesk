export interface Category {
  id: string
  parent_id: string | null
  name: string
  icon: string | null
  color: string | null
  icloud_list_uid: string | null
  icloud_list_name: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export type TodoStatus = 'todo' | 'in_progress' | 'done'

export type TodoRepeatRule = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface Todo {
  id: string
  category_id: string
  title: string
  notes: string | null
  due_date: string | null
  priority: number
  repeat_rule: TodoRepeatRule | null
  status: TodoStatus
  sort_order: number
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface CategoryTree extends Category {
  children: CategoryTree[]
  todos: Todo[]
  todo_count: number
  done_count: number
}

export interface VersionInfo {
  version: string
  mode: 'dev' | 'prod'
  gitCommit: string
}

export type NavSecondaryItemType = 'link' | 'heading' | 'categories'

export interface NavSecondaryItem {
  id: string
  primary_id: string
  item_type: NavSecondaryItemType
  label: string
  icon: string | null
  route_path: string | null
  page_title: string | null
  page_description: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface NavPrimaryItem {
  id: string
  label: string
  icon: string | null
  route_path: string
  path_prefixes: string | null
  page_title: string | null
  page_description: string | null
  sort_order: number
  created_at: string
  updated_at: string
  secondary_items: NavSecondaryItem[]
}
