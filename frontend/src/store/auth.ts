import { create } from 'zustand'

interface AuthState {
  username: string | null
  avatarUrl: string | null
  checked: boolean
  setUser: (username: string | null, avatarUrl?: string | null) => void
  setAvatarUrl: (avatarUrl: string | null) => void
  setChecked: (checked: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  username: null,
  avatarUrl: null,
  checked: false,
  setUser: (username, avatarUrl) => set({ username, avatarUrl: avatarUrl ?? null }),
  setAvatarUrl: (avatarUrl) => set({ avatarUrl }),
  setChecked: (checked) => set({ checked }),
}))
