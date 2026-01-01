import { StudentRepository } from './studentRepository';
import { WeeklyPlanRepository } from './weeklyPlanRepository';

export type Repositories = {
  students: StudentRepository;
  weeklyPlans: WeeklyPlanRepository;
  /**
   * プロトタイプ専用（開発/検証用）。
   * SaaS化（Supabase/Stripe導入）後は削除またはdev-onlyに寄せる想定。
   */
  prototype: {
    seedDemo(ownerId: string): Promise<void>;
    reset(ownerId: string): Promise<void>;
  };
};

