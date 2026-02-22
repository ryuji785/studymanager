import React from 'react';
import { Settings } from 'lucide-react';

interface HeaderProps {
  title: string;
  showSettings?: boolean;
  onSettingsClick?: () => void;
}

export default function Header({ title, showSettings = true, onSettingsClick }: HeaderProps) {
  return (
    <div className="flex justify-between items-center px-4 sm:px-6 lg:px-8 py-4 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
      <h1 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h1>
      {showSettings && (
        <div className="flex items-center gap-3">
          <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-md">フリープラン</span>
          <button
            onClick={onSettingsClick}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400"
            aria-label="設定を開く"
          >
            <Settings size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
