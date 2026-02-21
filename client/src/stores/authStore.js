import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      tenant: null,
      isAuthenticated: false,

      setAuth: (token, tenant) =>
        set({ token, tenant, isAuthenticated: true }),

      updateTenant: (partial) =>
        set((state) => ({
          tenant: state.tenant ? { ...state.tenant, ...partial } : null,
        })),

      logout: () =>
        set({ token: null, tenant: null, isAuthenticated: false }),
    }),
    {
      name: 'support-hub-auth',
    }
  )
);
