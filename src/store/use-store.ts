"use client";
import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";
import { retainSubmissions } from "@/lib/retain-submissions";
import {
  emptyLearningState,
  validateLearningState,
  type LearningState,
} from "@/lib/foundations/learning-state";
import { storage, DATA_KEYS } from "@/lib/storage";
import {
  emptyLearnProgress,
  type LearnProgress,
} from "@/lib/foundations/model-v2";
import { validateLearnProgress } from "@/lib/foundations/validate-progress-v2";
import type {
  Profile,
  Settings,
  Submission,
  Review,
  StudyList,
  Problem,
  ContestSession,
  LegacyArchive,
} from "@/lib/types";
export const DEFAULT_SETTINGS: Settings = {
  codeTrack: "java",
  lessonLanguage: "en",
  theme: "light",
  readableText: false,
  motion: true,
  sound: false,
  freeBrowse: false,
  language: "javascript",
  fontSize: 14,
  tabSize: 2,
  javaBackend: "remote",
  judgeUrl: "",
  taglish: false,
  countdownMinutes: 0,
  autoSubmit: false,
};
interface Data {
  learning: LearningState;
  foundations: LearnProgress;
  archive: LegacyArchive | null;
  profile: Profile;
  settings: Settings;
  submissions: Submission[];
  notes: Record<string, string>;
  srs: Review[];
  lists: StudyList[];
  customProblems: Problem[];
  sessions: { contest?: ContestSession; lastProblem?: string };
  achievements: string[];
  progress: Record<string, boolean>;
  plans: Record<string, number>;
}
interface Store extends Data {
  setLearning: (learning: LearningState) => void;
  setFoundationsProgress: (progress: LearnProgress) => void;
  hydrated: boolean;
  hydrate: () => void;
  updateProfile: (p: Partial<Profile>) => void;
  updateSettings: (p: Partial<Settings>) => void;
  addSubmission: (s: Submission) => void;
  setNote: (id: string, note: string) => void;
  setReviews: (r: Review[]) => void;
  setLists: (l: StudyList[]) => void;
  addProblem: (p: Problem) => void;
  setSession: (s: Partial<Data["sessions"]>) => void;
  setPlan: (id: string, day: number) => void;
  cleanup: () => void;
}
const defaults: Data = {
  learning: emptyLearningState(),
  foundations: emptyLearnProgress(),
  archive: null,
  profile: { name: "Coder", avatar: "J", onboarded: false },
  settings: DEFAULT_SETTINGS,
  submissions: [],
  notes: {},
  srs: [],
  lists: [],
  customProblems: [],
  sessions: {},
  achievements: [],
  progress: {},
  plans: {},
};
const adapter: PersistStorage<Data> = {
  getItem: () => {
    if (!storage.migrate())
      throw new Error(
        "Could not migrate local data. Export a backup to free space.",
      );
    return {
      state: Object.fromEntries(
        DATA_KEYS.map((k) => [
          k,
          k === "settings"
            ? { ...DEFAULT_SETTINGS, ...storage.read(k, DEFAULT_SETTINGS) }
            : storage.read(k, defaults[k]),
        ]),
      ) as unknown as Data,
      version: 6,
    };
  },
  setItem: (_, value) => {
    for (const k of DATA_KEYS) storage.write(k, value.state[k]);
  },
  removeItem: () => storage.clear(),
};
export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...defaults,
      setLearning: (learning) => {
        validateLearningState(learning);
        set({ learning });
      },
      setFoundationsProgress: (foundations) => {
        validateLearnProgress(foundations);
        set({ foundations });
      },
      hydrated: false,
      hydrate: () => {
        if (storage.migrate()) set({ hydrated: true });
      },
      updateProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      updateSettings: (p) =>
        set((s) => ({ settings: { ...s.settings, ...p } })),
      addSubmission: (submission) =>
        set((s) => {
          const submissions = retainSubmissions([submission, ...s.submissions]);
          const solved = submission.verdict === "accepted";
          return {
            submissions,
            progress: solved
              ? { ...s.progress, [submission.problemId]: true }
              : s.progress,
            srs:
              solved && !s.srs.some((r) => r.problemId === submission.problemId)
                ? [
                    ...s.srs,
                    {
                      problemId: submission.problemId,
                      step: 0,
                      due: Date.now() + 86400000,
                    },
                  ]
                : s.srs,
          };
        }),
      setNote: (id, note) =>
        set((s) => ({ notes: { ...s.notes, [id]: note } })),
      setReviews: (srs) => set({ srs }),
      setLists: (lists) => set({ lists }),
      addProblem: (p) =>
        set((s) => ({
          customProblems: [...s.customProblems.filter((x) => x.id !== p.id), p],
        })),
      setSession: (p) => set((s) => ({ sessions: { ...s.sessions, ...p } })),
      setPlan: (id, day) => set((s) => ({ plans: { ...s.plans, [id]: day } })),
      cleanup: () =>
        set({
          submissions: retainSubmissions(get().submissions, 2),
        }),
    }),
    {
      name: "Iwons",
      version: 6,
      storage: adapter,
      skipHydration: true,
      partialize: (s) =>
        Object.fromEntries(DATA_KEYS.map((k) => [k, s[k]])) as unknown as Data,
    },
  ),
);
