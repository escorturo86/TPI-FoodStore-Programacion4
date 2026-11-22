import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { axiosInstance } from '../shared/api/axiosInstance'
import type { Usuario } from '../features/auth/types/Usuario'

interface AuthState {
  usuario: Usuario | null
  comprobando: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      comprobando: true,
      clearSession: () => set({ usuario: null, comprobando: false }),
      login: async (username, password) => {
        const form = new URLSearchParams({ username, password })
        await axiosInstance.post('/auth/token', form)
        const { data } = await axiosInstance.get<Usuario>('/auth/me')
        set({ usuario: data, comprobando: false })
      },
      logout: async () => {
        try {
          await axiosInstance.post('/auth/logout')
        } finally {
          set({ usuario: null, comprobando: false })
        }
      },
      checkSession: async () => {
        set({ comprobando: true })
        try {
          const { data } = await axiosInstance.get<Usuario>('/auth/me')
          set({ usuario: data })
        } catch {
          set({ usuario: null })
        } finally {
          set({ comprobando: false })
        }
      },
    }),
    {
      name: 'foodstore-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ usuario: state.usuario }),
    },
  ),
)
