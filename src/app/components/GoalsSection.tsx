import React from 'react';
import { CheckCircle2, Circle, Edit2, Trash2 } from 'lucide-react';

import type { WeeklyGoal } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';

interface GoalsSectionProps {
  goals: WeeklyGoal[];
  editable?: boolean;
  onGoalChange?: (goalId: string, text: string) => void;
  onGoalToggle?: (goalId: string) => void;
  onGoalAdd?: () => void;
  onGoalDelete?: (goalId: string) => void;
}

export function GoalsSection({
  goals,
  editable = false,
  onGoalChange,
  onGoalToggle,
  onGoalAdd,
  onGoalDelete,
}: GoalsSectionProps) {
  const isEmpty = goals.every((goal) => !goal.text.trim());

  return (
    <Card>
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold text-slate-900">今週の目標</CardTitle>
          {editable && (
            <span className="text-xs text-slate-500 flex items-center gap-2">
              <Edit2 className="w-3 h-3" />
              クリックして編集
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        {editable && isEmpty && onGoalAdd ? (
          <div className="flex items-center justify-between rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            <span>目標を追加して、今週の方針を明確にしましょう。</span>
            <Button variant="outline" size="sm" className="bg-white" onClick={onGoalAdd}>
              ＋ 目標を追加
            </Button>
          </div>
        ) : null}
        {goals.map((goal, index) => (
          <div key={goal.id} className="flex items-start gap-3">
            <div className="flex items-center gap-2 flex-1">
              {editable ? (
                <Checkbox
                  id={`goal-${goal.id}`}
                  checked={goal.completed}
                  onCheckedChange={() => onGoalToggle?.(goal.id)}
                  className="mt-1"
                />
              ) : (
                <div className="mt-1">
                  {goal.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300" />
                  )}
                </div>
              )}

              {editable ? (
                <Input
                  value={goal.text}
                  onChange={(e) => onGoalChange?.(goal.id, e.target.value)}
                  placeholder={`目標${index + 1}`}
                  className="flex-1"
                />
              ) : (
                <p className={`flex-1 ${goal.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                  {goal.text || `（目標${index + 1} 未設定）`}
                </p>
              )}
            </div>
            {editable && onGoalDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-1 text-slate-400 hover:text-slate-600"
                onClick={() => onGoalDelete(goal.id)}
                aria-label="目標を削除"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
