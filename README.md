
  # 学習管理WebアプリUI

  This is a code bundle for 学習管理WebアプリUI.
  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## アーキテクチャ（プロトタイプ → SaaS）

  このプロジェクトは「まずローカルで速く動かす」ことを優先しつつ、後から **ログイン＋課金付きSaaS** に拡張しやすいように境界を用意しています。

  ### 今どこがプロトタイプか（差し替え対象）

  - 認証（ownerId）: `src/app/runtime/session.ts`
    - 現在は `ownerId = "local-user"` 固定
    - 将来は `auth.user.id`（Supabase Auth）に差し替え
  - 課金: `src/app/runtime/billing.ts`
    - 現在は未課金固定（機能制御はまだ未実装）
    - 将来は Stripe + DB（Supabase）へ
  - 権限: `src/app/runtime/permissions.ts`
    - 現在は常に許可（単一ユーザー想定）
    - 将来は ownerId/role ベースに差し替え
  - 永続化: `src/app/repositories/localStorage/*`
    - 現在は LocalStorage
    - 将来は Supabase 実装に差し替え（stub: `src/app/repositories/supabase/*`）

  ### 推奨ディレクトリ構成（Vite/React前提）

  ```
  src/
    app/
      App.tsx                  # 画面遷移・UI状態（データ取得の詳細はrepo/serviceへ）
      types/                   # ドメインモデル（Student/WeeklyPlan 等）
      components/              # UIコンポーネント（極力データ取得を知らない）
      services/                # ユースケース/生成ロジック（週計算・週作成・複製など）
      repositories/            # データアクセス境界（interface + 実装）
        localStorage/          # 現在の実装
        supabase/              # 将来の実装（stub）
      runtime/                 # 認証/課金/権限など「外部事情」の境界
      utils/                   # 互換用（段階移行のための再export等）
  ```

  ### 将来拡張シナリオ（想定手順）

  1. Supabase Auth を導入（ログインUI/セッション管理）
  2. `ownerId` を `runtime/session.ts` の固定値から `auth.user.id` に切り替え
  3. Repository を `localStorage/*` → `supabase/*` 実装に差し替え（`createRepositories()` の切替）
  4. ローカルデータ（LocalStorage）をクラウドへ移行（ワンショット）
     - LocalStorageのデータを読み出し → Supabaseへinsert/upsert → 移行完了後にLocalStorageをクリア
  5. Stripe課金を導入し、`runtime/billing.ts` の参照先をDBのsubscription状態へ（機能制御を追加）

  ## 動作確認（週計画レスポンシブ）

  1. `npm run dev` を起動して `http://localhost:5173` を開く
  2. 週計画画面で以下を確認
     - **Mobile (<768px)**: 曜日タブ → カードタップで編集シート、FAB「＋」で追加、完了チェックが即時反映される
     - **Tablet (768–1023px)**: 左タイムラインのタップで追加シートが開く、右側のカードタップで編集できる
     - **Desktop (>=1024px)**: 週グリッドで空き枠クリック → 追加、ブロッククリック → 編集ができる
  
