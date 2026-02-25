import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Lock } from 'lucide-react';

interface UpgradePromptProps {
  /** What specific feature or limit is being restricted */
  featureLabel: string;
  /** Optional additional description */
  description?: string;
  /** Render as a compact inline badge instead of full card */
  compact?: boolean;
  /** Render as a blur overlay on top of content */
  overlay?: boolean;
}

export default function UpgradePrompt({
  featureLabel,
  description,
  compact = false,
  overlay = false,
}: UpgradePromptProps) {
  const navigate = useNavigate();

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
        <Crown size={14} />
        <span className="text-xs font-bold">Pro</span>
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-sm">
        <div className="text-center px-6 py-8 max-w-xs">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-200">
            <Lock size={22} />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            {featureLabel}
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            {description || 'Proプランにアップグレードすると利用できます。'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 active:scale-95"
          >
            Proプランを見る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 text-center">
      <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-amber-500 text-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-amber-200">
        <Crown size={20} />
      </div>
      <h3 className="text-sm font-bold text-slate-800 mb-1">{featureLabel}</h3>
      <p className="text-xs text-slate-500 mb-4 max-w-[280px] mx-auto">
        {description || '月額480円のProプランで全機能をご利用いただけます。'}
      </p>
      <button
        onClick={() => navigate('/')}
        className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 active:scale-95 inline-flex items-center gap-2"
      >
        <Crown size={14} />
        Proプランを見る
      </button>
    </div>
  );
}
