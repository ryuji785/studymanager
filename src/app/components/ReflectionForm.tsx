import React from 'react';
import { Reflection } from '../types';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Edit2 } from 'lucide-react';

interface ReflectionFormProps {
  reflection: Reflection;
  editable?: boolean;
  onReflectionChange?: (field: keyof Reflection, value: string) => void;
}

export function ReflectionForm({ reflection, editable = false, onReflectionChange }: ReflectionFormProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-[var(--app-card-padding)]">
      <div className="border-b border-gray-300 pb-2 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg tracking-wide text-gray-800">振り返り</h2>
          {editable && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Edit2 className="w-3 h-3" />
              クリックして編集
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="goodPoints" className="text-sm text-gray-700 mb-1.5 block">
            良かった点
          </Label>
          {editable ? (
            <Textarea
              id="goodPoints"
              value={reflection.goodPoints}
              onChange={(e) => onReflectionChange?.('goodPoints', e.target.value)}
              placeholder="今週良かったことを記録しましょう"
              className="min-h-[80px] border-gray-200 resize-none hover:border-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-colors"
            />
          ) : (
            <div className="text-sm text-gray-800 bg-gray-50 p-3 rounded border border-gray-100 min-h-[80px]">
              {reflection.goodPoints || '（未記入）'}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="challenges" className="text-sm text-gray-700 mb-1.5 block">
            課題・改善点
          </Label>
          {editable ? (
            <Textarea
              id="challenges"
              value={reflection.challenges}
              onChange={(e) => onReflectionChange?.('challenges', e.target.value)}
              placeholder="今週の課題や改善したい点を記録しましょう"
              className="min-h-[80px] border-gray-200 resize-none hover:border-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-colors"
            />
          ) : (
            <div className="text-sm text-gray-800 bg-gray-50 p-3 rounded border border-gray-100 min-h-[80px]">
              {reflection.challenges || '（未記入）'}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="nextWeek" className="text-sm text-gray-700 mb-1.5 block">
            次週に活かす
          </Label>
          {editable ? (
            <Textarea
              id="nextWeek"
              value={reflection.nextWeek}
              onChange={(e) => onReflectionChange?.('nextWeek', e.target.value)}
              placeholder="次週の改善アクションを記録しましょう"
              className="min-h-[80px] border-gray-200 resize-none hover:border-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-colors"
            />
          ) : (
            <div className="text-sm text-gray-800 bg-gray-50 p-3 rounded border border-gray-100 min-h-[80px]">
              {reflection.nextWeek || '（未記入）'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
