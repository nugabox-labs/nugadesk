import { useQuery } from '@tanstack/react-query'

import { api } from '../lib/api'
import type { CategoryTree } from '../lib/types'
import { useIcloudStatus } from './useIcloud'

export function useDashboardTree() {
  const { data: icloudStatus } = useIcloudStatus()

  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<CategoryTree[]>('/dashboard'),
    refetchInterval: icloudStatus?.connected ? 30_000 : false,
  })
}
