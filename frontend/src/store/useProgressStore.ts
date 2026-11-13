import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";

export interface Progress {
  lessons: string[];
  quizzes: Record<string, { score: number; total: number; attempts: number }>;
  concepts: Record<string, { correct: number; total: number }>;
  notes: { id: string; title: string; text: string; date: string }[];
  setups?: TableSetup[];
}
export interface TableSetup {
  id: string;
  name: string;
  players: number;
  stack: number;
  hands: number;
  profile: string;
  coach: boolean;
}
const EMPTY: Progress = { lessons: [], quizzes: {}, concepts: {}, notes: [] };
const userKey = () => String(useAuthStore.getState().user?.id ?? "guest");
interface ProgressState {
  users: Record<string, Progress>;
  completeLesson: (id: string) => void;
  saveQuiz: (id: string, score: number, total: number) => void;
  recordConcept: (concept: string, correct: boolean) => void;
  saveNote: (title: string, text: string) => void;
  removeNote: (id: string) => void;
  saveSetup: (setup: TableSetup) => void;
  removeSetup: (id: string) => void;
}
export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => {
      const update = (change: (current: Progress) => Progress) =>
        set((state) => ({
          users: {
            ...state.users,
            [userKey()]: change(state.users[userKey()] ?? EMPTY),
          },
        }));
      return {
        users: {},
        completeLesson: (id) =>
          update((current) => ({
            ...current,
            lessons: [...new Set([...current.lessons, id])],
          })),
        saveQuiz: (id, score, total) =>
          update((current) => ({
            ...current,
            quizzes: {
              ...current.quizzes,
              [id]: {
                score,
                total,
                attempts: (current.quizzes[id]?.attempts ?? 0) + 1,
              },
            },
          })),
        recordConcept: (concept, correct) =>
          update((current) => ({
            ...current,
            concepts: {
              ...current.concepts,
              [concept]: {
                correct:
                  (current.concepts[concept]?.correct ?? 0) + Number(correct),
                total: (current.concepts[concept]?.total ?? 0) + 1,
              },
            },
          })),
        saveNote: (title, text) =>
          update((current) => ({
            ...current,
            notes: [
              {
                id: crypto.randomUUID(),
                title,
                text,
                date: new Date().toISOString(),
              },
              ...current.notes,
            ].slice(0, 100),
          })),
        removeNote: (id) =>
          update((current) => ({
            ...current,
            notes: current.notes.filter((note) => note.id !== id),
          })),
        saveSetup: (setup) =>
          update((current) => ({
            ...current,
            setups: [
              setup,
              ...(current.setups ?? []).filter((item) => item.id !== setup.id),
            ].slice(0, 30),
          })),
        removeSetup: (id) =>
          update((current) => ({
            ...current,
            setups: (current.setups ?? []).filter((setup) => setup.id !== id),
          })),
      };
    },
    {
      name: "pokerlearn-progress-v1",
      partialize: (state) => ({ users: state.users }),
    },
  ),
);

export function useProgress() {
  const id = useAuthStore((state) => state.user?.id);
  return useProgressStore(
    (state) => state.users[String(id ?? "guest")] ?? EMPTY,
  );
}
