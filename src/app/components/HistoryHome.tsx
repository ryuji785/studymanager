import React, { useMemo, useState } from 'react';
import { ArrowRight, Search, Users } from 'lucide-react';

import type { Student } from '../types';
import { AppChrome } from './layout/AppChrome';
import { PeriodSelector, type PeriodValue } from './ui/period-selector';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { StateCard } from './states/StateCard';

export function HistoryHome({
  students,
  selectedStudentId,
  onSelectStudentId,
  period,
  onChangePeriod,
  onOpenHistory,
  onGoStudents,
}: {
  students: Student[];
  selectedStudentId: string | null;
  onSelectStudentId: (studentId: string | null) => void;
  period: PeriodValue;
  onChangePeriod: (next: PeriodValue) => void;
  onOpenHistory: () => void;
  onGoStudents: () => void;
}) {
  const [query, setQuery] = useState('');

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.grade.toLowerCase().includes(q),
    );
  }, [query, students]);

  const selectedStudent = useMemo(
    () => (selectedStudentId ? students.find((s) => s.id === selectedStudentId) ?? null : null),
    [selectedStudentId, students],
  );

  if (students.length === 0) {
    return (
      <AppChrome title="学習履歴">
        <div className="max-w-3xl mx-auto">
          <StateCard
            tone="neutral"
            icon={<Users className="w-7 h-7" />}
            title="生徒がまだ登録されていません"
            description="先に生徒を追加すると、期間別の学習履歴を確認できます。"
            actions={[{ label: '生徒一覧へ', onClick: onGoStudents }]}
          />
        </div>
      </AppChrome>
    );
  }

  return (
    <AppChrome
      title="学習履歴"
      subHeader={<p className="text-sm text-gray-600">期間と生徒を選択して、学習状況を確認します。</p>}
    >
      <div className="max-w-5xl mx-auto space-y-4">
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">期間</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <PeriodSelector value={period} onChange={onChangePeriod} mode="range" />
            <p className="text-xs text-gray-500">開始日〜終了日に重なる週計画を集計します。</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">生徒</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="生徒名 / ID / 学年で検索..."
                className="pl-9 bg-white border-gray-300"
              />
            </div>

            {selectedStudent ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <div className="text-sm text-gray-700">
                  <span className="font-medium">{selectedStudent.name}</span>
                  <span className="text-gray-500 ml-2">（{selectedStudent.grade}）</span>
                </div>
                <Button type="button" variant="outline" className="bg-white" size="sm" onClick={() => onSelectStudentId(null)}>
                  選択を解除
                </Button>
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredStudents.slice(0, 10).map((student) => {
                const isSelected = student.id === selectedStudentId;
                return (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => onSelectStudentId(student.id)}
                    className={`rounded-md border px-3 py-2 text-left hover:bg-gray-50 ${
                      isSelected ? 'border-indigo-200 bg-indigo-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="text-sm text-gray-900 truncate">{student.name}</div>
                    <div className="text-xs text-gray-500">{student.grade}</div>
                  </button>
                );
              })}
            </div>

            {filteredStudents.length === 0 ? (
              <div className="text-sm text-gray-600 rounded-lg border border-dashed border-gray-300 bg-white p-4">
                該当する生徒が見つかりません。
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            onClick={onOpenHistory}
            disabled={!selectedStudentId}
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            履歴を表示
          </Button>
        </div>
      </div>
    </AppChrome>
  );
}

