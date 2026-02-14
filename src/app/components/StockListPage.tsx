import React, { useMemo, useState } from 'react';
import { Book, Pencil, Plus, Trash2 } from 'lucide-react';

import type { AppData, Material } from '../types';
import { UI_TEXT } from '../constants/strings';
import { AppChrome } from './layout/AppChrome';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';

type SortMode = 'newest' | 'name' | 'deadline';

const CARD_ACCENTS = ['bg-sky-100', 'bg-emerald-100', 'bg-amber-100', 'bg-rose-100', 'bg-cyan-100', 'bg-slate-100'];

function sortMaterials(items: Material[], mode: SortMode) {
  if (mode === 'name') return [...items].sort((a, b) => a.name.localeCompare(b.name, 'ja'));
  if (mode === 'deadline') {
    return [...items].sort((a, b) => (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31'));
  }
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function StockListPage({
  data,
  onUpdateData,
}: {
  data: AppData;
  onUpdateData: (updater: (prev: AppData) => AppData) => void;
}) {
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [name, setName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [categoryId, setCategoryId] = useState(data.categories[0]?.id ?? '');

  const sortedMaterials = useMemo(() => sortMaterials(data.materials, sortMode), [data.materials, sortMode]);

  const resetForm = () => {
    setEditing(null);
    setName('');
    setDeadline('');
    setCategoryId(data.categories[0]?.id ?? '');
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (material: Material) => {
    setEditing(material);
    setName(material.name);
    setDeadline(material.deadline ?? '');
    setCategoryId(material.categoryId);
    setOpen(true);
  };

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed || !categoryId) return;

    const nextMaterial: Material = {
      id: editing?.id ?? `mat_${Date.now()}`,
      name: trimmed,
      deadline: deadline || '',
      categoryId,
      chapters: editing?.chapters ?? [],
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    };

    onUpdateData((prev) => {
      const exists = prev.materials.some((item) => item.id === nextMaterial.id);
      return {
        ...prev,
        materials: exists
          ? prev.materials.map((item) => (item.id === nextMaterial.id ? nextMaterial : item))
          : [...prev.materials, nextMaterial],
      };
    });

    setOpen(false);
    resetForm();
  };

  const remove = (material: Material) => {
    onUpdateData((prev) => ({
      ...prev,
      materials: prev.materials.filter((entry) => entry.id !== material.id),
      planItems: prev.planItems.map((item) =>
        item.materialId === material.id ? { ...item, materialId: undefined } : item,
      ),
    }));
  };

  return (
    <AppChrome title={UI_TEXT.NAV_MATERIALS}>
      <div className="space-y-4 pb-20">
        <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-700">使う本・アプリをゆるく管理</p>
              <p className="text-xs text-slate-500">複雑な分類はせず、並び替えだけで整理できます。</p>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-500">
              並び替え
              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as SortMode)}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600"
              >
                <option value="newest">追加が新しい順</option>
                <option value="name">名前順</option>
                <option value="deadline">期限が近い順</option>
              </select>
            </label>
          </div>
        </section>

        {sortedMaterials.length === 0 ? (
          <section className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
            <p className="text-sm text-slate-500">本棚はまだ空です。</p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
            >
              {UI_TEXT.LABEL_ADD_MATERIAL}
            </button>
          </section>
        ) : (
          <section className="grid grid-cols-2 gap-3">
            {sortedMaterials.map((material, index) => {
              const tag = data.categories.find((category) => category.id === material.categoryId)?.name ?? '未設定';
              return (
                <article key={material.id} className="relative overflow-hidden rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                  <div className={`absolute left-0 top-0 h-1.5 w-full ${CARD_ACCENTS[index % CARD_ACCENTS.length]}`} />
                  <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${CARD_ACCENTS[index % CARD_ACCENTS.length]}`}>
                    <Book className="h-4 w-4 text-slate-600" />
                  </div>
                  <h3 className="line-clamp-3 text-sm text-slate-700">{material.name}</h3>
                  <p className="mt-2 text-xs text-slate-500">{UI_TEXT.LABEL_CATEGORY}: {tag}</p>
                  <p className="mt-1 text-xs text-slate-500">期限: {material.deadline || '未設定'}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(material)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      編集
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(material)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      削除
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <button
          type="button"
          onClick={openCreate}
          className="fixed bottom-[88px] right-5 z-30 inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-3 text-sm text-white shadow-md hover:bg-sky-700"
          aria-label={UI_TEXT.LABEL_ADD_MATERIAL}
        >
          <Plus className="h-4 w-4" />
          {UI_TEXT.LABEL_ADD_MATERIAL}
        </button>
      </div>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>{editing ? '本・科目を編集' : UI_TEXT.LABEL_ADD_MATERIAL}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 py-2">
            <label className="grid gap-1 text-sm text-slate-600">
              {UI_TEXT.LABEL_MATERIAL}
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="例: 英単語アプリ"
                className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-sky-300"
              />
            </label>
            <label className="grid gap-1 text-sm text-slate-600">
              {UI_TEXT.LABEL_CATEGORY}
              <select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-300"
              >
                {data.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm text-slate-600">
              期限（任意）
              <input
                type="date"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
                className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-sky-300"
              />
            </label>
          </div>

          <DialogFooter>
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!name.trim() || !categoryId}
              className="rounded-lg bg-sky-600 px-3 py-2 text-sm text-white enabled:hover:bg-sky-700 disabled:opacity-50"
            >
              保存
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppChrome>
  );
}
