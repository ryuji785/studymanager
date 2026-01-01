// モックデータ
import { Student, WeeklyPlan, WeeklyGoal, ScheduleBlock, SubjectTarget, Reflection } from '../types';

export const mockStudents: Student[] = [
  {
    id: '1',
    ownerId: 'local-user',
    name: '田中 花子',
    grade: '高校2年',
    email: 'hanako@example.com',
    lastUpdated: '2025-12-27'
  },
  {
    id: '2',
    ownerId: 'local-user',
    name: '佐藤 太郎',
    grade: '高校3年',
    email: 'taro@example.com',
    lastUpdated: '2025-12-26'
  },
  {
    id: '3',
    ownerId: 'local-user',
    name: '鈴木 美咲',
    grade: '高校1年',
    email: 'misaki@example.com',
    lastUpdated: '2025-12-28'
  },
  {
    id: '4',
    ownerId: 'local-user',
    name: '高橋 健太',
    grade: '高校2年',
    email: 'kenta@example.com',
    lastUpdated: '2025-12-25'
  }
];

const mockGoals: WeeklyGoal[] = [
  { id: 'g1', text: '英語：Unit 5の単語100個を完全暗記する', completed: false },
  { id: 'g2', text: '数学：二次関数の応用問題を20問解く', completed: true },
  { id: 'g3', text: '毎日7時間以上の睡眠を確保する', completed: false }
];

const mockScheduleBlocks: ScheduleBlock[] = [
  // 月曜日
  { id: 'b1', category: 'sleep', label: '睡眠', dayOfWeek: 0, startTime: 0, duration: 420, status: 'completed', actualDuration: 420 },
  { id: 'b2', category: 'school', label: '登校', dayOfWeek: 0, startTime: 450, duration: 480, status: 'completed' },
  { id: 'b3', category: 'club', label: '部活', dayOfWeek: 0, startTime: 930, duration: 120, status: 'completed' },
  { id: 'b4', category: 'english', label: '英単語', dayOfWeek: 0, startTime: 1140, duration: 60, status: 'completed', actualDuration: 45 },
  { id: 'b5', category: 'math', label: '数学課題', dayOfWeek: 0, startTime: 1200, duration: 90, status: 'incomplete' },
  
  // 火曜日
  { id: 'b6', category: 'sleep', label: '睡眠', dayOfWeek: 1, startTime: 0, duration: 420, status: 'planned' },
  { id: 'b7', category: 'school', label: '登校', dayOfWeek: 1, startTime: 450, duration: 480, status: 'planned' },
  { id: 'b8', category: 'club', label: '部活', dayOfWeek: 1, startTime: 930, duration: 120, status: 'planned' },
  { id: 'b9', category: 'science', label: '理科実験レポート', dayOfWeek: 1, startTime: 1140, duration: 90, status: 'planned' },
  
  // 水曜日
  { id: 'b10', category: 'sleep', label: '睡眠', dayOfWeek: 2, startTime: 0, duration: 420, status: 'planned' },
  { id: 'b11', category: 'school', label: '登校', dayOfWeek: 2, startTime: 450, duration: 480, status: 'planned' },
  { id: 'b12', category: 'english', label: 'リスニング練習', dayOfWeek: 2, startTime: 1080, duration: 60, status: 'planned' },
  { id: 'b13', category: 'japanese', label: '古文読解', dayOfWeek: 2, startTime: 1140, duration: 90, status: 'planned' },
  
  // 土曜日
  { id: 'b14', category: 'sleep', label: '睡眠', dayOfWeek: 5, startTime: 0, duration: 480, status: 'planned' },
  { id: 'b15', category: 'math', label: '数学演習', dayOfWeek: 5, startTime: 600, duration: 180, status: 'planned' },
  { id: 'b16', category: 'english', label: '英語長文', dayOfWeek: 5, startTime: 840, duration: 120, status: 'planned' },
];

const mockSubjectTargets: SubjectTarget[] = [
  { id: 's1', subject: '英語', material: 'Vintage', range: 'Unit 5-7', content: '熟語100個暗記' },
  { id: 's2', subject: '数学', material: 'チャート式', range: 'p.120-145', content: '二次関数応用' },
  { id: 's3', subject: '国語', material: '古文単語帳', range: '1-50', content: '単語暗記' },
  { id: 's4', subject: '理科', material: '物理基礎', range: '第3章', content: '力学演習' },
  { id: 's5', subject: '社会', material: '世界史B', range: '近代ヨーロッパ', content: 'ノートまとめ' },
  { id: 's6', subject: '', material: '', range: '', content: '' },
  { id: 's7', subject: '', material: '', range: '', content: '' },
  { id: 's8', subject: '', material: '', range: '', content: '' }
];

const mockReflection: Reflection = {
  goodPoints: '英単語の学習を毎日継続できた。数学の苦手分野に重点的に取り組めた。',
  challenges: '部活後の疲労で集中力が続かない日があった。睡眠時間が目標より1時間少なかった。',
  nextWeek: '朝の時間を活用して英語のリスニングを追加する。就寝時間を30分早める。'
};

export const mockWeeklyPlans: WeeklyPlan[] = [
  {
    id: 'w1',
    ownerId: 'local-user',
    studentId: '1',
    weekStart: '2025-12-22',
    weekEnd: '2025-12-28',
    goals: mockGoals,
    scheduleBlocks: mockScheduleBlocks,
    subjectTargets: mockSubjectTargets,
    reflection: mockReflection,
    isPublished: true,
    lastUpdated: '2025-12-27T10:30:00'
  },
  {
    id: 'w2',
    ownerId: 'local-user',
    studentId: '1',
    weekStart: '2025-12-15',
    weekEnd: '2025-12-21',
    goals: [
      { id: 'g4', text: '数学：ベクトルの基本問題をマスターする', completed: true },
      { id: 'g5', text: '英語：長文読解を毎日1題解く', completed: true },
    ],
    scheduleBlocks: [],
    subjectTargets: [],
    reflection: {
      goodPoints: '計画通りに学習できた週だった。',
      challenges: '週末の時間管理が課題。',
      nextWeek: '週末の予定を事前に立てる。'
    },
    isPublished: true,
    lastUpdated: '2025-12-21T18:00:00'
  }
];

// ヘルパー関数
export function getStudentById(id: string): Student | undefined {
  return mockStudents.find(s => s.id === id);
}

export function getWeeklyPlansByStudentId(studentId: string): WeeklyPlan[] {
  return mockWeeklyPlans.filter(p => p.studentId === studentId);
}

export function getCurrentWeeklyPlan(studentId: string): WeeklyPlan | undefined {
  const plans = getWeeklyPlansByStudentId(studentId);
  return plans.length > 0 ? plans[0] : undefined;
}
