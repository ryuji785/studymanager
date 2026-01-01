import { createLocalStorageRepositories } from './localStorage';
import { Repositories } from './repositoryTypes';

export type { Repositories } from './repositoryTypes';

/**
 * Repositoryの組み立て（DIの起点）。
 * - 現在：LocalStorage
 * - 将来：環境変数やfeature flagで Supabase 実装に切り替える
 */
export function createRepositories(): Repositories {
  return createLocalStorageRepositories();
}
