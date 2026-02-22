import { create } from 'zustand';
import { goalsApi } from '../api/api';
import type { Goal } from '../constants';

interface GoalState {
  goals: Goal[];
  isLoading: boolean;
  fetchGoals: () => Promise<void>;
  getActiveGoal: () => Goal | undefined;
  addGoal: (goalData: Omit<Goal, 'id'>) => Promise<void>;
  updateGoal: (id: number, patch: Partial<Omit<Goal, 'id'>>) => Promise<void>;
  setActiveGoal: (id: number) => Promise<void>;
  deleteGoal: (id: number) => Promise<void>;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  isLoading: false,

  fetchGoals: async () => {
    set({ isLoading: true });
    try {
      const goals = await goalsApi.list();
      set({ goals, isLoading: false });
    } catch (e) {
      console.error('Failed to fetch goals:', e);
      set({ isLoading: false });
    }
  },

  getActiveGoal: () => {
    return get().goals.find((g) => g.isActive);
  },

  addGoal: async (goalData) => {
    try {
      // 新ゴールをアクティブにする場合、既存のアクティブゴールを非アクティブにする
      if (goalData.isActive) {
        const current = get().goals.filter((g) => g.isActive);
        for (const g of current) {
          await goalsApi.update(g.id, { isActive: false });
        }
      }

      const result = await goalsApi.create(goalData);
      // 再フェッチしてサーバーの最新状態を反映
      await get().fetchGoals();
    } catch (e) {
      console.error('Failed to add goal:', e);
    }
  },

  updateGoal: async (id, patch) => {
    try {
      await goalsApi.update(id, patch);
      // ローカル state を楽観的に更新
      set((state) => ({
        goals: state.goals.map((g) =>
          g.id === id ? { ...g, ...patch } : g,
        ),
      }));
    } catch (e) {
      console.error('Failed to update goal:', e);
    }
  },

  setActiveGoal: async (id) => {
    try {
      // 全ゴールを非アクティブに
      const promises = get().goals
        .filter((g) => g.isActive && g.id !== id)
        .map((g) => goalsApi.update(g.id, { isActive: false }));
      await Promise.all(promises);

      // 対象のゴールをアクティブに
      await goalsApi.update(id, { isActive: true });

      set((state) => ({
        goals: state.goals.map((g) => ({
          ...g,
          isActive: g.id === id,
        })),
      }));
    } catch (e) {
      console.error('Failed to set active goal:', e);
    }
  },

  deleteGoal: async (id) => {
    try {
      await goalsApi.delete(id);
      set((state) => ({ goals: state.goals.filter((g) => g.id !== id) }));
    } catch (e) {
      console.error('Failed to delete goal:', e);
    }
  },
}));
