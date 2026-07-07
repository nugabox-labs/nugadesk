import { useMutation } from '@tanstack/react-query'

import { api } from '../lib/api'

interface UploadResult {
  url: string
}

export function useUploadWorkspaceIcon() {
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return api.upload<UploadResult>('/uploads/workspace-icon', formData)
    },
  })
}
