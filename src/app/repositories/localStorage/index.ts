import { Repositories } from '../repositoryTypes';
import { clearAppData, seedDemoData } from './appDataStore';
import { LocalStorageStudentRepository } from './localStorageStudentRepository';
import { LocalStorageWeeklyPlanRepository } from './localStorageWeeklyPlanRepository';

export function createLocalStorageRepositories(): Repositories {
  return {
    students: new LocalStorageStudentRepository(),
    weeklyPlans: new LocalStorageWeeklyPlanRepository(),
    prototype: {
      async seedDemo(ownerId: string) {
        seedDemoData(ownerId);
      },
      async reset(ownerId: string) {
        clearAppData(ownerId);
      },
    },
  };
}
