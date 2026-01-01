import { WeeklyPlan } from '../types';

/**
 * データアクセス境界（WeeklyPlans）。
 * - 将来：Supabase実装に差し替える（API形は維持）
 */
export interface WeeklyPlanRepository {
  listByOwner(ownerId: string): Promise<WeeklyPlan[]>;
  listByStudent(ownerId: string, studentId: string): Promise<WeeklyPlan[]>;
  getByStudentAndWeekStart(ownerId: string, studentId: string, weekStart: string): Promise<WeeklyPlan | null>;
  upsert(ownerId: string, plan: WeeklyPlan): Promise<WeeklyPlan>;
  delete(ownerId: string, planId: string): Promise<void>;
}

