import { Reflection, SubjectTarget, WeeklyGoal, WeeklyPlan } from '../types';

export function createBlankWeeklyPlan(params: {
  ownerId?: string;
  studentId: string;
  weekStart: string;
  weekEnd: string;
}): WeeklyPlan {
  const emptyGoals: WeeklyGoal[] = Array.from({ length: 3 }).map((_, index) => ({
    id: `goal_${Date.now()}_${index}`,
    text: '',
    completed: false,
  }));

  const emptyTargets: SubjectTarget[] = Array.from({ length: 8 }).map((_, index) => ({
    id: `target_${Date.now()}_${index}`,
    subject: '',
    material: '',
    range: '',
    content: '',
  }));

  const emptyReflection: Reflection = { goodPoints: '', challenges: '', nextWeek: '' };

  return {
    id: `week_${Date.now()}`,
    ownerId: params.ownerId,
    studentId: params.studentId,
    weekStart: params.weekStart,
    weekEnd: params.weekEnd,
    goals: emptyGoals,
    scheduleBlocks: [],
    subjectTargets: emptyTargets,
    reflection: emptyReflection,
    isPublished: false,
    lastUpdated: new Date().toISOString(),
  };
}

export function duplicatePlanToWeek(params: {
  ownerId?: string;
  source: WeeklyPlan;
  studentId: string;
  weekStart: string;
  weekEnd: string;
}): WeeklyPlan {
  const now = new Date().toISOString();

  return {
    ...params.source,
    id: `week_${Date.now()}`,
    ownerId: params.ownerId ?? params.source.ownerId,
    studentId: params.studentId,
    weekStart: params.weekStart,
    weekEnd: params.weekEnd,
    goals: params.source.goals.map((g, index) => ({
      id: `goal_${Date.now()}_${index}`,
      text: g.text,
      completed: false,
    })),
    scheduleBlocks: params.source.scheduleBlocks.map((b, index) => ({
      ...b,
      id: `block_${Date.now()}_${index}`,
      status: 'planned' as const,
      actualDuration: undefined,
    })),
    subjectTargets: params.source.subjectTargets.map((t, index) => ({
      ...t,
      id: `target_${Date.now()}_${index}`,
    })),
    reflection: { goodPoints: '', challenges: '', nextWeek: '' },
    isPublished: false,
    lastUpdated: now,
  };
}

