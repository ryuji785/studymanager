import React, { useState, useEffect } from 'react';
import { Target, BookOpen, PartyPopper, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { useGoalStore } from '../stores/useGoalStore';
import { useBookStore } from '../stores/useBookStore';
import { BOOK_CATEGORIES, BOOK_COLOR_PALETTE } from '../constants';

const PRESET_EXAMS = [
  { id: 'toeic', title: 'TOEIC L&R 800点', targetHours: 300, icon: '🌍' },
  { id: 'boki', title: '日商簿記2級', targetHours: 250, icon: '📊' },
  { id: 'takken', title: '宅建士（宅地建物取引士）', targetHours: 300, icon: '🏠' },
  { id: 'it', title: 'ITパスポート', targetHours: 100, icon: '💻' },
];

const PRESET_BOOKS = [
  { id: 'b1', title: '公式テキスト・問題集', category: 'テキスト', colorKey: 'blue' },
  { id: 'b2', title: '基礎からわかる 参考書', category: '参考書', colorKey: 'amber' },
  { id: 'b3', title: '一問一答・暗記カード', category: '問題集', colorKey: 'emerald' },
];

// Animations
const slideUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -30 },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
};

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

export default function SetupWizardPage({ onComplete }: { onComplete: () => void }) {
  const { width, height } = useWindowSize();
  const addGoal = useGoalStore((s) => s.addGoal);
  const addBook = useBookStore((s) => s.addBook);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Data State
  const [goal, setGoal] = useState<WizardGoal>({
    title: '', examDate: '', targetHours: 150,
    weekdayHoursTarget: 1.5, weekendHoursTarget: 3.0,
  });
  const [book, setBook] = useState<WizardBook>({ title: '', category: 'その他', colorKey: 'blue' });

  // Real-time AI feedback message based on hours
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (goal.weekdayHoursTarget > 5) {
      setFeedback('平日に5時間以上確保！すごい気合ですね🔥 無理しすぎないようご注意を。');
    } else if (goal.weekdayHoursTarget >= 2) {
      setFeedback('毎日コツコツ進められる素晴らしいペースです✨');
    } else {
      setFeedback('スキマ時間を活かして、着実に進めていきましょう🎵');
    }
  }, [goal.weekdayHoursTarget]);


  async function handleFinish() {
    setSaving(true);
    try {
      await addGoal({ ...goal, isActive: true });
      if (book.title.trim()) {
        await addBook(book.title.trim(), book.category, book.colorKey);
      }
      onComplete();
    } catch (e) {
      console.error('Setup error:', e);
      setSaving(false);
    }
  }

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <motion.div {...slideUp} key="step0" className="space-y-6">
            <div className="text-center space-y-2">
              <span className="text-4xl inline-block mb-2">👋</span>
              <h2 className="text-2xl font-bold text-slate-800">StudyManagerへようこそ！</h2>
              <p className="text-slate-500">まずは、あなたの目標を教えてください。</p>
            </div>

            <div className="space-y-3 mt-8">
              <p className="text-sm font-semibold text-slate-600">人気の資格から選ぶ</p>
              <div className="grid grid-cols-2 gap-3">
                {PRESET_EXAMS.map(exam => (
                  <button
                    key={exam.id}
                    onClick={() => {
                      setGoal({ ...goal, title: exam.title, targetHours: exam.targetHours });
                      setStep(1);
                    }}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group"
                  >
                    <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{exam.icon}</span>
                    <span className="text-sm font-bold text-slate-700 text-center">{exam.title}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
              <div className="relative flex justify-center"><span className="bg-white px-4 text-xs text-slate-400">または自由に入力する</span></div>
            </div>

            <div className="space-y-3">
              <input
                type="text" placeholder="例: オリジナル試験, 英語学習"
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white transition-all shadow-inner"
                value={goal.title}
                onChange={(e) => setGoal({ ...goal, title: e.target.value })}
              />
              <button
                disabled={!goal.title.trim()}
                onClick={() => setStep(1)}
                className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
              >
                次へ <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        );

      case 1:
        return (
          <motion.div {...slideUp} key="step1" className="space-y-6">
            <div className="text-center space-y-2">
              <span className="text-4xl inline-block mb-2">🗓️</span>
              <h2 className="text-2xl font-bold text-slate-800">試験日はいつですか？</h2>
              <p className="text-slate-500">「{goal.title}」のゴールを設定しましょう</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-5">
              <input
                type="date"
                className="w-full px-5 py-4 rounded-2xl bg-white border border-slate-200 text-lg font-bold text-center text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all shadow-sm"
                value={goal.examDate}
                onChange={(e) => setGoal({ ...goal, examDate: e.target.value })}
              />

              {goal.examDate && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center bg-indigo-100 text-indigo-700 py-2 rounded-xl text-sm font-bold">
                  ゴールまで あと {Math.max(0, Math.ceil((new Date(goal.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} 日ですね！
                </motion.div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={() => setStep(0)} className="px-6 py-4 rounded-2xl text-slate-500 font-bold bg-slate-100 hover:bg-slate-200 transition-colors">戻る</button>
              <button
                disabled={!goal.examDate}
                onClick={() => setStep(2)}
                className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
              >
                ペース設定へ <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div {...slideUp} key="step2" className="space-y-6">
            <div className="text-center space-y-2">
              <span className="text-4xl inline-block mb-2">⏱️</span>
              <h2 className="text-2xl font-bold text-slate-800">目標ペースを決めましょう</h2>
              <p className="text-slate-500">無理のない範囲で、日々の学習量を設定します</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-6">

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-bold text-slate-700">全体目標時間</label>
                  <span className="text-sm font-bold text-indigo-600">{goal.targetHours} 時間</span>
                </div>
                <input
                  type="range" min={10} max={1000} step={10}
                  className="w-full accent-indigo-600"
                  value={goal.targetHours}
                  onChange={(e) => setGoal({ ...goal, targetHours: Number(e.target.value) })}
                />
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-bold text-slate-600">平日 (1日あたり)</label>
                    <span className="text-sm font-bold text-indigo-600">{goal.weekdayHoursTarget} 時間</span>
                  </div>
                  <input
                    type="range" min={0} max={12} step={0.5}
                    className="w-full accent-indigo-500"
                    value={goal.weekdayHoursTarget}
                    onChange={(e) => setGoal({ ...goal, weekdayHoursTarget: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-bold text-slate-600">休日 (1日あたり)</label>
                    <span className="text-sm font-bold text-indigo-600">{goal.weekendHoursTarget} 時間</span>
                  </div>
                  <input
                    type="range" min={0} max={15} step={0.5}
                    className="w-full accent-emerald-500"
                    value={goal.weekendHoursTarget}
                    onChange={(e) => setGoal({ ...goal, weekendHoursTarget: Number(e.target.value) })}
                  />
                </div>
              </div>

              <motion.div
                key={feedback}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-indigo-50/80 text-indigo-700 p-3 rounded-xl text-sm font-medium border border-indigo-100 flex items-start gap-2"
              >
                <span>🤖</span>
                <p>{feedback}</p>
              </motion.div>

            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(1)} className="px-6 py-4 rounded-2xl text-slate-500 font-bold bg-slate-100 hover:bg-slate-200 transition-colors">戻る</button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                教材の登録へ <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div {...slideUp} key="step3" className="space-y-6">
            <div className="text-center space-y-2">
              <span className="text-4xl inline-block mb-2">📚</span>
              <h2 className="text-2xl font-bold text-slate-800">使う教材を1冊教えください</h2>
              <p className="text-slate-500">まずは1冊から。（後からいくつでも追加できます）</p>
            </div>

            <div className="space-y-3 mt-4">
              {PRESET_BOOKS.map(b => (
                <button
                  key={b.id}
                  onClick={() => {
                    setBook({ title: b.title, category: b.category, colorKey: b.colorKey });
                    setStep(4);
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-left group"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${BOOK_COLOR_PALETTE.find(p => p.key === b.colorKey)?.card}`}>
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">{b.title}</h3>
                    <p className="text-xs text-slate-400">カテゴリ: {b.category}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
              <div className="relative flex justify-center"><span className="bg-white px-4 text-xs text-slate-400">または自分で入力する</span></div>
            </div>

            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-4">
              <input
                type="text" placeholder="教材名を入力 (任意)"
                className="w-full px-5 py-4 rounded-2xl bg-white border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all shadow-sm"
                value={book.title}
                onChange={(e) => setBook({ ...book, title: e.target.value })}
              />
              <div className="flex gap-2 justify-center">
                {BOOK_COLOR_PALETTE.map((p) => (
                  <button key={p.key}
                    onClick={() => setBook({ ...book, colorKey: p.key })}
                    className={`w-10 h-10 rounded-full border-4 transition-all ${book.colorKey === p.key ? 'border-white shadow-md scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                      } ${p.card.split(' ')[0]}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(2)} className="px-6 py-4 rounded-2xl text-slate-500 font-bold bg-slate-100 hover:bg-slate-200 transition-colors">戻る</button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 py-4 rounded-2xl bg-emerald-600 text-white font-bold shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
              >
                {book.title.trim() ? 'この教材で完了する' : '教材なしでスキップ'} <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div {...slideUp} key="step4" className="text-center space-y-8 py-8">
            <Confetti width={width} height={height} recycle={false} numberOfPieces={500} gravity={0.15} />

            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-200"
            >
              <Check size={48} className="text-white" strokeWidth={3} />
            </motion.div>

            <div>
              <h2 className="text-3xl font-black text-slate-800 mb-3 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-emerald-600">
                準備完了！
              </h2>
              <p className="text-slate-500 font-medium">あなた専用の学習計画が完成しました</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 text-left max-w-sm mx-auto space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center"><Target size={24} /></div>
                <div>
                  <p className="text-xs text-slate-400 font-bold">目標</p>
                  <p className="font-bold text-slate-800">{goal.title}</p>
                </div>
              </div>
              {book.title.trim() && (
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${BOOK_COLOR_PALETTE.find(p => p.key === book.colorKey)?.card}`}><BookOpen size={24} /></div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold">最初の教材</p>
                    <p className="font-bold text-slate-800">{book.title}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 max-w-sm mx-auto">
              <button
                disabled={saving}
                onClick={handleFinish}
                className="w-full py-5 rounded-2xl text-lg font-black bg-slate-900 text-white shadow-2xl hover:bg-slate-800 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {saving ? '保存中...' : 'さあ、学習を始めましょう！🚀'}
              </button>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] relative overflow-hidden flex flex-col justify-center">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/40 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-200/30 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg mx-auto p-4 sm:p-6 relative z-10 min-h-[600px] flex flex-col justify-center">

        {/* Progress Dots */}
        {step < 4 && (
          <div className="flex justify-center gap-2 mb-12">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`h-2 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-indigo-600' :
                i < step ? 'w-2 bg-indigo-300' : 'w-2 bg-slate-200'
                }`} />
            ))}
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white p-6 sm:p-10">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
