// src/lib/store.js – Zustand global state
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      login: ({ user, session }) => set({
        user,
        token: session.access_token,
        refreshToken: session.refresh_token,
        isAuthenticated: true,
      }),

      logout: () => set({
        user: null, token: null, refreshToken: null, isAuthenticated: false,
      }),

      updateUser: (updates) => set({ user: { ...get().user, ...updates } }),
      setToken: (token) => set({ token }),
    }),
    {
      name: 'propflow-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// UI state
export const useUIStore = create((set) => ({
  sidebarCollapsed: false,
  chatOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  openChat: () => set({ chatOpen: true }),
  closeChat: () => set({ chatOpen: false }),
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
}));
