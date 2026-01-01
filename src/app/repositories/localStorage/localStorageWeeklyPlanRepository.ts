import { WeeklyPlan } from '../../types';
import { WeeklyPlanRepository } from '../weeklyPlanRepository';
import { loadAppData, saveAppData } from './appDataStore';

export class LocalStorageWeeklyPlanRepository implements WeeklyPlanRepository {
  async listByOwner(ownerId: string): Promise<WeeklyPlan[]> {
    return loadAppData(ownerId).weeklyPlans;
  }

  async listByStudent(ownerId: string, studentId: string): Promise<WeeklyPlan[]> {
    const data = loadAppData(ownerId);
    return data.weeklyPlans.filter((p) => p.studentId === studentId);
  }

  async getByStudentAndWeekStart(ownerId: string, studentId: string, weekStart: string): Promise<WeeklyPlan | null> {
    const data = loadAppData(ownerId);
    return data.weeklyPlans.find((p) => p.studentId === studentId && p.weekStart === weekStart) ?? null;
  }

  async upsert(ownerId: string, plan: WeeklyPlan): Promise<WeeklyPlan> {
    const data = loadAppData(ownerId);
    const nextPlan: WeeklyPlan = { ...plan, ownerId: plan.ownerId ?? ownerId };
    const exists = data.weeklyPlans.some((p) => p.id === nextPlan.id);
    const weeklyPlans = exists
      ? data.weeklyPlans.map((p) => (p.id === nextPlan.id ? nextPlan : p))
      : [nextPlan, ...data.weeklyPlans];
    saveAppData(ownerId, { ...data, weeklyPlans });
    return nextPlan;
  }

  async delete(ownerId: string, planId: string): Promise<void> {
    const data = loadAppData(ownerId);
    saveAppData(ownerId, { ...data, weeklyPlans: data.weeklyPlans.filter((p) => p.id !== planId) });
  }
}

