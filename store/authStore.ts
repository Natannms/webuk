import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthState = {
  user: null | { id: string; name: string; email: string };
  token: string | null;
  isLoggedIn: boolean;
  login: (user: { id: string; name: string; email: string }, token: string) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoggedIn: false,

      login: (user, token) =>
        set({ user, token, isLoggedIn: true }),

      logout: () =>
        set({ user: null, token: null, isLoggedIn: false }),
    }),
    {
      name: 'auth-storage', // nome no AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
