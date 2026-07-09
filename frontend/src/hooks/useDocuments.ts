import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../lib/api'

export interface DocumentListItem {
  id: string
  title: string
  icon: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Document extends DocumentListItem {
  content: Record<string, unknown>[] | null
}

const DOCUMENTS_KEY = ['documents'] as const

function documentKey(id: string) {
  return ['documents', id] as const
}

export function useDocuments() {
  return useQuery({
    queryKey: DOCUMENTS_KEY,
    queryFn: () => api.get<DocumentListItem[]>('/documents'),
  })
}

export function useDocument(id: string | undefined) {
  return useQuery({
    queryKey: documentKey(id ?? ''),
    queryFn: () => api.get<Document>(`/documents/${id}`),
    enabled: Boolean(id),
  })
}

export function useCreateDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { title: string; content?: Record<string, unknown>[] | null; icon?: string }) =>
      api.post<Document>('/documents', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DOCUMENTS_KEY }),
  })
}

export function useUpdateDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: string
      title?: string
      content?: Record<string, unknown>[] | null
      icon?: string | null
    }) => api.patch<Document>(`/documents/${id}`, payload),
    onSuccess: (doc) => {
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_KEY })
      queryClient.setQueryData(documentKey(doc.id), doc)
    },
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/documents/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DOCUMENTS_KEY }),
  })
}
