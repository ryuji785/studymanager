import React, { useState } from 'react';
import { Target, BookOpen, PartyPopper, ChevronRight, Plus, X } from 'lucide-react';
import { useGoalStore } from '../stores/useGoalStore';
import { useBookStore } from '../stores/useBookStore';
import { BOOK_CATEGORIES, BOOK_COLOR_PALETTE } from '../constants';

interface WizardGoal {
  title: string;
  examDate: string;
  targetHours: number;
  weekdayHoursTarget: number;
  weekendHoursTarget: number;
}

interface WizardBook {
  title: string;
  category: string;
  colorKey: string;
}

const STEPS = [
  { icon: Target, label: '目標設定', color: 'text-indigo-600' },
  { icon: BookOpen, label: '教材登録', color: 'text-emerald-600' },
  { icon: PartyPopper, label: '完了！', color: 'text-amber-500' },
];

export default function SetupWizardPage({ onComplete }: { onComplete: () => void }) {
  const addGoal = useGoalStore((s) => s.addGoal);
  const addBook = useBookStore((s) => s.addBook);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1: Goal
  const [goal, setGoal] = useState<WizardGoal>({
    title: '', examDate: '', targetHours: 150,
    weekdayHoursTarget: 1.5, weekendHoursTarget: 3.0,
  });

  // Step 2: Books
  const [books, setBooks] = useState<WizardBook[]>([{ title: '', category: 'その他', colorKey: 'blue' }]);

  const canProceedStep0 = goal.title.trim() !== '' && goal.examDate !== '';
  const canProceedStep1 = books.some((b) => b.title.trim() !== '');

  async function handleFinish() {
    setSaving(true);
    try {
      await addGoal({ ...goal, isActive: true });
      for (const b of books) {
        if (b.title.trim()) {
          await addBook(b.title.trim(), b.category, b.colorKey);
        }
      }
      onComplete();
    } catch (e) {
      console.error('Setup error:', e);
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">はじめましょう 🎉</h1>
          <p className="text-sm text-slate-500">かんたんな初期設定で、すぐに学習をスタートできます</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={i}>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${i === step ? 'bg-white shadow-md scale-105 ' + s.color
                  : i < step ? 'bg-white/60 text-slate-400 line-through'
                    : 'text-slate-300'
                }`}>
                <s.icon size={14} />
                {s.label}
              </div>
              {i < STEPS.length - 1 && <div className={`w-6 h-0.5 rounded ${i < step ? 'bg-indigo-300' : 'bg-slate-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8">

          {/* Step 0: Goal */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
                  <Target size={20} className="text-indigo-500" /> 目標を設定
                </h2>
                <p className="text-xs text-slate-400">何の試験に向けて勉強しますか？</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">試験名 <span className="text-rose-400">*</span></label>
                <input
                  type="text" placeholder="例: 国家資格キャリアコンサルタント試験"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
                  value={goal.title}
                  onChange={(e) => setGoal({ ...goal, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">試験日 <span className="text-rose-400">*</span></label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
                  value={goal.examDate}
                  onChange={(e) => setGoal({ ...goal, examDate: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">目標時間(h)</label>
                  <input type="number" min={1}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
                    value={goal.targetHours}
                    onChange={(e) => setGoal({ ...goal, targetHours: Number(e.target.value) || 150 })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">平日(h/日)</label>
                  <input type="number" min={0} step={0.5}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
                    value={goal.weekdayHoursTarget}
                    onChange={(e) => setGoal({ ...goal, weekdayHoursTarget: Number(e.target.value) || 1.5 })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">休日(h/日)</label>
                  <input type="number" min={0} step={0.5}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
                    value={goal.weekendHoursTarget}
                    onChange={(e) => setGoal({ ...goal, weekendHoursTarget: Number(e.target.value) || 3.0 })}
                  />
                </div>
              </div>

              <button
                disabled={!canProceedStep0}
                onClick={() => setStep(1)}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all ${canProceedStep0
                    ? 'bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 active:scale-[0.98]'
                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  }`}
              >
                次へ <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Step 1: Books */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
                  <BookOpen size={20} className="text-emerald-500" /> 教材を登録
                </h2>
                <p className="text-xs text-slate-400">使っている教材を1冊以上登録してください</p>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {books.map((book, i) => (
                  <div key={i} className="flex items-start gap-2 bg-slate-50 rounded-2xl p-3 border border-slate-100">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text" placeholder="教材名"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition"
                        value={book.title}
                        onChange={(e) => { const nb = [...books]; nb[i] = { ...nb[i], title: e.target.value }; setBooks(nb); }}
                      />
                      <div className="flex gap-2">
                        <select
                          className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-300 transition"
                          value={book.category}
                          onChange={(e) => { const nb = [...books]; nb[i] = { ...nb[i], category: e.target.value }; setBooks(nb); }}
                        >
                          {BOOK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <div className="flex gap-1">
                          {BOOK_COLOR_PALETTE.map((p) => (
                            <button key={p.key}
                              onClick={() => { const nb = [...books]; nb[i] = { ...nb[i], colorKey: p.key }; setBooks(nb); }}
                              className={`w-6 h-6 rounded-full border-2 transition ${book.colorKey === p.key ? 'border-slate-400 scale-110' : 'border-transparent'
                                } ${p.card.split(' ')[0]}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    {books.length > 1 && (
                      <button onClick={() => setBooks(books.filter((_, j) => j !== i))} className="p-1 text-slate-300 hover:text-rose-400 transition mt-1">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => setBooks([...books, { title: '', category: 'その他', colorKey: BOOK_COLOR_PALETTE[books.length % BOOK_COLOR_PALETTE.length].key }])}
                className="w-full flex items-center justify-center gap-1 py-2 rounded-xl border-2 border-dashed border-slate-200 text-sm text-slate-400 font-medium hover:border-emerald-300 hover:text-emerald-600 transition"
              >
                <Plus size={14} /> 教材を追加
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
                >
                  戻る
                </button>
                <button
                  disabled={!canProceedStep1}
                  onClick={() => setStep(2)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all ${canProceedStep1
                      ? 'bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 active:scale-[0.98]'
                      : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                    }`}
                >
                  次へ <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Complete */}
          {step === 2 && (
            <div className="text-center space-y-6 py-4">
              <div className="text-6xl">🎉</div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">準備完了！</h2>
                <p className="text-sm text-slate-500">
                  目標「<span className="font-semibold text-indigo-600">{goal.title}</span>」と
                  <span className="font-semibold text-emerald-600">{books.filter(b => b.title.trim()).length}冊</span>の教材が登録されます
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-3">
                <div className="flex items-center gap-3">
                  <Target size={16} className="text-indigo-500" />
                  <div className="text-sm">
                    <span className="font-bold text-slate-700">{goal.title}</span>
                    <span className="text-slate-400 ml-2">{goal.examDate}</span>
                  </div>
                </div>
                {books.filter(b => b.title.trim()).map((b, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <BookOpen size={16} className="text-emerald-500" />
                    <div className="text-sm">
                      <span className="font-bold text-slate-700">{b.title}</span>
                      <span className="text-slate-400 ml-2">{b.category}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
                >
                  戻る
                </button>
                <button
                  disabled={saving}
                  onClick={handleFinish}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold bg-gradient-to-r from-indigo-600 to-emerald-500 text-white shadow-lg hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {saving ? '保存中...' : '🚀 学習を始める！'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">設定はあとから変更できます</p>
      </div>
    </div>
  );
}
