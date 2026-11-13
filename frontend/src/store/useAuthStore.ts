import { create } from 'zustand';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'learner' | 'editor' | 'admin';
}

interface AuthState {
  token: string | null;
  user: User | null;
  ready: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  finishRestore: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  ready: false,

  login: (token, user) => {
    set({ token, user, ready: true });
  },

  logout: () => {
    set({ token: null, user: null, ready: true });
  },
  finishRestore: () => set({ ready: true }),
}));
