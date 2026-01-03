import React, { useState } from 'react';
import { ArrowLeft, Calendar, ChevronDown, ChevronUp, History, Lock } from 'lucide-react';

import { ScheduleBlock, Student, WeeklyPlan } from '../types';
import { GoalsSection } from './GoalsSection';
import { TimeTableGrid } from './TimeTableGrid';
import { SubjectTargets } from './SubjectTargets';
import { ReflectionForm } from './ReflectionForm';
import { Button } from './ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { StateCard } from './states/StateCard';
import { AppChrome } from './layout/AppChrome';
import { formatMinutes } from '../utils/time';

interface StudentWeeklyViewProps {
  student: Student;
  weeklyPlan: WeeklyPlan | null;
  weekLabel: string;
  onViewHistory: () => void;
  onOpenAnalytics?: () => void;
  onBackToTeacher?: () => void;
}

export function StudentWeeklyView({ student, weeklyPlan, weekLabel, onViewHistory, onOpenAnalytics, onBackToTeacher }: StudentWeeklyViewProps) {
  const [targetsOpen, setTargetsOpen] = useState(false);
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [calendarMode, setCalendarMode] = useState<'weekly' | 'daily'>('weekly');

  const DAYS = ['月', '火', '水', '木', '金', '土', '日'];
  const START_MINUTES = 6 * 60;
  const TOTAL_MINUTES = 24 * 60;

  const getDayBlocks = (dayIndex: number) => {
    return weeklyPlan?.scheduleBlocks.filter((block) => block.dayOfWeek === dayIndex) ?? [];
  };

  const roundToStep = (minutes: number, step = 30) => Math.round(minutes / step) * step;

  const getDaySummary = (dayIndex: number) => {
    const blocks = getDayBlocks(dayIndex);
    const fixedMinutes = blocks
      .filter((block) => block.category === 'sleep' || block.category === 'school')
      .reduce((sum, block) => sum + block.duration, 0);
    const studyMinutes = blocks
      .filter((block) => block.category !== 'sleep' && block.category !== 'school')
      .reduce((sum, block) => sum + block.duration, 0);
    const disposableMinutes = Math.max(0, 1440 - fixedMinutes);
    const remainingMinutes = Math.max(0, disposableMinutes - studyMinutes);
    const utilization = disposableMinutes > 0 ? Math.min(1, studyMinutes / disposableMinutes) : 0;
    return {
      fixedMinutes: roundToStep(fixedMinutes),
      studyMinutes: roundToStep(studyMinutes),
      disposableMinutes: roundToStep(disposableMinutes),
      remainingMinutes: roundToStep(remainingMinutes),
      utilization,
    };
  };

  const renderDisposableSummary = (dayIndex: number, className = '') => {
    const summary = getDaySummary(dayIndex);
    const percent = Math.round(summary.utilization * 100);
    const percentClamped = Math.min(100, Math.max(0, percent));

    return (
      <div className={className}>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>可処分時間</span>
          <span className="text-gray-700 font-medium">{formatMinutes(summary.disposableMinutes)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
          <span>固定時間 {formatMinutes(summary.fixedMinutes)}</span>
          <span>学習予定 {formatMinutes(summary.studyMinutes)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
          <span>残り {formatMinutes(summary.remainingMinutes)}</span>
          <span>{percentClamped}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden" aria-hidden="true">
          <div className="h-full bg-indigo-500" style={{ width: `${percentClamped}%` }} />
        </div>
      </div>
    );
  };

  const getSubjectCode = (subject: string) => {
    const s = subject.trim();
    if (!s) return '—';
    if (/(数学|数A|数I|数Ⅱ|数III|Math)/i.test(s)) return '数';
    if (/(英語|英検|English|ENG)/i.test(s)) return '英';
    if (/(国語|現代文|古文|漢文)/i.test(s)) return '国';
    if (/(理科|物理|化学|生物)/i.test(s)) return '理';
    if (/(社会|日本史|世界史|地理|公民)/i.test(s)) return '社';
    return s.slice(0, 2);
  };

  const formatTimeRange = (startTime: number, duration: number) => {
    const normalize = (t: number) => (t >= 1440 ? t - 1440 : t);
    const fmt = (t: number) => {
      const m = normalize(t);
      const h = Math.floor(m / 60) % 24;
      const min = m % 60;
      return `${h}:${String(min).padStart(2, '0')}`;
    };
    const endTime = startTime + duration;
    return `${fmt(startTime)}〜${fmt(endTime)}`;
  };

  const toDisplayStart = (startTime: number) => {
    if (startTime >= 1440) return startTime;
    if (startTime < START_MINUTES) return startTime + 1440;
    return startTime;
  };

  const getDaySegments = (dayIndex: number) => {
    const axisStart = START_MINUTES;
    const axisEnd = START_MINUTES + TOTAL_MINUTES;
    const dayBlocks = getDayBlocks(dayIndex)
      .map((block) => {
        const displayStart = toDisplayStart(block.startTime);
        const displayEnd = displayStart + block.duration;
        const clippedStart = Math.max(displayStart, axisStart);
        const clippedEnd = Math.min(displayEnd, axisEnd);
        if (clippedEnd <= clippedStart) return null;
        return { block, displayStart: clippedStart, displayEnd: clippedEnd };
      })
      .filter((entry): entry is { block: ScheduleBlock; displayStart: number; displayEnd: number } => entry !== null)
      .sort((a, b) => (a.displayStart === b.displayStart ? a.displayEnd - b.displayEnd : a.displayStart - b.displayStart));

    const merged: Array<{ start: number; end: number }> = [];
    dayBlocks.forEach((entry) => {
      const last = merged[merged.length - 1];
      if (!last || entry.displayStart > last.end) {
        merged.push({ start: entry.displayStart, end: entry.displayEnd });
      } else {
        last.end = Math.max(last.end, entry.displayEnd);
      }
    });

    const gaps: Array<{ start: number; duration: number }> = [];
    let cursor = axisStart;
    merged.forEach((interval) => {
      if (interval.start > cursor) {
        gaps.push({ start: cursor, duration: interval.start - cursor });
      }
      cursor = Math.max(cursor, interval.end);
    });
    if (cursor < axisEnd) {
      gaps.push({ start: cursor, duration: axisEnd - cursor });
    }

    const segments = [
      ...dayBlocks.map((entry) => ({ kind: 'block' as const, start: entry.displayStart, block: entry.block })),
      ...gaps.map((gap) => ({ kind: 'gap' as const, start: gap.start, duration: gap.duration })),
    ].sort((a, b) => a.start - b.start);

    return segments;
  };

  const chromeBack = onBackToTeacher ? { label: '週計画に戻る', onClick: onBackToTeacher } : undefined;
  const chromeActions = (
    <>
      {onOpenAnalytics ? (
        <Button variant="outline" size="sm" className="bg-white" onClick={onOpenAnalytics}>
          統計
        </Button>
      ) : null}
      <Button variant="outline" size="sm" className="bg-white" onClick={onViewHistory}>
        <History className="w-4 h-4 mr-2" />
        履歴
      </Button>
    </>
  );
  const chromeSubHeader = (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
      <span className="truncate">{student.name}（{student.grade}）</span>
      <span className="text-gray-500 whitespace-nowrap">{weekLabel}</span>
    </div>
  );

  if (!weeklyPlan) {
    return (
      <AppChrome title="学習計画表（生徒）" back={chromeBack} actions={chromeActions} subHeader={chromeSubHeader}>
        <div className="max-w-3xl mx-auto">
          <StateCard
            tone="neutral"
            icon={<Calendar className="w-7 h-7" />}
            title="この週の計画はまだ作成されていません"
            description={
              <div className="space-y-1">
                <p>閲覧用ページには表示できる計画がありません。</p>
                <p className="text-xs text-gray-500">週：{weekLabel}</p>
              </div>
            }
            actions={[
              ...(onBackToTeacher
                ? [{ label: '講師モードへ戻る', onClick: onBackToTeacher, variant: 'outline' as const, icon: <ArrowLeft className="w-4 h-4" /> }]
                : []),
              { label: '過去の週を見る', onClick: onViewHistory, variant: 'outline' as const, icon: <History className="w-4 h-4" /> },
            ]}
          />
        </div>
      </AppChrome>
    );
  }

  if (!weeklyPlan.isPublished) {
    return (
      <AppChrome title="学習計画表（生徒）" back={chromeBack} actions={chromeActions} subHeader={chromeSubHeader}>
        <div className="max-w-3xl mx-auto">
          <StateCard
            tone="danger"
            icon={<Lock className="w-7 h-7" />}
            title="未公開です"
            description={
              <div className="space-y-1">
                <p>この週の計画はまだ公開されていません。</p>
                <p className="text-xs text-gray-500">公開後に閲覧できるようになります。</p>
              </div>
            }
            actions={[
              ...(onBackToTeacher
                ? [{ label: '講師モードへ戻る', onClick: onBackToTeacher, variant: 'outline' as const, icon: <ArrowLeft className="w-4 h-4" /> }]
                : []),
              { label: '過去の週を見る', onClick: onViewHistory, variant: 'outline' as const, icon: <History className="w-4 h-4" /> },
            ]}
          />
        </div>
      </AppChrome>
    );
  }

  return (
    <AppChrome title="学習計画表（生徒）" back={chromeBack} actions={chromeActions} subHeader={chromeSubHeader}>
      <div className="max-w-7xl mx-auto space-y-[var(--app-section-gap)]">
          {/* Desktop: split-panel planning center */}
          <div className="hidden md:grid grid-cols-12 gap-[var(--app-section-gap)]">
            <section className="col-span-8 space-y-[var(--app-section-gap)]">
              {/* Today's Focus */}
              <div className="bg-white border border-gray-200 rounded-lg p-[var(--app-card-padding)]">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="text-xs text-gray-500">今日のポイント</div>
                    <div className="text-lg text-gray-900">{DAYS[selectedDay]} の予定</div>
                  </div>
                  <div className="flex items-end gap-6 text-right">
                    <div>
                      <div className="text-xs text-gray-500">可処分時間</div>
                      <div className="text-lg text-gray-900">
                        {formatMinutes(getDaySummary(selectedDay).disposableMinutes)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">学習予定</div>
                      <div className="text-lg text-gray-900">
                        {formatMinutes(getDaySummary(selectedDay).studyMinutes)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  {renderDisposableSummary(selectedDay)}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  {getDayBlocks(selectedDay)
                    .filter((b) => b.category !== 'sleep' && b.category !== 'school')
                    .sort((a, b) => a.startTime - b.startTime)
                    .slice(0, 3)
                    .map((block) => (
                      <div key={block.id} className="rounded-lg border border-gray-200 bg-white p-3">
                        <div className="text-xs text-gray-500">{formatTimeRange(block.startTime, block.duration)}</div>
                        <div className="text-sm text-gray-900 mt-1 truncate">{block.label}</div>
                        {block.actualDuration != null && (
                          <div className="text-[11px] text-gray-500 mt-1">
                            計画 {block.duration}分 / 実績 {block.actualDuration}分
                          </div>
                        )}
                      </div>
                    ))}
                  {getDayBlocks(selectedDay).filter((b) => b.category !== 'sleep' && b.category !== 'school').length === 0 && (
                    <div className="col-span-3 text-sm text-gray-600 rounded-lg border border-dashed border-gray-300 bg-white p-4 text-center">
                      この日の学習予定はありません
                    </div>
                  )}
                </div>
              </div>

              {/* Calendar */}
              <div className="bg-white border border-gray-200 rounded-lg p-[var(--app-card-padding)]">
                <div className="flex items-center justify-between gap-3 border-b border-gray-300 pb-2 mb-4">
                  <h2 className="text-lg tracking-wide text-gray-800">時間割</h2>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={calendarMode === 'daily' ? 'default' : 'outline'}
                      size="sm"
                      className={calendarMode === 'daily' ? '' : 'bg-white'}
                      onClick={() => setCalendarMode('daily')}
                    >
                      日別
                    </Button>
                    <Button
                      type="button"
                      variant={calendarMode === 'weekly' ? 'default' : 'outline'}
                      size="sm"
                      className={calendarMode === 'weekly' ? '' : 'bg-white'}
                      onClick={() => setCalendarMode('weekly')}
                    >
                      週全体
                    </Button>
                  </div>
                </div>

                {calendarMode === 'weekly' ? (
                  <TimeTableGrid scheduleBlocks={weeklyPlan.scheduleBlocks} editable={false} />
                ) : (
                  <div className="space-y-3">
                    <Tabs value={selectedDay.toString()} onValueChange={(v) => setSelectedDay(parseInt(v))}>
                      <TabsList className="grid grid-cols-7 w-full">
                        {DAYS.map((day, index) => (
                          <TabsTrigger key={index} value={index.toString()} className="text-xs px-1">
                            {day}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      <TabsContent value={selectedDay.toString()}>
                        <div className="mt-3 space-y-2">
                          {getDayBlocks(selectedDay).length === 0 ? (
                            <div className="text-sm text-gray-600 rounded-lg border border-dashed border-gray-300 bg-white p-4 text-center">
                              予定なし
                            </div>
                          ) : (
                            getDayBlocks(selectedDay)
                              .slice()
                              .sort((a, b) => a.startTime - b.startTime)
                              .map((block) => (
                                <div key={block.id} className="rounded-lg border border-gray-200 bg-white p-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="text-xs text-gray-500">{formatTimeRange(block.startTime, block.duration)}</div>
                                      <div className="text-sm text-gray-900 truncate">{block.label}</div>
                                      {block.actualDuration != null && (
                                        <div className="text-[11px] text-gray-500 mt-1">
                                          計画 {block.duration}分 / 実績 {block.actualDuration}分
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-600 whitespace-nowrap">
                                      {block.status === 'completed' ? '完了' : block.status === 'incomplete' ? '未完了' : '予定'}
                                    </div>
                                  </div>
                                </div>
                              ))
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            </section>

            <aside className="col-span-4 space-y-[var(--app-section-gap)]">
              {/* Backlog */}
              <div className="bg-white border border-gray-200 rounded-lg p-[var(--app-card-padding)]">
                <div className="border-b border-gray-300 pb-2 mb-4">
                  <h2 className="text-lg tracking-wide text-gray-800">今週の目標</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-2">今週の目標</div>
                    <div className="space-y-2">
                      {weeklyPlan.goals.map((g) => (
                        <div key={g.id} className="flex items-start gap-2">
                          <span className="text-xs text-gray-400 mt-0.5">{g.completed ? '✓' : '•'}</span>
                          <div className={`text-sm ${g.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {g.text || '（未設定）'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-2">科目別ミニ目標</div>
                    <div className="space-y-2">
                      {weeklyPlan.subjectTargets
                        .filter((t) => t.subject || t.material || t.range || t.content)
                        .slice()
                        .sort((a, b) => (a.subject || '').localeCompare(b.subject || '', 'ja'))
                        .slice(0, 8)
                        .map((t) => (
                          <div key={t.id} className="rounded-lg border border-gray-200 bg-white p-3">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[11px] font-semibold tracking-widest text-gray-600">
                                {getSubjectCode(t.subject)}
                              </span>
                              <span className="text-[11px] text-gray-500 truncate">{t.material}</span>
                            </div>
                            <div className="text-sm text-gray-900 mt-1">{t.content || t.range || '（未設定）'}</div>
                          </div>
                        ))}
                      {weeklyPlan.subjectTargets.filter((t) => t.subject || t.material || t.range || t.content).length === 0 && (
                        <div className="text-sm text-gray-600 rounded-lg border border-dashed border-gray-300 bg-white p-4 text-center">
                          科目別ミニ目標がまだありません
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reflection (if exists) */}
              {weeklyPlan.reflection && (weeklyPlan.reflection.goodPoints || weeklyPlan.reflection.challenges || weeklyPlan.reflection.nextWeek) && (
                <div className="bg-white border border-gray-200 rounded-lg p-[var(--app-card-padding)]">
                  <div className="border-b border-gray-300 pb-2 mb-4">
                    <h2 className="text-lg tracking-wide text-gray-800">振り返り</h2>
                  </div>
                  <div className="space-y-3 text-sm text-gray-700">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">良かった点</div>
                      <div className="rounded-lg border border-gray-200 bg-white p-3">{weeklyPlan.reflection.goodPoints || '（未記入）'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">課題・改善点</div>
                      <div className="rounded-lg border border-gray-200 bg-white p-3">{weeklyPlan.reflection.challenges || '（未記入）'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">次週に活かす</div>
                      <div className="rounded-lg border border-gray-200 bg-white p-3">{weeklyPlan.reflection.nextWeek || '（未記入）'}</div>
                    </div>
                  </div>
                </div>
              )}
            </aside>
          </div>

          {/* Mobile: keep sequential layout */}
          <div className="md:hidden space-y-[var(--app-section-gap)]">
            <GoalsSection goals={weeklyPlan.goals} editable={false} />

            <div className="bg-white border border-gray-200 rounded-lg p-[var(--app-card-padding-sm)]">
              <div className="border-b border-gray-300 pb-2 mb-4">
                <h2 className="text-lg tracking-wide text-gray-800">週タイムテーブル</h2>
              </div>

              <Tabs value={selectedDay.toString()} onValueChange={(v) => setSelectedDay(parseInt(v))}>
                <TabsList className="grid grid-cols-7 w-full mb-4">
                  {DAYS.map((day, index) => (
                    <TabsTrigger key={index} value={index.toString()} className="text-xs px-1">
                      {day}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {DAYS.map((_, dayIndex) => (
                  <TabsContent key={dayIndex} value={dayIndex.toString()}>
                    <div className="space-y-2">
                      <div className="rounded-lg border border-gray-200 bg-white p-3">
                        {renderDisposableSummary(dayIndex)}
                      </div>
                      {(() => {
                        const segments = getDaySegments(dayIndex);
                        if (segments.length === 0) {
                          return <p className="text-center text-gray-500 py-8 text-sm">予定なし</p>;
                        }
                        return segments.map((segment, index) => {
                          if (segment.kind === 'gap') {
                            const isShort = segment.duration < 15;
                            const isNormal = segment.duration >= 30 && segment.duration <= 90;
                            const isLong = segment.duration >= 120;

                            const labelClasses = [
                              'rounded-full px-2 py-0.5 text-[10px]',
                              isShort ? 'bg-indigo-100/70 text-indigo-400 opacity-70' : '',
                              isNormal ? 'bg-indigo-200/80 text-indigo-700' : '',
                              isLong ? 'bg-indigo-300 text-indigo-900 font-semibold shadow-sm' : '',
                              !isShort && !isNormal && !isLong ? 'bg-indigo-100/80 text-indigo-600' : '',
                            ]
                              .filter(Boolean)
                              .join(' ');

                            return (
                              <div key={`gap-${segment.start}-${index}`} className="border border-indigo-200 rounded-lg p-3 bg-indigo-50/60">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="text-xs text-indigo-700">
                                    {formatTimeRange(segment.start, segment.duration)}
                                  </div>
                                  <span className={labelClasses}>{Math.round(segment.duration)}min</span>
                                </div>
                                <div className="text-xs text-indigo-500 mt-2">空き時間</div>
                              </div>
                            );
                          }

                          const block = segment.block;
                          return (
                            <div key={block.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">
                                    {formatTimeRange(block.startTime, block.duration)}
                                  </div>
                                  <div className="text-sm text-gray-800">{block.label}</div>
                                </div>
                                <div className="text-xs text-gray-600 whitespace-nowrap">
                                  {block.status === 'completed' ? '完了' : block.status === 'incomplete' ? '未完了' : '予定'}
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            <Collapsible open={targetsOpen} onOpenChange={setTargetsOpen}>
              <div className="bg-white border border-gray-200 rounded-lg">
                <CollapsibleTrigger className="w-full p-[var(--app-card-padding-sm)] flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <h2 className="text-lg tracking-wide text-gray-800">科目別ミニ目標</h2>
                  {targetsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-[var(--app-card-padding-sm)] pb-[var(--app-card-padding-sm)]">
                    <SubjectTargets targets={weeklyPlan.subjectTargets} editable={false} />
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {weeklyPlan.reflection && (weeklyPlan.reflection.goodPoints || weeklyPlan.reflection.challenges || weeklyPlan.reflection.nextWeek) && (
              <Collapsible open={reflectionOpen} onOpenChange={setReflectionOpen}>
                <div className="bg-white border border-gray-200 rounded-lg">
                  <CollapsibleTrigger className="w-full p-[var(--app-card-padding-sm)] flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <h2 className="text-lg tracking-wide text-gray-800">振り返り</h2>
                    {reflectionOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-[var(--app-card-padding-sm)] pb-[var(--app-card-padding-sm)]">
                      <ReflectionForm reflection={weeklyPlan.reflection} editable={false} />
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            )}

          </div>
      </div>
    </AppChrome>
  );
}
