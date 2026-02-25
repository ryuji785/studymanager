import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, BookOpen, LineChart, ArrowRight, Zap, Trophy, Sparkles, Crown, Check } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-200">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/studymanager-icon.png"
              alt="StudyManager icon"
              className="w-8 h-8 rounded-lg shadow-lg shadow-indigo-200"
            />
            <span className="font-bold text-xl tracking-tight text-slate-800">StudyManager</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors hidden sm:block"
            >
              ログイン
            </button>
            <button
              onClick={() => navigate('/login')}
              className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-5 py-2 rounded-full transition-all active:scale-95 shadow-sm"
            >
              無料で始める
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-3xl"></div>
          <div className="absolute top-32 left-1/4 w-[300px] h-[300px] bg-amber-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-xs mb-8"
          >
            <Sparkles size={14} />
            新しい学習体験の始まり
          </motion.div>

          <motion.h1
            {...fadeIn}
            className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6"
          >
            目標達成を、<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              圧倒的にスムーズに。
            </span>
          </motion.h1>

          <motion.p
            {...fadeIn}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            StudyManagerは、参考書の管理から日々の学習計画、<br className="hidden md:block" />
            そして進捗の可視化まで、あなたの学習をトータルでサポートします。
          </motion.p>

          <motion.div
            {...fadeIn}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-lg font-bold px-8 py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all hover:-translate-y-1 active:scale-95 group"
            >
              無料で学習を管理する
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          {/* Hero Image Mockup (Abstract representation) */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-20 relative mx-auto max-w-4xl"
          >
            <div className="aspect-[16/10] bg-white rounded-3xl shadow-2xl border border-slate-200/60 overflow-hidden flex flex-col">
              <div className="h-10 bg-slate-50 border-b border-slate-200/60 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              </div>
              <div className="flex-1 bg-slate-50 p-6 flex flex-col md:flex-row gap-6">
                {/* Mock Sidebar */}
                <div className="w-full md:w-1/4 rounded-xl bg-white shadow-sm border border-slate-100 p-4 flex flex-col gap-3">
                  <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-indigo-50 rounded-lg w-full"></div>
                  <div className="h-8 bg-slate-100 rounded-lg w-full"></div>
                  <div className="h-8 bg-slate-100 rounded-lg w-full"></div>
                </div>
                {/* Mock Main Content */}
                <div className="flex-1 flex flex-col gap-6">
                  <div className="h-24 bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                    <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
                    <div className="flex gap-2">
                      <div className="h-6 bg-indigo-100 rounded w-1/5"></div>
                      <div className="h-6 bg-emerald-100 rounded w-1/5"></div>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-6 flex-1">
                    <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                      <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
                      <div className="space-y-3">
                        <div className="h-10 bg-slate-50 rounded-lg"></div>
                        <div className="h-10 bg-slate-50 rounded-lg"></div>
                        <div className="h-10 bg-slate-50 rounded-lg"></div>
                      </div>
                    </div>
                    <div className="w-full md:w-1/3 bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex items-center justify-center">
                      <div className="h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-indigo-100 border-t-indigo-600 my-auto"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Soft shadow under mockup */}
            <div className="absolute -inset-1 bg-gradient-to-b from-transparent to-slate-50 blur-xl -z-10 translate-y-8"></div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-white relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
              学習を加速させる、<br className="sm:hidden" />3つの強力な機能
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">
              ただ記録するだけではありません。StudyManagerは、あなたが効率よくゴールへ到達するためのツールを揃えています。
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<BookOpen size={28} className="text-indigo-600" />}
              title="参考書の一元管理"
              description="持っている参考書や問題集を登録し、総ページ数や完了したページ数を一目で把握。学習の偏りを防ぎます。"
            />
            <FeatureCard
              icon={<CalendarDays size={28} className="text-violet-600" />}
              title="柔軟な計画と自動計算"
              description="「いつまでに」「どの本を」「どれくらい」やるか設定するだけで、毎週のノルマを自動で算出します。"
            />
            <FeatureCard
              icon={<LineChart size={28} className="text-emerald-600" />}
              title="モチベーションの可視化"
              description="日々の学習記録がグラフとして蓄積。過去の頑張りがひと目でわかり、継続する力に変わります。"
            />
          </div>
        </div>
      </section>

      {/* How it Works / Steps */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
              使い方はとてもシンプル
            </h2>
          </div>

          <div className="space-y-12 relative">
            {/* Connecting Line */}
            <div className="absolute left-[27px] top-6 bottom-6 w-0.5 bg-indigo-100 hidden md:block"></div>

            <Step
              number={1}
              title="目標と参考書を登録する"
              description="まずは、学習したい教材を本棚に追加します。総ページ数を入力するだけで準備完了です。"
            />
            <Step
              number={2}
              title="計画を立てる"
              description="カレンダーを見ながら、どの曜日にどの教材を進めるか配置します。StudyManagerがあなたの代わりに進捗を管理します。"
            />
            <Step
              number={3}
              title="日々記録し、成長を実感する"
              description="勉強が終わったら、進んだページ数を入力。自動で進捗率が計算され、目標達成までの道のりがクリアになります。"
            />
          </div>
        </div>
      </section>

      {/* Value Proposition Banner */}
      <section className="py-12 px-6 bg-indigo-600 text-white">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shrink-0">
              <Sparkles size={24} className="text-amber-300" />
            </div>
            <div>
              <div className="text-xl md:text-2xl font-bold">シンプルで直感的なUI</div>
              <div className="text-indigo-200 text-sm mt-1">迷わず学習に取り組めるデザイン</div>
            </div>
          </div>
          <p className="text-base md:text-lg font-medium max-w-md">使いやすさにこだわったStudyManagerで、あなたの学習をさらに加速させましょう。</p>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-6 bg-white" id="pricing">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
              あなたに合ったプランを
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">
              まずは無料プランで始めて、必要に応じてアップグレードできます。
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Plan */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 flex flex-col">
              <div className="mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-bold mb-3">
                  🆓 Free
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">¥0</span>
                  <span className="text-slate-500 text-sm">/月</span>
                </div>
                <p className="text-sm text-slate-500 mt-2">基本機能で学習管理を始められます</p>
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {[
                  { text: '週計画の作成・閲覧', included: true },
                  { text: '教材の登録（3冊まで）', included: true },
                  { text: '目標の設定（1つまで）', included: true },
                  { text: 'タスクの完了チェック', included: true },
                  { text: '学習履歴（直近7日分）', included: true },
                  { text: '全期間の履歴・詳細分析', included: false },
                  { text: '週計画の自動生成', included: false },
                  { text: '広告非表示', included: false },
                ].map((item, i) => (
                  <li key={i} className={`flex items-center gap-2.5 text-sm ${item.included ? 'text-slate-700' : 'text-slate-400'}`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${item.included ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'}`}>
                      {item.included ? <Check size={12} strokeWidth={3} /> : <span className="text-xs">—</span>}
                    </span>
                    {item.text}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all active:scale-95 text-sm"
              >
                無料で始める
              </button>
            </div>

            {/* Pro Plan */}
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-8 flex flex-col text-white relative overflow-hidden shadow-xl shadow-indigo-200">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Crown size={100} />
              </div>
              <div className="mb-6 relative z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-3 backdrop-blur-sm">
                  ⭐ Pro
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">¥480</span>
                  <span className="text-indigo-200 text-sm">/月</span>
                </div>
                <p className="text-sm text-indigo-200 mt-1">年額 ¥3,980（実質 ¥332/月）</p>
                <p className="text-sm text-indigo-100 mt-2">全機能を使って学習を加速させましょう</p>
              </div>
              <ul className="space-y-3 flex-1 mb-8 relative z-10">
                {[
                  'Freeの全機能',
                  '教材の無制限登録',
                  '複数目標の同時管理',
                  '全期間の学習履歴・グラフ',
                  '時間帯別集中度分析',
                  '週計画の自動生成',
                  '教材進捗レポート',
                  '広告の非表示',
                ].map((text, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-white">
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3.5 bg-white hover:bg-slate-100 text-indigo-700 font-bold rounded-2xl transition-all active:scale-95 text-sm shadow-lg relative z-10"
              >
                30日間無料で試す
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-600/20 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3"></div>
        </div>

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            さあ、計画的な学習を<br className="sm:hidden" />始めましょう
          </h2>
          <p className="text-slate-400 text-lg mb-10">
            Googleアカウントで今すぐ無料で始められます。<br className="hidden sm:block" />複雑な設定は一切ありません。
          </p>
          <button
            onClick={() => navigate('/login')}
            className="flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-900 text-lg font-bold px-10 py-4 rounded-2xl shadow-xl transition-all hover:-translate-y-1 active:scale-95 mx-auto group"
          >
            無料で始める
            <Zap size={20} className="text-amber-500 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 py-12 px-6 border-t border-slate-200 text-center text-sm text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-slate-700">
            <img
              src="/studymanager-icon.png"
              alt="StudyManager icon"
              className="w-4 h-4 rounded"
            />
            StudyManager
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/privacy')} className="hover:text-indigo-600 transition-colors">
              プライバシーポリシー
            </button>
            <span className="text-slate-300">|</span>
            <button onClick={() => navigate('/terms')} className="hover:text-indigo-600 transition-colors">
              利用規約
            </button>
          </div>
          <p>© 2026 StudyManager. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// --- Specific Components ---

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-slate-50 border border-slate-100 p-8 rounded-3xl hover:shadow-xl hover:bg-white transition-all duration-300"
    >
      <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </motion.div>
  );
}

function Step({ number, title, description }: { number: number, title: string, description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="flex gap-6 md:gap-8 items-start relative z-10"
    >
      <div className="w-14 h-14 rounded-full bg-indigo-600 text-white font-bold text-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
        {number}
      </div>
      <div className="pt-3">
        <h3 className="text-2xl font-bold text-slate-900 mb-3">{title}</h3>
        <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">{description}</p>
      </div>
    </motion.div>
  );
}
