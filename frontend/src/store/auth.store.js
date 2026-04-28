import { create } from "zustand";

export const useAuthStore = create((set) => ({
  accessToken: null,
  user: null,
  setSession: (s) =>
    set({
      accessToken: s.accessToken ?? null,
      user: s.user ?? null,
    }),
  logout: () => set({ accessToken: null, user: null }),
}));
