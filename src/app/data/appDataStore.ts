import { addDays, format, parseISO, startOfWeek } from 'date-fns';

import type {
  AppData,
  Category,
  CreditLedgerEntry,
  LifestyleTemplate,
  Material,
  PlanItem,
  PlanItemType,
  PlanWeek,
} from '../types';

const STORAGE_KEY = 'study-manager.appData.v2';
const LEGACY_KEYS = ['study-manager.appData.v1', 'study-manager.appData.v1.local-user'];
const CURRENT_SCHEMA_VERSION = 2;

const DEFAULT_CATEGORY_PALETTE: Array<{ name: string; color: string }> = [
  { name: '英語', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { name: '数学', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { name: '理科', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { name: '国語', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  { name: '社会', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { name: '情報', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { name: 'その他', color: 'bg-slate-50 text-slate-700 border-slate-200' },
];

const UNCATEGORIZED_ID = 'uncategorized';
const UNCATEGORIZED_NAME = '未分類';
const UNCATEGORIZED_COLOR = 'bg-slate-50 text-slate-700 border-slate-200';

function nowIso() {
  return new Date().toISOString();
}

function formatIsoDate(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

function createDefaultCategories(): Category[] {
  const now = nowIso();
  const base = DEFAULT_CATEGORY_PALETTE.map((entry, index) => ({
    id: `cat_${index + 1}`,
    name: entry.name,
    color: entry.color,
    createdAt: now,
  }));
  return [
    ...base,
    {
      id: UNCATEGORIZED_ID,
      name: UNCATEGORIZED_NAME,
      color: UNCATEGORIZED_COLOR,
      createdAt: now,
    },
  ];
}

function ensureUncategorizedCategory(categories: Category[]): Category[] {
  if (categories.some((category) => category.id === UNCATEGORIZED_ID)) {
    return categories;
  }
  return [
    ...categories,
    {
      id: UNCATEGORIZED_ID,
      name: UNCATEGORIZED_NAME,
      color: UNCATEGORIZED_COLOR,
      createdAt: nowIso(),
    },
  ];
}

export function createDefaultLifestyleTemplate(): LifestyleTemplate {
  return {
    weekdaySleep: { startTime: 23 * 60, endTime: 6 * 60 },
    weekendEnabled: false,
    weekendSleep: undefined,
    optionalBlocks: [],
    updatedAt: nowIso(),
  };
}

function normalizeLifestyleTemplate(raw?: LifestyleTemplate): LifestyleTemplate | undefined {
  if (!raw) return undefined;

  const defaultTemplate = createDefaultLifestyleTemplate();
  const optionalBlocks = Array.isArray(raw.optionalBlocks) ? raw.optionalBlocks : [];
  const normalizedBlocks = optionalBlocks.map((block, index) => {
    const days =
      Array.isArray((block as any).daysOfWeek) && (block as any).daysOfWeek.length > 0
        ? (block as any).daysOfWeek
        : typeof (block as any).dayOfWeek === 'number'
          ? [(block as any).dayOfWeek]
          : [0];

    return {
      id: block.id ?? `lb_${Date.now()}_${index}`,
      label: block.label ?? '固定予定',
      daysOfWeek: days,
      startTime: typeof block.startTime === 'number' ? block.startTime : 0,
      duration: typeof block.duration === 'number' ? block.duration : 60,
      categoryId: (block as any).categoryId,
    };
  });

  return {
    weekdaySleep: raw.weekdaySleep ?? defaultTemplate.weekdaySleep,
    weekendEnabled: Boolean(raw.weekendEnabled),
    weekendSleep: raw.weekendSleep,
    optionalBlocks: normalizedBlocks,
    updatedAt: raw.updatedAt ?? nowIso(),
  };
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function normalize(raw: Partial<AppData> | null | undefined): AppData {
  const baseCategories =
    Array.isArray(raw?.categories) && raw?.categories.length > 0 ? raw.categories : createDefaultCategories();
  const categories = ensureUncategorizedCategory(baseCategories);
  const categoryIds = new Set(categories.map((category) => category.id));
  const materials = Array.isArray(raw?.materials)
    ? raw.materials.map((material) =>
        categoryIds.has(material.categoryId)
          ? material
          : { ...material, categoryId: UNCATEGORIZED_ID },
      )
    : [];
  const planWeeks = Array.isArray(raw?.planWeeks)
    ? raw.planWeeks.map((week) => ({
        ...week,
        goals: Array.isArray((week as any).goals) ? (week as any).goals : undefined,
        subjectTargets: Array.isArray((week as any).subjectTargets) ? (week as any).subjectTargets : undefined,
      }))
    : [];
  const planItems = Array.isArray(raw?.planItems)
    ? raw.planItems.map((item) =>
        item.categoryId && !categoryIds.has(item.categoryId)
          ? { ...item, categoryId: UNCATEGORIZED_ID }
          : item,
      )
    : [];
  const creditLedger = Array.isArray(raw?.creditLedger) ? raw.creditLedger : [];
  const lastUsedCategoryId =
    raw?.lastUsedCategoryId && categoryIds.has(raw.lastUsedCategoryId)
      ? raw.lastUsedCategoryId
      : UNCATEGORIZED_ID;

  return {
    schemaVersion: raw?.schemaVersion ?? CURRENT_SCHEMA_VERSION,
    lifestyleTemplate: normalizeLifestyleTemplate(raw?.lifestyleTemplate),
    categories,
    materials,
    planWeeks,
    planItems,
    creditLedger,
    lastUsedCategoryId,
    userName: typeof raw?.userName === 'string' ? raw?.userName : undefined,
    userGoalTitle: typeof raw?.userGoalTitle === 'string' ? raw?.userGoalTitle : undefined,
    userGoalDeadline: typeof raw?.userGoalDeadline === 'string' ? raw?.userGoalDeadline : undefined,
  };
}

function migrateFromLegacy(legacy: any): AppData {
  const categories = createDefaultCategories();
  const categoryNameMap = new Map<string, string>([
    ['english', '英語'],
    ['math', '数学'],
    ['science', '理科'],
    ['japanese', '国語'],
    ['social', '社会'],
    ['club', 'その他'],
    ['school', 'その他'],
    ['sleep', 'その他'],
    ['other', 'その他'],
  ]);
  const categoryIdByName = new Map(categories.map((c) => [c.name, c.id]));

  const weeklyPlans = Array.isArray(legacy?.weeklyPlans) ? legacy.weeklyPlans : [];
  const planWeekMap = new Map<string, PlanWeek>();
  const planItems: PlanItem[] = [];

  weeklyPlans.forEach((plan: any) => {
    const weekStartDate = plan.weekStart ?? formatIsoDate(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const weekStart = startOfWeek(parseISO(weekStartDate), { weekStartsOn: 1 });
    const weekEndDate = plan.weekEnd ?? formatIsoDate(addDays(weekStart, 6));
    const weekId = `week_${weekStartDate.replace(/-/g, '')}`;
    const goals = Array.isArray(plan.goals)
      ? plan.goals.map((goal: any, index: number) => ({
          id: goal.id ?? `goal_${weekId}_${index}`,
          text: goal.text ?? '',
          completed: Boolean(goal.completed),
        }))
      : undefined;
    const subjectTargets = Array.isArray(plan.subjectTargets)
      ? plan.subjectTargets.map((target: any, index: number) => ({
          id: target.id ?? `target_${weekId}_${index}`,
          subject: target.subject ?? '',
          material: target.material ?? '',
          range: target.range ?? '',
          content: target.content ?? '',
        }))
      : undefined;

    if (!planWeekMap.has(weekId)) {
      planWeekMap.set(weekId, {
        id: weekId,
        weekStartDate,
        weekEndDate,
        createdAt: plan.lastUpdated ?? nowIso(),
        updatedAt: plan.lastUpdated ?? nowIso(),
        goals,
        subjectTargets,
      });
    }

    const blocks = Array.isArray(plan.scheduleBlocks) ? plan.scheduleBlocks : [];
    blocks.forEach((block: any, index: number) => {
      const legacyCategory = block.category ?? 'other';
      const mappedName = categoryNameMap.get(legacyCategory) ?? 'その他';
      const categoryId = categoryIdByName.get(mappedName);
      const type: PlanItemType =
        legacyCategory === 'sleep' ? 'lifestyle' : legacyCategory === 'school' || legacyCategory === 'club' ? 'fixed' : 'study';

      planItems.push({
        id: block.id ?? `item_${weekId}_${index}`,
        weekId,
        type,
        dayOfWeek: block.dayOfWeek ?? 0,
        startTime: block.startTime ?? 0,
        duration: block.duration ?? 60,
        categoryId: type === 'study' ? categoryId : undefined,
        materialId: undefined,
        label: block.label,
        status: block.status === 'completed' ? 'done' : 'planned',
        isAutoGenerated: false,
        actualDuration: block.actualDuration,
      });
    });
  });

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    lifestyleTemplate: createDefaultLifestyleTemplate(),
    categories,
    materials: [],
    planWeeks: Array.from(planWeekMap.values()),
    planItems,
    creditLedger: [],
  };
}

function migrate(raw: any): AppData {
  if (!raw) {
    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      lifestyleTemplate: undefined,
      categories: createDefaultCategories(),
      materials: [],
      planWeeks: [],
      planItems: [],
      creditLedger: [],
    };
  }

  if (typeof raw?.schemaVersion === 'number' && raw.schemaVersion >= CURRENT_SCHEMA_VERSION) {
    return normalize(raw as AppData);
  }

  if (raw?.weeklyPlans || raw?.students) {
    return migrateFromLegacy(raw);
  }

  return normalize(raw as AppData);
}

function loadLegacyData(): any | null {
  for (const key of LEGACY_KEYS) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    const parsed = safeJsonParse<any>(raw);
    if (parsed) return parsed;
  }
  return null;
}

export function loadAppData(): AppData {
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? safeJsonParse<any>(raw) : null;
  const migrated = migrate(parsed ?? loadLegacyData());
  saveAppData(migrated);
  return migrated;
}

export function saveAppData(data: AppData) {
  const normalized = normalize(data);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
}

export function seedDemoData(): AppData {
  const categories = createDefaultCategories();
  const now = nowIso();
  const materials: Material[] = [
    { id: 'mat_1', name: '英単語帳', deadline: formatIsoDate(addDays(new Date(), 21)), categoryId: categories[0].id, createdAt: now },
    { id: 'mat_2', name: '数学問題集', deadline: formatIsoDate(addDays(new Date(), 28)), categoryId: categories[1].id, createdAt: now },
  ];

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekStartDate = formatIsoDate(weekStart);
  const weekEndDate = formatIsoDate(addDays(weekStart, 6));
  const weekId = `week_${weekStartDate.replace(/-/g, '')}`;

  const planWeeks: PlanWeek[] = [
    { id: weekId, weekStartDate, weekEndDate, createdAt: now, updatedAt: now },
  ];

  const planItems: PlanItem[] = [
    {
      id: 'item_1',
      weekId,
      type: 'study',
      dayOfWeek: 0,
      startTime: 19 * 60,
      duration: 60,
      categoryId: categories[0].id,
      materialId: materials[0].id,
      label: '英単語',
      status: 'planned',
      isAutoGenerated: false,
    },
    {
      id: 'item_2',
      weekId,
      type: 'study',
      dayOfWeek: 2,
      startTime: 20 * 60,
      duration: 90,
      categoryId: categories[1].id,
      materialId: materials[1].id,
      label: '数学演習',
      status: 'done',
      isAutoGenerated: false,
      actualDuration: 90,
    },
  ];

  const data: AppData = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    lifestyleTemplate: createDefaultLifestyleTemplate(),
    categories,
    materials,
    planWeeks,
    planItems,
    creditLedger: [] as CreditLedgerEntry[],
  };

  saveAppData(data);
  return data;
}

