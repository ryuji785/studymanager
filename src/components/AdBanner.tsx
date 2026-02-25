import React from 'react';
import { useBillingStore } from '../stores/useBillingStore';

interface AdBannerProps {
  /** AdSense ad slot ID (used after approval) */
  slot?: string;
  /** Ad format */
  format?: 'horizontal' | 'rectangle';
}

/**
 * AdSense 広告バナーコンポーネント
 *
 * - Pro プランでは表示しない
 * - Phase 1 ではプレースホルダー表示（AdSense審査完了後に差し替え）
 */
export default function AdBanner({ slot, format = 'horizontal' }: AdBannerProps) {
  const plan = useBillingStore((s) => s.plan);
  const isTrialActive = useBillingStore((s) => s.isTrialActive);

  // Pro plan or active trial → no ads
  if (plan === 'pro' || isTrialActive()) return null;

  return (
    <div className="mt-6 mb-2">
      <div
        className={`mx-auto bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 ${format === 'rectangle'
            ? 'w-full max-w-[336px] aspect-[4/3]'
            : 'w-full h-[72px]'
          }`}
      >
        <div className="text-center">
          <p className="text-[10px] font-medium text-slate-300">広告</p>
          <p className="text-[10px] text-slate-300 mt-0.5">
            Proプランで広告を非表示にできます
          </p>
        </div>
      </div>
    </div>
  );
}
