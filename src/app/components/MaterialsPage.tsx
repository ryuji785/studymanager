import React, { useEffect, useMemo, useState } from 'react';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { GripVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import type { AppData, Category, Material } from '../types';
import { formatDisplayFromISO } from '../utils/date';
import { AppChrome } from './layout/AppChrome';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { EmptyState } from './ui/empty-state';
import { PageHeader } from './ui/page-header';
import { PageLayout } from './ui/page-layout';
import { cn } from './ui/utils';
import { CATEGORY_COLOR_POOL } from '../utils/categoryColors';

const UNCATEGORIZED_ID = 'uncategorized';
const MATERIAL_FOCUS_KEY = 'study-manager.materials-focus';

type SortMode = 'deadline' | 'name' | 'recent';

function createCategory(name: string, usedColors: string[]): Category {
  const color = CATEGORY_COLOR_POOL.find((entry) => !usedColors.includes(entry)) ?? CATEGORY_COLOR_POOL[0];
  return {
    id: `cat_${Date.now()}`,
    name,
    color,
    createdAt: new Date().toISOString(),
  };
}

function getDaysToDeadline(deadline?: string) {
  if (!deadline) return null;
  try {
    const diff = differenceInCalendarDays(parseISO(deadline), new Date());
    if (!Number.isFinite(diff)) return null;
    return diff;
  } catch {
    return null;
  }
}

function MaterialDialog({
  open,
  onOpenChange,
  categories,
  initial,
  onSave,
  onCreateCategory,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  initial?: Material | null;
  onSave: (material: Material) => void;
  onCreateCategory: (name: string) => Category | null;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [deadline, setDeadline] = useState(initial?.deadline ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? '');
  const [chaptersInput, setChaptersInput] = useState((initial?.chapters ?? []).join(', '));
  const [newCategoryName, setNewCategoryName] = useState('');

  React.useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setDeadline(initial?.deadline ?? '');
    setCategoryId(initial?.categoryId ?? categories[0]?.id ?? '');
    setChaptersInput((initial?.chapters ?? []).join(', '));
    setNewCategoryName('');
  }, [open, initial, categories]);

  const validationError = useMemo(() => {
    if (!name.trim()) return '教材名を入力してください。';
    if (!deadline) return '締切日を入力してください。';
    if (!categoryId) return 'カテゴリを選択してください。';
    return null;
  }, [name, deadline, categoryId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{initial ? '教材を編集' : '教材を追加'}</DialogTitle>
          <DialogDescription>
            カテゴリは必須です。必要に応じて新規カテゴリを追加できます。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>教材名 *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="例: 英単語帳" />
          </div>
          <div className="grid gap-2">
            <Label>締切日 *</Label>
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>カテゴリ *</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="カテゴリを選択" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="カテゴリを追加"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const next = newCategoryName.trim();
                  if (!next) return;
                  const created = onCreateCategory(next);
                  if (created) {
                    setCategoryId(created.id);
                    setNewCategoryName('');
                  }
                }}
              >
                追加
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>章/範囲（任意）</Label>
            <Input
              value={chaptersInput}
              onChange={(e) => setChaptersInput(e.target.value)}
              placeholder="例: 第1章, 第2章"
            />
          </div>
          {validationError && <p className="text-xs text-red-600">{validationError}</p>}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button
            onClick={() => {
              if (validationError) return;
              const next: Material = {
                id: initial?.id ?? `mat_${Date.now()}`,
                name: name.trim(),
                deadline,
                categoryId,
                chapters: chaptersInput
                  .split(',')
                  .map((c) => c.trim())
                  .filter(Boolean),
                createdAt: initial?.createdAt ?? new Date().toISOString(),
              };
              onSave(next);
              onOpenChange(false);
            }}
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MaterialsPage({
  data,
  onUpdateData,
}: {
  data: AppData;
  onUpdateData: (updater: (prev: AppData) => AppData) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [reassignMode, setReassignMode] = useState<'uncategorized' | 'category'>('uncategorized');
  const [reassignCategoryId, setReassignCategoryId] = useState(UNCATEGORIZED_ID);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('deadline');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(null);
  const [dragOverCategoryId, setDragOverCategoryId] = useState<string | null>(null);
  const [focusMaterialIds, setFocusMaterialIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = window.localStorage.getItem(MATERIAL_FOCUS_KEY);
      if (!raw) return new Set();
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? new Set(parsed) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(MATERIAL_FOCUS_KEY, JSON.stringify(Array.from(focusMaterialIds)));
  }, [focusMaterialIds]);

  const categoryById = useMemo(() => new Map(data.categories.map((c) => [c.id, c])), [data.categories]);
  const orderedCategories = useMemo(() => {
    const uncategorized = data.categories.find((category) => category.id === UNCATEGORIZED_ID);
    const regular = data.categories.filter((category) => category.id !== UNCATEGORIZED_ID);
    return uncategorized ? [...regular, uncategorized] : regular;
  }, [data.categories]);
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    data.materials.forEach((material) => {
      counts.set(material.categoryId, (counts.get(material.categoryId) ?? 0) + 1);
    });
    return counts;
  }, [data.materials]);
  const planItemCounts = useMemo(() => {
    const counts = new Map<string, number>();
    data.planItems.forEach((item) => {
      if (!item.categoryId) return;
      counts.set(item.categoryId, (counts.get(item.categoryId) ?? 0) + 1);
    });
    return counts;
  }, [data.planItems]);
  const filteredMaterials = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = data.materials.filter((material) => {
      if (selectedCategoryId !== 'all' && material.categoryId !== selectedCategoryId) return false;
      if (!query) return true;
      const category = categoryById.get(material.categoryId);
      return (
        material.name.toLowerCase().includes(query) ||
        Boolean(category?.name.toLowerCase().includes(query))
      );
    });
    const sorted = [...filtered];
    if (sortMode === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
    } else if (sortMode === 'recent') {
      sorted.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
    } else {
      sorted.sort((a, b) => (a.deadline ?? '9999-12-31').localeCompare(b.deadline ?? '9999-12-31'));
    }
    return sorted;
  }, [categoryById, data.materials, searchQuery, selectedCategoryId, sortMode]);

  const handleSaveMaterial = (material: Material) => {
    onUpdateData((prev) => {
      const exists = prev.materials.some((m) => m.id === material.id);
      const nextMaterials = exists
        ? prev.materials.map((m) => (m.id === material.id ? material : m))
        : [...prev.materials, material];
      return { ...prev, materials: nextMaterials };
    });
    toast.success('教材を保存しました');
  };

  const handleDeleteMaterial = (material: Material) => {
    if (!window.confirm('この教材を削除しますか？')) return;
    onUpdateData((prev) => ({
      ...prev,
      materials: prev.materials.filter((m) => m.id !== material.id),
      planItems: prev.planItems.map((item) =>
        item.materialId === material.id ? { ...item, materialId: undefined } : item,
      ),
    }));
    setFocusMaterialIds((prev) => {
      const next = new Set(prev);
      next.delete(material.id);
      return next;
    });
    toast.message('教材を削除しました');
  };

  const handleCreateCategory = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const exists = data.categories.some((c) => c.name === trimmed);
    if (exists) {
      toast.message('同名のカテゴリがすでにあります。');
      return null;
    }
    const usedColors = data.categories.map((c) => c.color);
    const created = createCategory(trimmed, usedColors);
    onUpdateData((prev) => ({ ...prev, categories: [...prev.categories, created] }));
    toast.success('カテゴリを追加しました');
    return created;
  };

  const handleReorderCategory = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    if (sourceId === UNCATEGORIZED_ID || targetId === UNCATEGORIZED_ID) return;
    onUpdateData((prev) => {
      const regular = prev.categories.filter((category) => category.id !== UNCATEGORIZED_ID);
      const sourceIndex = regular.findIndex((category) => category.id === sourceId);
      const targetIndex = regular.findIndex((category) => category.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) return prev;
      const next = [...regular];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      const uncategorized = prev.categories.find((category) => category.id === UNCATEGORIZED_ID);
      return {
        ...prev,
        categories: uncategorized ? [...next, uncategorized] : next,
      };
    });
  };

  const openDeleteDialog = (category: Category) => {
    setDeleteTarget(category);
    setReassignMode('uncategorized');
    const fallback =
      data.categories.find((c) => c.id !== category.id && c.id !== UNCATEGORIZED_ID)?.id ?? UNCATEGORIZED_ID;
    setReassignCategoryId(fallback);
  };

  const handleDeleteCategory = () => {
    if (!deleteTarget) return;
    const destinationId = reassignMode === 'category' ? reassignCategoryId : UNCATEGORIZED_ID;
    if (!destinationId || destinationId === deleteTarget.id) return;

    onUpdateData((prev) => {
      const nextCategories = prev.categories.filter((c) => c.id !== deleteTarget.id);
      return {
        ...prev,
        categories: nextCategories,
        materials: prev.materials.map((material) =>
          material.categoryId === deleteTarget.id ? { ...material, categoryId: destinationId } : material,
        ),
        planItems: prev.planItems.map((item) =>
          item.categoryId === deleteTarget.id ? { ...item, categoryId: destinationId } : item,
        ),
        lastUsedCategoryId:
          prev.lastUsedCategoryId === deleteTarget.id ? destinationId : prev.lastUsedCategoryId,
      };
    });

    toast.message('カテゴリを削除しました');
    setDeleteTarget(null);
  };

  const toggleFocus = (materialId: string, next: boolean) => {
    setFocusMaterialIds((prev) => {
      const updated = new Set(prev);
      if (next) {
        updated.add(materialId);
      } else {
        updated.delete(materialId);
      }
      return updated;
    });
  };

  return (
    <AppChrome title="教材管理" actions={null}>
      <PageLayout>
        <PageHeader
          title="教材管理"
          description="教材を整理すると、今週やることが明確になり、自動生成も使いやすくなります。"
          action={
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              ＋ 教材を追加
            </Button>
          }
        />

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <Card>
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base font-semibold text-foreground">教材一覧</CardTitle>
                <span className="text-xs text-muted-foreground">登録数: {data.materials.length}件</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex-1 min-w-[220px]">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="教材名・カテゴリで検索"
                  />
                </div>
                <Select value={sortMode} onValueChange={(value) => setSortMode(value as SortMode)}>
                  <SelectTrigger className="min-w-[180px]">
                    <SelectValue placeholder="並び替え" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deadline">締切が近い順</SelectItem>
                    <SelectItem value="name">教材名（昇順）</SelectItem>
                    <SelectItem value="recent">最近追加</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger className="min-w-[180px]">
                    <SelectValue placeholder="カテゴリで絞り込み" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    {data.categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {searchQuery ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                  >
                    クリア
                  </Button>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              {data.materials.length === 0 ? (
                <EmptyState
                  title="教材がまだ登録されていません"
                  description="教材を登録すると、自動タスク生成やカテゴリ管理がスムーズになります。"
                  actions={[
                    {
                      label: '教材を追加',
                      onClick: () => {
                        setEditing(null);
                        setDialogOpen(true);
                      },
                    },
                  ]}
                />
              ) : filteredMaterials.length === 0 ? (
                <p className="text-sm text-muted-foreground">一致する教材がありません。</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>教材名</TableHead>
                      <TableHead>カテゴリ</TableHead>
                      <TableHead>締切</TableHead>
                      <TableHead className="text-center">今週やる</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaterials.map((material) => {
                      const category = categoryById.get(material.categoryId);
                      const daysToDeadline = getDaysToDeadline(material.deadline);
                      const deadlineBadge =
                        typeof daysToDeadline === 'number' && daysToDeadline >= 0 ? (
                          <Badge variant="outline" className="border-border text-muted-foreground">
                            {daysToDeadline === 0 ? '締切日' : `あと${daysToDeadline}日`}
                          </Badge>
                        ) : typeof daysToDeadline === 'number' ? (
                          <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50/70">
                            締切経過
                          </Badge>
                        ) : null;
                      return (
                        <TableRow key={material.id}>
                          <TableCell className="font-medium text-foreground">{material.name}</TableCell>
                          <TableCell>
                            {category ? (
                              <Badge className={category.color} variant="outline">
                                {category.name}
                              </Badge>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-foreground">
                              <span>{formatDisplayFromISO(material.deadline)}</span>
                              {deadlineBadge}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={focusMaterialIds.has(material.id)}
                              onCheckedChange={(checked) => toggleFocus(material.id, checked)}
                              aria-label={`${material.name}を今週やるにする`}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditing(material);
                                  setDialogOpen(true);
                                }}
                              >
                                <Pencil className="w-4 h-4 mr-1" />
                                編集
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteMaterial(material)}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                削除
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold text-foreground">カテゴリ管理</CardTitle>
                <p className="text-xs text-muted-foreground">
                  教材と週間計画の両方で使う分類です。ドラッグで順番を並べ替え、名前はクリックしてそのまま編集できます。
                </p>
              </div>
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <Input
                  placeholder="新しいカテゴリ名"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="h-9 sm:w-48"
                />
                <Button
                  variant="outline"
                  className="h-9"
                  onClick={() => {
                    const next = newCategoryName.trim();
                    if (!next) return;
                    const created = handleCreateCategory(next);
                    if (created) setNewCategoryName('');
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  追加
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-[24px_32px_minmax(0,1fr)_auto_32px] items-center gap-2 text-[11px] text-muted-foreground">
                <span />
                <span>色</span>
                <span>カテゴリ名</span>
                <span className="text-right">教材/ブロック</span>
                <span />
              </div>
              <div className="space-y-1">
                {orderedCategories.map((category) => {
                  const isUncategorized = category.id === UNCATEGORIZED_ID;
                  const materialCount = categoryCounts.get(category.id) ?? 0;
                  const planCount = planItemCounts.get(category.id) ?? 0;
                  const isDragOver = dragOverCategoryId === category.id;

                  return (
                    <div
                      key={category.id}
                      className={cn(
                        'grid grid-cols-[24px_32px_minmax(0,1fr)_auto_32px] items-center gap-2 rounded-md border px-2 py-2 text-sm',
                        isDragOver ? 'border-primary/60 bg-primary/5' : 'border-border bg-background',
                      )}
                      onDragOver={(event) => {
                        if (!draggedCategoryId || draggedCategoryId === category.id) return;
                        event.preventDefault();
                        setDragOverCategoryId(category.id);
                      }}
                      onDragLeave={() => {
                        if (isDragOver) setDragOverCategoryId(null);
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        if (draggedCategoryId) {
                          handleReorderCategory(draggedCategoryId, category.id);
                        }
                        setDraggedCategoryId(null);
                        setDragOverCategoryId(null);
                      }}
                    >
                      <button
                        type="button"
                        className={cn(
                          'flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition hover:text-foreground',
                          isUncategorized ? 'cursor-not-allowed opacity-40' : 'cursor-grab',
                        )}
                        draggable={!isUncategorized}
                        onDragStart={(event) => {
                          if (isUncategorized) return;
                          event.dataTransfer.effectAllowed = 'move';
                          event.dataTransfer.setData('text/plain', category.id);
                          setDraggedCategoryId(category.id);
                        }}
                        onDragEnd={() => {
                          setDraggedCategoryId(null);
                          setDragOverCategoryId(null);
                        }}
                        aria-label={`${category.name}を並べ替え`}
                      >
                        <GripVertical className="h-4 w-4" />
                      </button>

                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              'h-6 w-6 rounded-full border border-border transition',
                              category.color,
                              isUncategorized ? 'cursor-not-allowed opacity-60' : 'hover:opacity-90',
                            )}
                            aria-label="カテゴリ色を変更"
                            disabled={isUncategorized}
                          />
                        </PopoverTrigger>
                        <PopoverContent className="w-44 p-2" align="start">
                          <div className="grid grid-cols-4 gap-2">
                            {CATEGORY_COLOR_POOL.map((color) => {
                              const isActive = category.color === color;
                              return (
                                <button
                                  key={color}
                                  type="button"
                                  className={cn(
                                    'h-7 w-7 rounded-full border border-border transition',
                                    color,
                                    isActive
                                      ? 'ring-2 ring-primary/60 ring-offset-1 ring-offset-background'
                                      : 'opacity-80',
                                  )}
                                  onClick={() => {
                                    if (isUncategorized) return;
                                    onUpdateData((prev) => ({
                                      ...prev,
                                      categories: prev.categories.map((c) =>
                                        c.id === category.id ? { ...c, color } : c,
                                      ),
                                    }));
                                  }}
                                  aria-label="カテゴリ色を変更"
                                />
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>

                      <Input
                        value={category.name}
                        onChange={(e) => {
                          const nextName = e.target.value;
                          onUpdateData((prev) => ({
                            ...prev,
                            categories: prev.categories.map((c) =>
                              c.id === category.id ? { ...c, name: nextName } : c,
                            ),
                          }));
                        }}
                        placeholder="カテゴリ名を編集"
                        className="h-8"
                        disabled={isUncategorized}
                      />

                      <span className="text-xs text-muted-foreground text-right whitespace-nowrap">
                        {materialCount} / {planCount}
                      </span>

                      {!isUncategorized ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-rose-600"
                          onClick={() => openDeleteDialog(category)}
                          aria-label={`${category.name}を削除`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      ) : (
                        <span className="h-8 w-8" aria-hidden="true" />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="text-[11px] text-muted-foreground">
                未分類は削除や並べ替えができません。削除時の受け皿として使用します。
              </div>
            </CardContent>
          </Card>
        </div>
      </PageLayout>

      <MaterialDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        categories={data.categories}
        initial={editing}
        onSave={handleSaveMaterial}
        onCreateCategory={handleCreateCategory}
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>カテゴリを削除</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `${deleteTarget.name} に紐づく教材やブロックの移動先を選んでください。`
                : ''}
            </DialogDescription>
          </DialogHeader>

          {deleteTarget ? (
            <div className="space-y-4">
              <div className="text-xs text-muted-foreground">
                教材 {categoryCounts.get(deleteTarget.id) ?? 0}件 / ブロック {planItemCounts.get(deleteTarget.id) ?? 0}件
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="reassignMode"
                    value="uncategorized"
                    checked={reassignMode === 'uncategorized'}
                    onChange={() => setReassignMode('uncategorized')}
                  />
                  未分類へ移動
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="reassignMode"
                    value="category"
                    checked={reassignMode === 'category'}
                    onChange={() => setReassignMode('category')}
                  />
                  別のカテゴリへ移動
                </label>
              </div>

              {reassignMode === 'category' ? (
                <div className="space-y-2">
                  <Label>移動先カテゴリ</Label>
                  <Select value={reassignCategoryId} onValueChange={setReassignCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="カテゴリを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {data.categories
                        .filter((c) => c.id !== deleteTarget.id)
                        .map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>
          ) : null}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory}>
              削除する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppChrome>
  );
}
