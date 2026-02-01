# Google OAuth 2.0 設定手順（Authorization Code Flow）

1. Google Cloud Console でプロジェクトを作成する。
2. 「API とサービス」→「OAuth 同意画面」でアプリ情報を登録する。
3. 「認証情報」→「認証情報を作成」→「OAuth クライアント ID」を選択する。
4. アプリケーションの種類は「ウェブアプリケーション」を選択する。
5. 承認済みの JavaScript 生成元に `http://localhost:5173`（本番はフロントのオリジン）を追加する。
6. 承認済みのリダイレクト URI に `http://localhost:4000/auth/google/callback`（本番は API のコールバック URL）を追加する。
7. 発行されたクライアント ID / クライアントシークレットを `.env` に設定する。

## 認証フロー（テキスト図）

```text
[Browser] --(1) GET /auth/google----------------------> [Express]
   |                                                     |
   |     (2) 302 Redirect (Google OAuth + state)        |
   v                                                     |
[Google OAuth] --(3) Login/Consent--------------------> |
   |                                                     |
   |     (4) Redirect /auth/google/callback?code&state  |
   v                                                     |
[Express] --(5) code -> token, userinfo取得------------> [Google APIs]
   |                                                     |
   |     (6) セッション保存 + HTTP Only Cookie付与       |
   v                                                     |
[Browser] --(7) GET /auth/me (Cookie)-----------------> [Express]
   |                                                     |
   |     (8) user JSON                                   |
   v                                                     |
[React] (9) 認証済みUI描画
```
