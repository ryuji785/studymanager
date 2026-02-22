# Gemini への実装依頼プロンプト

以下のプロンプトをGeminiに渡して、UI改善の実装を依頼してください。
プロンプトは3つのフェーズに分けています。一度に全部渡すとコンテキストが溢れる可能性があるため、**Phase 1 → 2 → 3 の順に1つずつ依頼する**ことを推奨します。

---

## Phase 1: データモデル拡張 + ゴールダッシュボード

```
あなたはReact + TypeScript + Zustand + TailwindCSSで構築された学習管理アプリ「StudyManager」の開発者です。
以下の要件に従って、UI改善を実装してください。

## プロジェクト構成

- フロントエンド: React + TypeScript + Vite + TailwindCSS
- 状態管理: Zustand (`src/stores/useTaskStore.ts`, `src/stores/useBookStore.ts`)
- バックエンド: Express + better-sqlite3 (`server/src/db.ts`)
- アイコン: lucide-react
- 型定義: `src/constants/index.ts`
- ページ: `src/pages/HomePage.tsx`, `src/pages/PlanPage.tsx`, `src/pages/MaterialsPage.tsx`, `src/pages/HistoryPage.tsx`

## 現在のデータモデル

### Book型 (src/constants/index.ts)
```ts
export interface Book {
  id: number;
  title: string;
  colorKey: string;
  color: string;
  taskColor: string;
  status: 'active' | 'completed';
  category: string;
  lap: number;
  lastUsed: string;
}
```

### Task型 (src/constants/index.ts)
```ts
export interface Task {
  id: number;
  date: string;        // 'YYYY-MM-DD'
  startMinutes: number;
  duration: number;     // 分単位
  title: string;
  color: string;
  type: 'study' | 'event';
  bookId?: number;
  isCompleted: boolean;
}
```

### DBスキーマ (server/src/db.ts)
- books テーブル: id, user_id, title, color_key, color, task_color, category, lap, status, last_used, created_at, updated_at
- tasks テーブル: id, user_id, book_id, date, start_minutes, duration, title, color, type, is_completed, created_at, updated_at

## 実装してほしいこと

### 1. 「目標（Goal）」のデータモデルを新規追加

以下のGoal型とgoalsテーブルを追加してください。

#### Goal型 (constants/index.ts に追加)
```ts
export interface Goal {
  id: number;
  title: string;              // 例: 'キャリアコンサルタント試験'
  examDate: string;            // 'YYYY-MM-DD' 試験日
  targetHours: number;          // 目標総学習時間（時間単位）
  weekdayHoursTarget: number;   // 平日の1日あたり目標学習時間
  weekendHoursTarget: number;   // 休日の1日あたり目標学習時間
  isActive: boolean;
}
```

#### goalsテーブル (server/src/db.ts に追加)
```sql
CREATE TABLE IF NOT EXISTS goals (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id               TEXT    NOT NULL DEFAULT 'local',
  title                 TEXT    NOT NULL,
  exam_date             TEXT    NOT NULL,
  target_hours          REAL    NOT NULL DEFAULT 150,
  weekday_hours_target  REAL    NOT NULL DEFAULT 1.5,
  weekend_hours_target  REAL    NOT NULL DEFAULT 3.0,
  is_active             INTEGER NOT NULL DEFAULT 1,
  created_at            TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at            TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

#### useGoalStore (src/stores/useGoalStore.ts を新規作成)
- Zustandストアを作成
- goals配列を管理
- addGoal, updateGoal, deleteGoal, setActiveGoal のアクションを定義
- activeGoalを取得するセレクタを提供

#### APIルート (server/src/routes/goals.ts を新規作成)
- GET /api/goals - 全目標取得
- POST /api/goals - 目標追加
- PUT /api/goals/:id - 目標更新
- DELETE /api/goals/:id - 目標削除
- server/src/index.tsにルートを登録

### 2. ゴールダッシュボードをHomePage.tsxに追加

`src/pages/HomePage.tsx` の挨拶テキストの直下（`<h2>今日の自由時間...</h2>` の後）に、GoalDashboardコンポーネントを追加してください。

#### GoalDashboard コンポーネントの仕様
- useGoalStoreからアクティブな目標を取得
- useTaskStoreからtasksを取得し、type === 'study' かつ isCompleted === true のタスクのdurationを合計して累積学習時間を算出
- 以下を表示:
  1. **試験名とカウントダウン**: 「{目標名}まで あと {残り日数} 日」
  2. **進捗プログレスバー**: 累積学習時間 / 目標時間 をプログレスバーで表示
  3. **動的ペースアドバイス**: 残り日数と曜日別目標から、現在のペースが目標に十分かどうかを判定し、メッセージを表示
     - 例: 「目標達成には、平日1.5h / 休日3.0hのペースが必要です」
     - ペースが遅れている場合: 警告色（オレンジ系）で「⚠ 遅れ気味です。ペースを上げましょう」

#### デザイン要件
- グラデーション背景: `bg-gradient-to-br from-indigo-900 to-indigo-700`
- テキスト: 白（text-white）
- プログレスバー: amber-400
- 角丸: `rounded-3xl`
- lucide-reactから Target, TrendingUp アイコンを使用
- 目標が未設定の場合は「目標を設定しましょう」というCTA（Call To Action）ボタンを表示し、目標設定モーダルを開く

#### 目標設定モーダル
- 目標名（テキスト入力）
- 試験日（日付ピッカー）
- 目標総学習時間（数値入力、単位: 時間）
- 平日の１日目標（数値入力、単位: 時間）
- 休日の１日目標（数値入力、単位: 時間）
- 保存 / キャンセルボタン
- 既存のモーダル（AddBookModalなど）のデザインに合わせた統一的なスタイル

## 注意事項
- 既存のコードスタイル（Tailwind CSSクラスの書き方、コンポーネント構造）を踏襲してください
- 既存の機能は一切壊さないでください
- 日本語UIを維持してください
```

---

## Phase 2: 週間ターゲットゲージ（Plan画面）

```
StudyManagerアプリの改善を続けます。Phase 1で追加したGoalデータモデル（useGoalStore）を活用して、Plan画面に「週間ターゲットゲージ」を追加してください。

## 現在のPlan画面の構造
- ファイル: `src/pages/PlanPage.tsx`
- 週単位のタイムライン表示（月〜日）
- 上部に週の日付セレクタ、下部にタスクブロックのタイムライン

## 実装してほしいこと

### WeeklyTargetSummary コンポーネント

Plan画面の日付セレクタとタイムラインの間に挿入してください。

#### 仕様
- useGoalStoreからアクティブな目標を取得
- useTaskStoreからtasksを取得し、現在表示中の週のタスク（type === 'study'）のdurationを合計
- 以下を表示:
  1. **ヘッダー**: 「今週の学習スケジュール状況」
  2. **ステータスバッジ**: 予定充足 or 予定不足（色で区別）
  3. **時間表示**: 「{確保済み時間}h / 目標 {週間目標}h」
  4. **プログレスバー**: 確保済み / 目標 の比率
  5. **不足メッセージ（条件付き）**: 「目標まであと {不足時間}h 分の予定をカレンダーに確保しましょう。」

#### 週間目標時間の計算ロジック
```
weeklyTarget = (goal.weekdayHoursTarget × 5) + (goal.weekendHoursTarget × 2)
```

#### デザイン要件
- 白背景、`rounded-2xl`、`border border-slate-200`、`shadow-sm`
- 目標達成ペース: emerald系の色
- 予定不足: rose系のバッジ + indigo系のプログレスバー
- 既存のPlan画面のデザインに馴染むスタイル

## 注意事項
- PlanPage.tsxの既存のタイムラインUIは変更しないでください
- 目標が未設定の場合はこのコンポーネントを非表示にしてください
```

---

## Phase 3: 教材の進捗率・期限アラート（MaterialsPage）

```
StudyManagerアプリの改善を続けます。MaterialsPage（本棚ページ）の教材カードに「進捗率」と「期限」の情報を追加してください。

## 現在のBook型
```ts
export interface Book {
  id: number;
  title: string;
  colorKey: string;
  color: string;
  taskColor: string;
  status: 'active' | 'completed';
  category: string;
  lap: number;
  lastUsed: string;
}
```

## 実装してほしいこと

### 1. Book型の拡張 (constants/index.ts)

以下のフィールドを追加:
```ts
export interface Book {
  // ... 既存フィールド
  totalPages?: number;       // 教材の全ページ数
  completedPages?: number;   // 完了済みページ数
  deadline?: string;         // 'YYYY-MM-DD' この教材を終わらせる目標期限
}
```

### 2. booksテーブルの拡張 (server/src/db.ts)

以下のカラムを追加（ALTER TABLE、または既存のCREATE TABLE文を修正）:
```sql
total_pages     INTEGER DEFAULT NULL,
completed_pages INTEGER NOT NULL DEFAULT 0,
deadline        TEXT    DEFAULT NULL
```

### 3. useBookStoreの拡張 (src/stores/useBookStore.ts)

- updateBookProgress(id, completedPages) アクションを追加
- addBookの引数にtotalPages, deadline を追加

### 4. MaterialsPage.tsxのカード表示を改修

#### カード表示（カードビュー・リストビュー両方）に以下を追加:

##### 進捗バー
- `totalPages`が設定されている教材のみ表示
- `completedPages / totalPages` のパーセンテージをプログレスバーで表示
- 通常: indigo-500のバー
- 期限遅れ: rose-500のバー

##### 期限表示
- `deadline`が設定されている教材のみ表示
- Clock アイコン + 「期限: YYYY-MM-DD」
- 期限アラート判定ロジック:
  - 期限まで7日以内 かつ 進捗50%未満 → 警告（赤枠、赤文字）
  - 期限超過 → 警告（赤枠、赤文字）
  - それ以外 → 通常表示

##### カード全体のスタイル変更（警告時）
- ボーダー: `border-2 border-rose-300`
- 背景: `bg-rose-50`
- 上部カラーバー: `bg-rose-500`

### 5. 教材追加モーダル・詳細モーダルの拡張

#### 追加モーダル（Add Book Modal）に追加する入力欄:
- 全ページ数（任意、数値入力）
- 目標期限（任意、日付入力）

#### 詳細モーダル（Book Detail Modal）に追加する入力欄:
- 全ページ数（数値入力）
- 完了済みページ数（数値入力、+/- ボタン付き）
- 目標期限（日付入力）
- 進捗プログレスバー（表示専用）

### デザイン要件
- 既存のカードデザイン（rounded-2xl、shadow-sm、aspect-[3/4]）を維持
- 進捗バーは高さ1.5のミニバー（h-1.5）
- 期限テキストはtext-[11px]
- 既存のモーダルUIのスタイル（ラベルのtext-xs text-slate-500 font-bold、入力欄のrounded-xl border border-slate-200）を踏襲

## 注意事項
- 既存のカテゴリフィルタ・ソート機能は壊さないでください
- totalPagesやdeadlineが未設定の教材は、従来通りの表示のままにしてください
- 殿堂入り（completed）の教材には進捗バー・期限を表示しないでください
```

---

## 補足: 全フェーズ共通の注意事項

```
## プロジェクト全体の技術スタック

- React 18+ / TypeScript
- Vite（ビルドツール）
- TailwindCSS（スタイリング）
- Zustand（状態管理、src/stores/配下）
- lucide-react（アイコン）
- motion/react（アニメーション、一部で使用）
- Express + better-sqlite3（バックエンドAPI、server/配下）

## コーディング規約

- コンポーネントは関数コンポーネント + hooks で実装
- ファイル名: PascalCase（ページ）、camelCase（ストア、ユーティリティ）
- UIテキストは全て日本語
- TailwindCSSのクラス名は既存コードのスタイルに合わせる（例: rounded-2xl, rounded-3xl, text-slate-xxx, shadow-sm）
- モーダルのオーバーレイは `bg-slate-900/40 backdrop-blur-sm`
- アニメーション用CSSクラス: `animate-fade-in`（既存定義済み）
```
