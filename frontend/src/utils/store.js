import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, error: null });
  },
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));

export const useQuizStore = create((set) => ({
  quizzes: [],
  currentQuiz: null,
  currentResponse: null,
  leaderboard: [],
  history: [],
  isLoading: false,

  setQuizzes: (quizzes) => set({ quizzes }),
  setCurrentQuiz: (quiz) => set({ currentQuiz: quiz }),
  setCurrentResponse: (response) => set({ currentResponse: response }),
  setLeaderboard: (leaderboard) => set({ leaderboard }),
  setHistory: (history) => set({ history }),
  setLoading: (isLoading) => set({ isLoading }),
}));

export const useGroupStore = create((set) => ({
  groups: [],
  currentGroup: null,
  isLoading: false,

  setGroups: (groups) => set({ groups }),
  setCurrentGroup: (group) => set({ currentGroup: group }),
  setLoading: (isLoading) => set({ isLoading }),
}));
