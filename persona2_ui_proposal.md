---
description: ペルソナ2のUI改善提案
---
# ペルソナ2のプロファイル

**ターゲット像：「戦略的・逆算型の資格チャレンジャー」**

*   **人物像:** 28歳、働きながら難関資格（例：国家資格キャリアコンサルタントなど）の取得を目指す。
*   **明確なゴール:** 「〇月〇日の試験に合格する（目標学習時間：計150時間）」など、期限と定量的な目標が明確。
*   **課題・悩み:**
    *   順調に学習時間を確保できているか、試験日に間に合うか不安。
    *   長丁場の試験勉強において、中だるみしやすい。
    *   「今日は何をしようか」と迷う時間をなくし、戦略的な学習計画（マイルストーン）に沿って淡々と進めたい。

---

# UI改善提案（ペルソナ2向け）

ペルソナ2が抱える「現在地とゴールの可視化」「逆算によるペースメイク」の課題を解決するためのUI改修案です。

## 1. ゴールダッシュボード（HomePage）

ホーム画面の最上部に、試験本番までの戦略的ダッシュボードを追加し、日々のモチベーションを高めます。

*   **カウントダウン:** 試験までの残り日数を強調表示。
*   **進捗プログレスバー:** 目標総学習時間に対する、現在の累積学習時間をプログレスバーで視覚化。
*   **動的ペースアドバイス:** 残り日数と残り時間から、「目標達成には、今日から1日〇時間の学習が必要です」と自動計算して提示。

```tsx
// HomePage.tsx への追加コンポーネント例
import { Target, TrendingUp } from 'lucide-react';

const GoalDashboard = () => {
  // 仮のデータ
  const examDate = new Date('2026-10-18');
  const today = new Date();
  const daysLeft = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
  const targetHours = 150;
  const currentHours = 45.5;
  const progressPercent = Math.round((currentHours / targetHours) * 100);
  const requiredHoursPerDay = ((targetHours - currentHours) / daysLeft).toFixed(1);

  return (
    <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 rounded-3xl p-6 text-white shadow-lg mb-6 relative overflow-hidden">
      {/* 装飾 */}
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Target size={120} />
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-indigo-200 text-sm font-medium mb-1">キャリアコンサルタント試験まで</p>
            <h2 className="text-3xl font-extrabold">あと <span className="text-4xl text-amber-400">{daysLeft}</span> 日</h2>
          </div>
        </div>

        {/* 進捗バー */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-indigo-100">学習時間目標: {targetHours}h</span>
            <span className="font-bold">{currentHours}h / {progressPercent}%</span>
          </div>
          <div className="w-full bg-indigo-950/50 rounded-full h-3">
            <div
              className="bg-amber-400 h-3 rounded-full transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* ペースアドバイス */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 flex items-center gap-3">
          <div className="bg-amber-400/20 p-2 rounded-lg text-amber-300">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-xs text-indigo-200">目標達成に必要なペース</p>
            <p className="text-sm font-bold">今日から1日 <span className="text-amber-400 text-lg">{requiredHoursPerDay}</span> 時間の確保が必要です</p>
          </div>
        </div>
      </div>
    </div>
  );
};
```

## 2. 教材ごとの「進捗率」と「期限」の可視化（MaterialsPage）

単なる「周回数」だけでなく、具体的な進捗度合い（パーセンテージ）や、その教材をいつまでに終わらせるかの期限をカードに紐づけます。

*   **プログレスリング/バー:** カード内に進捗を示すUIを追加。
*   **期限アラート:** 期限が近い、あるいは遅れている教材を視覚的に強調（例：赤文字やボーダー）。

```tsx
// MaterialsPage.tsx のBookCardコンポーネント改修例
import { Book, MoreHorizontal, Clock } from 'lucide-react';

const BookCard = ({ book }) => {
  // 仮の進捗データと期限データ
  const isCompleted = book.status === 'completed';
  const progressPercent = book.progress || 65; // 例: 65%完了
  const deadline = book.deadline; // 例: '2026-08-31'
  const isWarning = true; // 期限が近くて進捗が遅れているかの判定ロジック結果

  return (
    <button
      onClick={() => {}}
      className={`rounded-2xl p-4 shadow-sm flex flex-col aspect-[3/4] relative overflow-hidden text-left transition-transform hover:scale-[1.01] ${
        isWarning && !isCompleted ? 'bg-rose-50 border-2 border-rose-300' : 
        isCompleted ? 'bg-amber-50 border border-amber-200' : 'bg-white border border-slate-100'
      }`}
    >
      <div className={`absolute top-0 left-0 w-full h-2 ${isWarning && !isCompleted ? 'bg-rose-500' : isCompleted ? 'bg-amber-300' : book.color.split(' ')[0]}`}></div>
      <span className="absolute top-2.5 right-2.5 h-7 w-7 rounded-full bg-white/80 border border-slate-200 text-slate-400 flex items-center justify-center">
        <MoreHorizontal size={14} />
      </span>
      
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${isCompleted ? 'bg-amber-200 text-amber-800' : 'bg-indigo-100 text-indigo-700'}`}>
        <Book size={20} />
      </div>
      
      <h3 className="font-bold text-slate-800 text-sm leading-tight mb-2 line-clamp-3 pr-2">{book.title}</h3>
      
      <div className="mt-auto space-y-2 pr-2">
        {/* 進捗バー */}
        {!isCompleted && (
          <div className="w-full">
            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
              <span>進捗</span>
              <span className="font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${isWarning ? 'bg-rose-500' : 'bg-indigo-500'}`}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* 期限表示 */}
        {deadline && !isCompleted && (
           <div className={`flex items-center gap-1 text-[11px] font-semibold ${isWarning ? 'text-rose-600' : 'text-slate-500'}`}>
             <Clock size={12} />
             <span>期限: {deadline}</span>
           </div>
        )}
        
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
            {book.category || 'その他'}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            isCompleted ? 'bg-amber-200 text-amber-800' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
          }`}>
            {isCompleted ? '殿堂入り' : `${book.lap}周目`}
          </span>
        </div>
      </div>
    </button>
  );
};
```

## 3. 週間ターゲットと「確保済み時間」の可視化（Plan画面のヘッダー部）

「今週は何時間勉強する」という目標に対し、実際にPlan（カレンダー）上に配置したタスクの合計時間を集計し、計画段階での不足分を可視化します。

```tsx
// Plan画面 (StudyAppUI.jsxなど) の週間サマリー部分のコンポーネント例
const WeeklyTargetSummary = ({ tasksInThisWeek }) => {
  // 仮のデータ
  const weeklyTargetHours = 15;
  
  // 今週のタスクの合計時間を計算 (tasksInThisWeekは今週分のタスク配列を想定)
  const scheduledMinutes = tasksInThisWeek.reduce((acc, task) => acc + (Number(task.duration) || 0), 0);
  const scheduledHours = (scheduledMinutes / 60).toFixed(1);
  
  const progressPercent = Math.min(100, Math.round((scheduledHours / weeklyTargetHours) * 100));
  const isShortage = scheduledHours < weeklyTargetHours;

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-bold text-slate-800">今週の学習スケジュール状況</h3>
        <span className={`text-xs font-bold px-2 py-1 rounded-md ${isShortage ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
          {isShortage ? '予定不足' : '目標達成ペース'}
        </span>
      </div>
      
      <div className="flex items-end gap-2 mb-2">
        <span className="text-2xl font-extrabold text-slate-800">{scheduledHours}h</span>
        <span className="text-sm text-slate-400 font-medium mb-1">/ 目標 {weeklyTargetHours}h</span>
      </div>

      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${isShortage ? 'bg-indigo-400' : 'bg-emerald-500'}`}
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>
      
      {isShortage && (
        <p className="text-[11px] text-slate-500 mt-2">
          目標まであと <span className="font-bold text-indigo-600">{(weeklyTargetHours - scheduledHours).toFixed(1)}h</span> 分の予定をカレンダーに確保しましょう。
        </p>
      )}
    </div>
  );
};
```
