import { create } from 'zustand'

interface AuthState {
  username: string | null
  checked: boolean
  setUser: (username: string | null) => void
  setChecked: (checked: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  username: null,
  checked: false,
  setUser: (username) => set({ username }),
  setChecked: (checked) => set({ checked }),
}))
