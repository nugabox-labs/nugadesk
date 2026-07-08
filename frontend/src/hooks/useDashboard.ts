import { useQuery } from '@tanstack/react-query'

import { api } from '../lib/api'
import type { WorkspaceTree } from '../lib/types'

export function useDashboardTree() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<WorkspaceTree[]>('/dashboard'),
  })
}
