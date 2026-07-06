import { useQuery } from '@tanstack/react-query'

import { api } from '../lib/api'
import type { VersionInfo } from '../lib/types'

export function useVersion() {
  return useQuery({
    queryKey: ['version'],
    queryFn: () => api.get<VersionInfo>('/version'),
    staleTime: 60 * 1000,
  })
}
