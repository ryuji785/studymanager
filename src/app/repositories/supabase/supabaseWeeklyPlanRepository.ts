import { WeeklyPlan } from '../../types';
import { WeeklyPlanRepository } from '../weeklyPlanRepository';

/**
 * 将来のSupabase実装（stub）。
 * - WeeklyPlanは ownerId + studentId + weekStart をユニークにする想定（DB制約）。
 */
export class SupabaseWeeklyPlanRepository implements WeeklyPlanRepository {
  async listByOwner(_ownerId: string): Promise<WeeklyPlan[]> {
    throw new Error('SupabaseWeeklyPlanRepository.listByOwner is not implemented');
  }

  async listByStudent(_ownerId: string, _studentId: string): Promise<WeeklyPlan[]> {
    throw new Error('SupabaseWeeklyPlanRepository.listByStudent is not implemented');
  }

  async getByStudentAndWeekStart(_ownerId: string, _studentId: string, _weekStart: string): Promise<WeeklyPlan | null> {
    throw new Error('SupabaseWeeklyPlanRepository.getByStudentAndWeekStart is not implemented');
  }

  async upsert(_ownerId: string, _plan: WeeklyPlan): Promise<WeeklyPlan> {
    throw new Error('SupabaseWeeklyPlanRepository.upsert is not implemented');
  }

  async delete(_ownerId: string, _planId: string): Promise<void> {
    throw new Error('SupabaseWeeklyPlanRepository.delete is not implemented');
  }
}

