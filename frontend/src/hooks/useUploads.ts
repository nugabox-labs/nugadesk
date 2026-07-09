import { useMutation } from '@tanstack/react-query'

import { api } from '../lib/api'

interface UploadResult {
  url: string
}

export function useUploadCategoryIcon() {
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return api.upload<UploadResult>('/uploads/workspace-icon', formData)
    },
  })
}

export function useUploadAvatar() {
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return api.upload<UploadResult>('/uploads/avatar', formData)
    },
  })
}
