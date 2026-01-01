import { Student, WeeklyPlan } from '../../types';
import { mockStudents, mockWeeklyPlans } from '../../utils/mockData';

export type AppData = {
  students: Student[];
  weeklyPlans: WeeklyPlan[];
};

const STORAGE_KEY_PREFIX = 'study-manager.appData.v1';
const LEGACY_KEY = STORAGE_KEY_PREFIX;

function ownerKey(ownerId: string) {
  return `${STORAGE_KEY_PREFIX}.${ownerId}`;
}

function parseJson<T>(value: string): T {
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    throw new Error('保存データの読み込みに失敗しました。データ形式が不正です。', { cause: error });
  }
}

function normalize(ownerId: string, raw: Partial<AppData> | null | undefined): AppData {
  const students = Array.isArray(raw?.students) ? raw.students : [];
  const weeklyPlans = Array.isArray(raw?.weeklyPlans) ? raw.weeklyPlans : [];

  return {
    students: students
      .map((s) => ({ ...s, ownerId: s.ownerId ?? ownerId }))
      .filter((s) => s.ownerId === ownerId),
    weeklyPlans: weeklyPlans
      .map((p) => ({ ...p, ownerId: p.ownerId ?? ownerId }))
      .filter((p) => p.ownerId === ownerId),
  };
}

export function loadAppData(ownerId: string): AppData {
  const raw = localStorage.getItem(ownerKey(ownerId));
  if (raw) return normalize(ownerId, parseJson<AppData>(raw));

  // 旧キー（単一ユーザー時代）の移行：local-user のみ対象
  if (ownerId === 'local-user') {
    const legacyRaw = localStorage.getItem(LEGACY_KEY);
    if (legacyRaw) {
      const migrated = normalize(ownerId, parseJson<AppData>(legacyRaw));
      localStorage.setItem(ownerKey(ownerId), JSON.stringify(migrated));
      return migrated;
    }
  }

  return { students: [], weeklyPlans: [] };
}

export function saveAppData(ownerId: string, data: AppData) {
  localStorage.setItem(ownerKey(ownerId), JSON.stringify(normalize(ownerId, data)));
}

export function clearAppData(ownerId: string) {
  localStorage.removeItem(ownerKey(ownerId));
}

export function seedDemoData(ownerId: string) {
  // NOTE: デモ用データは ownerId を上書きして保存する
  const data: AppData = {
    students: mockStudents.map((s) => ({ ...s, ownerId })),
    weeklyPlans: mockWeeklyPlans.map((p) => ({ ...p, ownerId })),
  };
  saveAppData(ownerId, data);
  return data;
}
