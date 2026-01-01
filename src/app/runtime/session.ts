/**
 * 認証（Auth）境界。
 * - 現在：LocalStorageプロトタイプのため固定オーナー
 * - 将来：Supabase Auth の `auth.user.id` 等に差し替える
 */

export type Session = {
  ownerId: string;
  user: { id: string; email?: string } | null;
};

export function getCurrentSession(): Session {
  // TODO(SaaS): Supabase Auth導入後に `auth.user()` を参照して差し替える
  const ownerId = 'local-user';
  return { ownerId, user: { id: ownerId } };
}

