/**
 * 権限（Permissions）境界。
 * - 現在：単一ユーザー前提なので常に true
 * - 将来：ownerId/role に応じた権限チェックに差し替える
 */

export type PermissionCheck = {
  ownerId: string;
  resourceOwnerId?: string;
};

export function canEdit(_params: PermissionCheck): boolean {
  // TODO(SaaS): RBAC/ABAC を導入する場合はここを差し替える
  return true;
}

