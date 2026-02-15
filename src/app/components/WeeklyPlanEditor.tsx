import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, ArrowLeft, Calendar, CheckCircle2, Copy, Edit3, Eye, FileDown, History, Info, Loader2, Plus, Save } from 'lucide-react';
import { differenceInCalendarDays, parseISO } from 'date-fns';

import { Student, SubjectTarget, WeeklyPlan, Reflection, ScheduleBlock as ScheduleBlockType } from '../types';
import { formatDisplayFromISO } from '../utils/date';
import { GoalsSection } from './GoalsSection';
import { TimeTableGrid } from './TimeTableGrid';
import { ScheduleBlockDialog } from './ScheduleBlockDialog';
import { SubjectTargets } from './SubjectTargets';
import { ReflectionForm } from './ReflectionForm';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { StateCard } from './states/StateCard';
import { AppChrome } from './layout/AppChrome';
import { PeriodSelector, type PeriodValue } from './ui/period-selector';

type WeekOption = { weekStart: string; weekEnd: string; label: string };

interface WeeklyPlanEditorProps {
  student: Student;
  weeklyPlan: WeeklyPlan | null;

  weekOptions: WeekOption[];
  selectedWeekStart: string;
  onSelectWeekStart: (weekStart: string) => void;

  onBack: () => void;
  onUpsertPlan: (plan: WeeklyPlan) => void;

  onCreateBlankWeek: () => void;
  onDuplicateFromPreviousWeek: () => void;
  hasPreviousWeek: boolean;
  onCreateWeekByPeriod: (params: { weekStart: string; weekEnd: string; template: 'blank' | 'duplicate' }) => void;

  onPreviewStudent: () => void;
  onOpenHistory: () => void;

  persistError?: string | null;
}

type SaveStatus = 'saved' | 'saving' | 'error';

export function WeeklyPlanEditor({
  student,
  weeklyPlan,
  weekOptions,
  selectedWeekStart,
  onSelectWeekStart,
  onBack,
  onUpsertPlan,
  onCreateBlankWeek,
  onDuplicateFromPreviousWeek,
  hasPreviousWeek,
  onCreateWeekByPeriod,
  onPreviewStudent,
  onOpenHistory,
  persistError,
}: WeeklyPlanEditorProps) {
  const [draft, setDraft] = useState<WeeklyPlan | null>(weeklyPlan);
  const [isEditMode, setIsEditMode] = useState(true);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const saveTimeoutRef = useRef<number | null>(null);

  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockDialogInitial, setBlockDialogInitial] = useState<
    Partial<ScheduleBlockType> & Pick<ScheduleBlockType, 'dayOfWeek' | 'startTime' | 'duration'>
  >({ dayOfWeek: 0, startTime: 6 * 60, duration: 60 });

  const selectedWeekLabel = useMemo(() => {
    return weekOptions.find((w) => w.weekStart === selectedWeekStart)?.label ?? selectedWeekStart;
  }, [selectedWeekStart, weekOptions]);

  const selectedPeriod = useMemo<PeriodValue>(() => {
    const match = weekOptions.find((w) => w.weekStart === selectedWeekStart);
    if (match) return { start: match.weekStart, end: match.weekEnd };
    return { start: selectedWeekStart, end: selectedWeekStart };
  }, [selectedWeekStart, weekOptions]);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createTemplate, setCreateTemplate] = useState<'blank' | 'duplicate'>('blank');
  const [createPeriod, setCreatePeriod] = useState<PeriodValue>(selectedPeriod);

  const createPeriodDays = useMemo(() => {
    const start = parseISO(createPeriod.start);
    const end = parseISO(createPeriod.end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
    return differenceInCalendarDays(end, start) + 1;
  }, [createPeriod.end, createPeriod.start]);
  const isCreatePeriodInvalid = createPeriodDays === null || createPeriodDays < 1 || createPeriodDays > 7;

  useEffect(() => {
    if (!createDialogOpen) return;
    setCreatePeriod(selectedPeriod);
    setCreateTemplate('blank');
  }, [createDialogOpen, selectedPeriod]);

  useEffect(() => {
    setDraft(weeklyPlan);
    setHasUnsavedChanges(false);
    setSaveStatus(persistError ? 'error' : 'saved');
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  }, [persistError, weeklyPlan?.id]);

  useEffect(() => {
    if (!draft) return;
    if (!hasUnsavedChanges) return;

    setSaveStatus('saving');
    if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(() => {
      try {
        onUpsertPlan({ ...draft, lastUpdated: new Date().toISOString() });
        setHasUnsavedChanges(false);
        setSaveStatus(persistError ? 'error' : 'saved');
      } catch (error) {
        console.error(error);
        setSaveStatus('error');
      }
    }, 800);

    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [draft, hasUnsavedChanges, onUpsertPlan, persistError]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasUnsavedChanges]);

  const requestBack = () => {
    if (saveStatus === 'saving') {
      toast.message('保存中です。保存完了までお待ちください');
      return;
    }
    if (hasUnsavedChanges) {
      const ok = window.confirm('未保存の変更があります。破棄して移動しますか？');
      if (!ok) return;
    }
    onBack();
  };

  const requestWeekChange = (nextWeekStart: string) => {
    if (nextWeekStart === selectedWeekStart) return;
    if (saveStatus === 'saving') {
      toast.message('保存中です。保存完了までお待ちください');
      return;
    }
    if (hasUnsavedChanges) {
      const ok = window.confirm('未保存の変更があります。破棄して週を切り替えますか？');
      if (!ok) return;
    }
    onSelectWeekStart(nextWeekStart);
  };

  const requestCreateForPeriod = () => {
    if (saveStatus === 'saving') {
      toast.message('保存中です。保存完了までお待ちください');
      return;
    }
    if (hasUnsavedChanges) {
      const ok = window.confirm('未保存の変更があります。破棄して新規作成しますか？');
      if (!ok) return;
    }

    if (isCreatePeriodInvalid) {
      toast.error('1週間以内の期間を指定してください。期間を見直してください。');
      return;
    }

    onCreateWeekByPeriod({ weekStart: createPeriod.start, weekEnd: createPeriod.end, template: createTemplate });
    setCreateDialogOpen(false);
  };

  const markDirty = () => {
    if (!draft) return;
    setHasUnsavedChanges(true);
    setSaveStatus('saving');
  };

  const flushSave = (withToast: boolean) => {
    if (!draft) return;
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    try {
      setSaveStatus('saving');
      onUpsertPlan({ ...draft, lastUpdated: new Date().toISOString() });
      setHasUnsavedChanges(false);
      setSaveStatus(persistError ? 'error' : 'saved');
      if (withToast) toast.success('保存しました');
    } catch (error) {
      console.error(error);
      setSaveStatus('error');
      toast.error('保存に失敗しました');
    }
  };

  const updateDraft = (updater: (prev: WeeklyPlan) => WeeklyPlan) => {
    setDraft((prev) => (prev ? updater(prev) : prev));
    markDirty();
  };

  const handleGoalChange = (goalId: string, text: string) => {
    updateDraft((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === goalId ? { ...g, text } : g)),
    }));
  };

  const handleGoalToggle = (goalId: string) => {
    updateDraft((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === goalId ? { ...g, completed: !g.completed } : g)),
    }));
  };

  const handleTargetChange = (targetId: string, field: keyof SubjectTarget, value: string) => {
    updateDraft((prev) => ({
      ...prev,
      subjectTargets: prev.subjectTargets.map((t) =>
        t.id === targetId ? { ...t, [field]: value } : t,
      ),
    }));
  };

  const handleReflectionChange = (field: keyof Reflection, value: string) => {
    updateDraft((prev) => ({
      ...prev,
      reflection: { ...prev.reflection, [field]: value },
    }));
  };

  const handleBlockClick = (block: ScheduleBlockType) => {
    setBlockDialogInitial(block);
    setBlockDialogOpen(true);
  };

  const handleEmptySlotClick = (dayOfWeek: number, startTime: number) => {
    setBlockDialogInitial({
      dayOfWeek,
      startTime,
      duration: 60,
      category: 'english',
      label: '',
      status: 'planned',
    });
    setBlockDialogOpen(true);
  };

  const toggleEditMode = () => {
    setIsEditMode((v) => !v);
    toast.message(isEditMode ? '閲覧（プレビュー）に切り替えました' : '編集に切り替えました');
  };

  const togglePublish = (next: boolean) => {
    if (!draft) return;
    updateDraft((prev) => ({ ...prev, isPublished: next }));
  };

  const SaveStatusPill = () => {
    const common = 'text-xs px-2 py-1 rounded border inline-flex items-center gap-1.5';
    if (saveStatus === 'saving') {
      return (
        <span className={`${common} bg-indigo-50 text-indigo-700 border-indigo-200`}>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          保存中
        </span>
      );
    }
    if (saveStatus === 'error') {
      return (
        <span className={`${common} bg-red-50 text-red-700 border-red-200`} title={persistError ?? ''}>
          <AlertTriangle className="w-3.5 h-3.5" />
          保存失敗
        </span>
      );
    }
    return (
      <span className={`${common} bg-green-50 text-green-700 border-green-200`}>
        <CheckCircle2 className="w-3.5 h-3.5" />
        保存済み
      </span>
    );
  };

  return (
    <AppChrome
      title="週計画"
      back={{ label: '生徒一覧へ', onClick: requestBack }}
      actions={<SaveStatusPill />}
      subHeader={
        <div className="space-y-3">
          {/* 週操作バー */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/30 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <PeriodSelector
                  value={selectedPeriod}
                  onChange={(next) => requestWeekChange(next.start)}
                  mode="week"
                  weekStartsOn={1}
                />
              </div>

              <div className="h-6 w-px bg-gray-300 hidden md:block" />

              <div className="flex flex-wrap items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="text-sm bg-white">
                      <Plus className="w-4 h-4 mr-1.5" />
                      新規作成
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      disabled={Boolean(draft)}
                      onSelect={(event) => {
                        event.preventDefault();
                        onCreateBlankWeek();
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      この週を空で作成
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={!hasPreviousWeek || Boolean(draft)}
                      onSelect={(event) => {
                        event.preventDefault();
                        onDuplicateFromPreviousWeek();
                      }}
                    >
                      <Copy className="w-4 h-4" />
                      前週を複製して作成
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        setCreateDialogOpen(true);
                      }}
                    >
                      <Calendar className="w-4 h-4" />
                      期間を選んで作成…
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant={isEditMode ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleEditMode}
                  className={isEditMode ? 'bg-gray-900 hover:bg-gray-800 text-white' : 'bg-white'}
                >
                  <Edit3 className="w-4 h-4 mr-1.5" />
                  {isEditMode ? '編集' : '閲覧'}
                </Button>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              <Info className="w-3 h-3 inline mr-1" />
              編集内容は自動保存されます
            </p>
          </div>

          {persistError && (
            <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
              <div className="flex items-start gap-2 text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-medium">保存に失敗しました</p>
                  <p className="text-xs text-red-700/80 break-all">{persistError}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => flushSave(true)} className="bg-white">
                再保存
              </Button>
            </div>
          )}

          {/* 取り違え防止：固定表示 */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-gray-700">
              <span className="font-medium">{student.name}</span>
              <span className="text-gray-500 ml-1">（{student.grade}）</span>
              <span className="mx-2 text-gray-300">|</span>
              <span className="text-gray-600">{selectedWeekLabel}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={onPreviewStudent} className="bg-white">
                <Eye className="w-4 h-4 mr-2" />
                生徒モードでプレビュー
              </Button>
              <Button variant="outline" size="sm" onClick={onOpenHistory} className="bg-white">
                <History className="w-4 h-4 mr-2" />
                学習履歴
              </Button>

              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-md px-2 py-1.5">
                <Switch checked={draft?.isPublished ?? false} onCheckedChange={togglePublish} disabled={!draft} />
                <span className="text-xs text-gray-700 whitespace-nowrap">
                  {draft?.isPublished ? '公開中' : '未公開'}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => flushSave(true)}
                disabled={!draft || saveStatus === 'saving'}
                className="bg-white"
              >
                <Save className="w-4 h-4 mr-2" />
                保存
              </Button>

              <Button variant="outline" size="sm" disabled className="bg-white" title="PDF出力は任意（開発中）">
                <FileDown className="w-4 h-4 mr-2" />
                PDF出力
              </Button>
            </div>
          </div>
        </div>
      }
      mainClassName="p-0"
    >

      {!draft ? (
        <main className="p-6 max-w-5xl mx-auto">
          <StateCard
            tone="info"
            icon={<Calendar className="w-7 h-7" />}
            title="この生徒の学習計画はまだ作成されていません"
            description={
              <div className="space-y-1">
                <p>まずは今週の週計画を作成してください。</p>
                <p className="text-xs text-gray-500">週：{selectedWeekLabel}</p>
              </div>
            }
            actions={[
              {
                label: '今週の計画を作成',
                onClick: onCreateBlankWeek,
                icon: <Plus className="w-4 h-4" />,
              },
              ...(hasPreviousWeek
                ? [
                    {
                      label: '前週を複製して作成',
                      onClick: onDuplicateFromPreviousWeek,
                      variant: 'outline' as const,
                      icon: <Copy className="w-4 h-4" />,
                    },
                  ]
                : []),
              {
                label: '期間を選んで新規作成',
                onClick: () => setCreateDialogOpen(true),
                variant: 'outline' as const,
                icon: <Calendar className="w-4 h-4" />,
              },
            ]}
          >
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left text-sm">
              <p className="text-gray-700 mb-2 font-medium">次にやること</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>今週の計画を作成（空の週 or 前週複製）</li>
                <li>内容を編集して整える</li>
                <li>公開 → 生徒モードでプレビュー</li>
              </ol>
            </div>
          </StateCard>
        </main>
      ) : (
        <>
          {/* メインコンテンツ：3カラム */}
          <div className="grid grid-cols-12 gap-[var(--app-section-gap)] p-[var(--app-page-padding)]">
            {/* 左サイドバー（運用メモ） */}
            <aside className="col-span-2 space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm text-gray-800 mb-2">運用メモ</h3>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>・公開すると生徒が閲覧できます</li>
                  <li>・編集は自動保存されます</li>
                  <li>・取り違え防止：氏名/学年/週を確認</li>
                </ul>
              </div>
            </aside>

            {/* 中央メイン */}
            <main className="col-span-7 space-y-[var(--app-section-gap)]">
              <GoalsSection
                goals={draft.goals}
                editable={isEditMode}
                onGoalChange={handleGoalChange}
                onGoalToggle={handleGoalToggle}
              />

              <div className="bg-white border border-gray-200 rounded-lg p-[var(--app-card-padding)]">
                <div className="flex items-center justify-between gap-3 border-b border-gray-300 pb-2 mb-4">
                  <h2 className="text-lg tracking-wide text-gray-800">週タイムテーブル</h2>
                  {isEditMode && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setBlockDialogInitial({
                          dayOfWeek: 0,
                          startTime: 18 * 60,
                          duration: 60,
                          category: 'english',
                          label: '',
                          status: 'planned',
                        });
                        setBlockDialogOpen(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      予定を追加
                    </Button>
                  )}
                </div>
                <TimeTableGrid
                  scheduleBlocks={draft.scheduleBlocks}
                  editable={isEditMode}
                  onBlockClick={isEditMode ? handleBlockClick : undefined}
                  onEmptySlotClick={isEditMode ? handleEmptySlotClick : undefined}
                />
              </div>
            </main>

            {/* 右サイドバー */}
            <aside className="col-span-3 space-y-[var(--app-section-gap)]">
              <SubjectTargets targets={draft.subjectTargets} editable={isEditMode} onTargetChange={handleTargetChange} />
              <ReflectionForm reflection={draft.reflection} editable={isEditMode} onReflectionChange={handleReflectionChange} />
            </aside>
          </div>

          {/* フッター */}
          <footer className="bg-white border-t border-gray-200 px-6 py-3 sticky bottom-0">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>最終更新: {formatDisplayFromISO(draft.lastUpdated)}</span>
              <span>{saveStatus === 'saving' ? '保存中…' : saveStatus === 'error' ? '保存に失敗しました' : '保存済み'}</span>
            </div>
          </footer>

          <ScheduleBlockDialog
            open={blockDialogOpen}
            onOpenChange={setBlockDialogOpen}
            initial={blockDialogInitial}
            onSave={(next) => {
              const existed = Boolean(draft?.scheduleBlocks.some((b) => b.id === next.id));
              updateDraft((prev) => ({
                ...prev,
                scheduleBlocks: prev.scheduleBlocks.some((b) => b.id === next.id)
                  ? prev.scheduleBlocks.map((b) => (b.id === next.id ? next : b))
                  : [...prev.scheduleBlocks, next],
              }));
              toast.success(existed ? '予定を更新しました' : '予定を追加しました');
            }}
            onDelete={
              blockDialogInitial.id
                ? () => {
                    const id = blockDialogInitial.id;
                    updateDraft((prev) => ({
                      ...prev,
                      scheduleBlocks: prev.scheduleBlocks.filter((b) => b.id !== id),
                    }));
                    setBlockDialogOpen(false);
                    toast.success('削除しました');
                  }
                : undefined
            }
          />
        </>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>週計画を新規作成</DialogTitle>
            <DialogDescription>
              開始日を選ぶと、月曜開始の1週間（7日間）として自動設定します。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">期間</Label>
              <PeriodSelector value={createPeriod} onChange={setCreatePeriod} mode="week" weekStartsOn={1} />
              <p className="text-xs text-gray-500">表示は {`YYYY-MM-DD〜YYYY-MM-DD`} に統一しています。</p>
              {isCreatePeriodInvalid && (
                <p className="text-xs text-red-600">1週間を超える期間は指定できません。期間を見直してください。</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm">作成方法</Label>
              <RadioGroup
                value={createTemplate}
                onValueChange={(v) => setCreateTemplate(v as 'blank' | 'duplicate')}
                className="gap-2"
              >
                <label className="flex items-start gap-3 rounded-md border border-gray-200 bg-white p-3 cursor-pointer">
                  <RadioGroupItem value="blank" className="mt-1" />
                  <div className="space-y-0.5">
                    <div className="text-sm text-gray-900">空の週で作成</div>
                    <div className="text-xs text-gray-500">目標と予定をゼロから作りたい場合。</div>
                  </div>
                </label>
                <label className="flex items-start gap-3 rounded-md border border-gray-200 bg-white p-3 cursor-pointer">
                  <RadioGroupItem value="duplicate" className="mt-1" />
                  <div className="space-y-0.5">
                    <div className="text-sm text-gray-900">前週を複製して作成</div>
                    <div className="text-xs text-gray-500">直近の週計画をベースに作りたい場合。</div>
                  </div>
                </label>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="bg-white" onClick={() => setCreateDialogOpen(false)}>
              キャンセル
            </Button>
            <Button type="button" onClick={requestCreateForPeriod} disabled={isCreatePeriodInvalid}>
              作成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppChrome>
  );
}
