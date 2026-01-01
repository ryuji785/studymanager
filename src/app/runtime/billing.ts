/**
 * 課金（Billing）境界。
 * - 現在：未課金固定でもOK（UI/機能制御は将来追加）
 * - 将来：Stripe + DB（Supabase）により機能制御を行う
 */

export type BillingState = {
  plan: 'free' | 'pro';
  isActive: boolean;
};

export function getBillingState(_ownerId: string): BillingState {
  // TODO(SaaS): Stripe連携後、DBのsubscription状態を参照して差し替える
  return { plan: 'free', isActive: false };
}

