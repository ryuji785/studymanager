import React, { useState } from 'react';
import { Plus, Book, MoreHorizontal, X, Trash2, Clock, CalendarPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useBookStore } from '../stores/useBookStore';
import { useTaskStore } from '../stores/useTaskStore';
import { BOOK_CATEGORIES, BOOK_COLOR_PALETTE, type Book as BookType } from '../constants';
import { getPaletteByKey, toDateKey } from '../utils';

export default function MaterialsPage() {
  const navigate = useNavigate();
  const books = useBookStore((s) => s.books);
  const addBook = useBookStore((s) => s.addBook);
  const updateBook = useBookStore((s) => s.updateBook);
  const updateBookColor = useBookStore((s) => s.updateBookColor);
  const updateBookLap = useBookStore((s) => s.updateBookLap);
  const deleteBook = useBookStore((s) => s.deleteBook);
  const updateBookProgress = useBookStore((s) => s.updateBookProgress);
  const addTask = useTaskStore((s) => s.addTask);

  const [materialsTab, setMaterialsTab] = useState('desk');
  const [materialsView, setMaterialsView] = useState('card');
  const [materialsFilterCategory, setMaterialsFilterCategory] = useState('all');
  const [materialsSortMode, setMaterialsSortMode] = useState('default');

  // Add Book Modal
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookCategory, setNewBookCategory] = useState('その他');
  const [newBookColorKey, setNewBookColorKey] = useState(BOOK_COLOR_PALETTE[0].key);
  const [newBookLap, setNewBookLap] = useState(1);
  const [newBookTotalPages, setNewBookTotalPages] = useState<number | ''>('');
  const [newBookDeadline, setNewBookDeadline] = useState('');

  // Book Detail Modal
  const [isBookDetailModalOpen, setIsBookDetailModalOpen] = useState(false);
  const [bookDraft, setBookDraft] = useState<BookType | null>(null);

  const createBook = () => {
    addBook(
      newBookTitle,
      newBookCategory,
      newBookColorKey,
      newBookLap,
      newBookTotalPages === '' ? undefined : newBookTotalPages,
      newBookDeadline || undefined
    );
    setNewBookTitle('');
    setNewBookCategory('その他');
    setNewBookColorKey(BOOK_COLOR_PALETTE[0].key);
    setNewBookLap(1);
    setNewBookTotalPages('');
    setNewBookDeadline('');
    setIsAddBookModalOpen(false);
  };

  const openBookDetailModal = (book: BookType) => {
    setBookDraft({ ...book });
    setIsBookDetailModalOpen(true);
  };

  const closeBookDetailModal = (shouldSave = true) => {
    if (shouldSave && bookDraft) {
      updateBook(bookDraft.id, bookDraft);
    }
    setIsBookDetailModalOpen(false);
    setBookDraft(null);
  };

  const updateBookDraft = (patch: Partial<BookType>) => {
    setBookDraft((prev) => prev ? { ...prev, ...patch } : prev);
  };

  const updateBookDraftColor = (colorKey: string) => {
    const palette = getPaletteByKey(colorKey);
    setBookDraft((prev) => prev ? { ...prev, colorKey, color: palette.card, taskColor: palette.task } : prev);
  };

  const updateBookDraftLap = (delta: number) => {
    setBookDraft((prev) => prev ? { ...prev, lap: Math.max(1, (prev.lap || 1) + delta) } : prev);
  };

  const updateBookDraftProgress = (delta: number) => {
    setBookDraft((prev) => {
      if (!prev || prev.totalPages === undefined) return prev;
      const target = Math.max(0, Math.min(prev.totalPages, (prev.completedPages || 0) + delta));
      return { ...prev, completedPages: target };
    });
  };

  // 今日の計画にこの教材のタスクを追加してPlanPageへ遷移
  const handleAddToPlan = (book: BookType) => {
    const todayKey = toDateKey(new Date());
    // デフォルト60分、適当な開始時刻（現在時刻の次の30分刻み）
    const now = new Date();
    const roundedMinutes = Math.ceil((now.getHours() * 60 + now.getMinutes()) / 30) * 30;
    const startMin = Math.min(roundedMinutes, 23 * 60);
    addTask({
      date: todayKey,
      startMinutes: startMin,
      duration: 60,
      title: book.title,
      color: book.taskColor,
      type: 'study',
      bookId: book.id,
      isCompleted: false,
    });
    closeBookDetailModal(true);
    navigate(`/plan?date=${todayKey}`);
  };

  const statusBooks = books.filter((b) => materialsTab === 'desk' ? b.status === 'active' : b.status === 'completed');
  const filteredBooks = statusBooks.filter((b) => materialsFilterCategory === 'all' ? true : (b.category || 'その他') === materialsFilterCategory);
  const sortedBooks = filteredBooks.slice().sort((a, b) => {
    if (materialsSortMode === 'category') {
      const idxA = BOOK_CATEGORIES.indexOf(a.category || 'その他');
      const idxB = BOOK_CATEGORIES.indexOf(b.category || 'その他');
      if (idxA !== idxB) return idxA - idxB;
      return a.title.localeCompare(b.title, 'ja');
    }
    if (materialsSortMode === 'deadline') {
      // 期限が近い順（期限なしは末尾）
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    if (materialsSortMode === 'progress') {
      // 進捗が低い順（進捗なしは末尾）
      const pA = a.totalPages ? Math.round(((a.completedPages || 0) / a.totalPages) * 100) : 101;
      const pB = b.totalPages ? Math.round(((b.completedPages || 0) / b.totalPages) * 100) : 101;
      return pA - pB;
    }
    return 0;
  });
  const showAddButton = materialsTab === 'desk';
  const isCategoryFiltering = materialsFilterCategory !== 'all';

  return (
    <div className="pb-24 animate-fade-in">
      <Header title="本棚" showSettings={false} />
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="mb-5 rounded-2xl border border-slate-100 bg-white p-2">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setMaterialsTab('desk')} className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${materialsTab === 'desk' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>机の上</button>
            <button onClick={() => setMaterialsTab('hall')} className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${materialsTab === 'hall' ? 'bg-amber-500 text-white shadow-sm' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}>殿堂入り</button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-5 rounded-2xl border border-slate-100 bg-white p-3">
          <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-3 items-center">
            <div className="flex items-center gap-2">
              <button onClick={() => setMaterialsView('card')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors ${materialsView === 'card' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'}`}>カード</button>
              <button onClick={() => setMaterialsView('list')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors ${materialsView === 'list' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'}`}>リスト</button>
            </div>
            <div className="flex flex-wrap items-center gap-2 justify-start md:justify-end">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">カテゴリ</span>
                <select value={materialsFilterCategory} onChange={(e) => setMaterialsFilterCategory(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200">
                  <option value="all">すべて</option>
                  {BOOK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">並び替え</span>
                <select value={materialsSortMode} onChange={(e) => setMaterialsSortMode(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200">
                  <option value="default">追加順</option>
                  <option value="category">カテゴリ順</option>
                  <option value="deadline">期限が近い順</option>
                  <option value="progress">進捗が低い順</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Book Grid/List */}
        {materialsView === 'card' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {showAddButton && (
              <button onClick={() => setIsAddBookModalOpen(true)} className="aspect-[3/4] rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2"><Plus size={20} /></div>
                <span className="text-xs font-bold">新しい本</span>
              </button>
            )}
            {sortedBooks.map((book) => {
              const isCompleted = book.status === 'completed';
              const badgeLabel = isCompleted ? '殿堂入り' : `${book.lap}周目`;

              let progressPercent = 0;
              let isWarning = false;
              let showProgress = false;
              let showDeadline = false;

              if (!isCompleted) {
                if (book.totalPages && book.totalPages > 0) {
                  progressPercent = Math.min(100, Math.round(((book.completedPages || 0) / book.totalPages) * 100));
                  showProgress = true;
                }

                if (book.deadline) {
                  showDeadline = true;
                  const targetDate = new Date(book.deadline);
                  targetDate.setHours(0, 0, 0, 0);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);

                  const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

                  if (diffDays < 0) {
                    isWarning = true;
                  } else if (diffDays <= 7 && progressPercent < 50) {
                    isWarning = true;
                  }
                }
              }

              return (
                <button
                  key={book.id}
                  onClick={() => openBookDetailModal(book)}
                  className={`rounded-2xl p-4 shadow-sm border flex flex-col aspect-[3/4] relative overflow-hidden text-left transition-transform hover:scale-[1.01] ${isWarning && !isCompleted ? 'bg-rose-50 border-2 border-rose-300' :
                    isCompleted ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'
                    }`}
                >
                  <div className={`absolute top-0 left-0 w-full h-2 ${isWarning && !isCompleted ? 'bg-rose-500' : isCompleted ? 'bg-amber-300' : book.color.split(' ')[0]}`}></div>
                  <span className="absolute top-2.5 right-2.5 h-7 w-7 rounded-full bg-white/80 border border-slate-200 text-slate-400 flex items-center justify-center"><MoreHorizontal size={14} /></span>

                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${isCompleted ? 'bg-amber-200 text-amber-800' : 'bg-indigo-100 text-indigo-700'}`}><Book size={20} /></div>

                  <h3 className="font-bold text-slate-800 text-sm leading-tight mb-2 line-clamp-3 pr-2">{book.title}</h3>

                  <div className="mt-auto space-y-2.5 pr-1">
                    {showProgress && (
                      <div className="w-full">
                        <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                          <span>進捗 {book.completedPages || 0}/{book.totalPages}</span>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-slate-700">{progressPercent}%</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); updateBookProgress(book.id, (book.completedPages || 0) + 1); }}
                              className="h-5 w-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center hover:bg-indigo-200 transition-colors text-xs font-bold"
                              title="進捗+1"
                            >+</button>
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${isWarning ? 'bg-rose-500' : 'bg-indigo-500'}`}
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                      {showDeadline && (
                        <div className={`flex items-center gap-1 text-[11px] font-semibold ${isWarning ? 'text-rose-600' : 'text-slate-500'}`}>
                          <Clock size={12} />
                          <span>{book.deadline} 期限</span>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200">
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{book.category || 'その他'}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isCompleted ? 'bg-amber-100 text-amber-800' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'}`}>{badgeLabel}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {showAddButton && (
              <button onClick={() => setIsAddBookModalOpen(true)} className="w-full rounded-2xl border-2 border-dashed border-slate-200 bg-white px-4 py-4 text-slate-500 hover:bg-slate-50 flex items-center justify-center gap-2">
                <Plus size={18} /><span className="text-sm font-semibold">新しい本を追加</span>
              </button>
            )}
            {sortedBooks.map((book) => {
              const isCompleted = book.status === 'completed';
              const badgeLabel = isCompleted ? '殿堂入り' : `${book.lap}周目`;

              let progressPercent = 0;
              let isWarning = false;
              let showProgress = false;
              let showDeadline = false;

              if (!isCompleted) {
                if (book.totalPages && book.totalPages > 0) {
                  progressPercent = Math.min(100, Math.round(((book.completedPages || 0) / book.totalPages) * 100));
                  showProgress = true;
                }

                if (book.deadline) {
                  showDeadline = true;
                  const targetDate = new Date(book.deadline);
                  const today = new Date();
                  targetDate.setHours(0, 0, 0, 0); today.setHours(0, 0, 0, 0);
                  const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
                  if (diffDays < 0 || (diffDays <= 7 && progressPercent < 50)) isWarning = true;
                }
              }

              return (
                <button key={book.id} onClick={() => openBookDetailModal(book)} className={`w-full rounded-2xl border p-4 text-left flex items-start gap-3 transition-colors ${isWarning && !isCompleted ? 'bg-rose-50 border-2 border-rose-300' :
                  isCompleted ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100 hover:bg-slate-50'
                  }`}>
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${isCompleted ? 'bg-amber-200 text-amber-800' : 'bg-indigo-100 text-indigo-700'}`}><Book size={20} /></div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="text-sm font-bold text-slate-800 truncate">{book.title}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${isCompleted ? 'bg-amber-200 text-amber-800' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'}`}>{badgeLabel}</span>
                    </div>

                    {showProgress && (
                      <div className="w-full flex items-center gap-2 mb-1.5">
                        <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div className={`h-1.5 rounded-full ${isWarning ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${progressPercent}%` }}></div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600">{progressPercent}%</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{book.category || 'その他'}</span>
                      {showDeadline && (
                        <div className={`flex items-center gap-1 text-[11px] font-semibold ${isWarning ? 'text-rose-600' : 'text-slate-500'}`}>
                          <Clock size={12} /><span>{book.deadline} 期限</span>
                        </div>
                      )}
                      {!showDeadline && <span className="text-[11px] text-slate-500">最終: {book.lastUsed}</span>}
                    </div>
                  </div>
                  <span className="h-8 w-8 rounded-full bg-white/80 border border-slate-200 text-slate-400 flex items-center justify-center shrink-0"><MoreHorizontal size={14} /></span>
                </button>
              );
            })}
          </div>
        )}

        {sortedBooks.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            {isCategoryFiltering ? '選択中のカテゴリに該当する本がありません' : materialsTab === 'desk' ? '机の上に本がありません' : '殿堂入りの本はまだありません'}
          </div>
        )}
      </div>

      {/* Add Book Modal — センターダイアログ型 */}
      {isAddBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddBookModalOpen(false)} />
          <div className="bg-white rounded-2xl p-5 shadow-2xl relative z-10 w-full max-w-xl max-h-[88svh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-800">本棚に追加</h3>
                <p className="text-xs text-slate-400">カテゴリ・色・周回数も先に設定できます</p>
              </div>
              <button onClick={() => setIsAddBookModalOpen(false)} className="p-2 bg-slate-100 rounded-full"><X size={20} className="text-slate-500" /></button>
            </div>
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs text-slate-500 font-bold">教材名</span>
                <input value={newBookTitle} onChange={(e) => setNewBookTitle(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200" placeholder="例）論述試験 過去問題集" />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 relative">
                  <p className="text-xs text-slate-500 font-bold mb-2">周回数</p>
                  <div className="flex items-center justify-between">
                    <button onClick={() => setNewBookLap((p) => Math.max(1, p - 1))} className="h-8 w-8 rounded-full border border-slate-200 bg-white text-slate-600 font-bold shrink-0">-</button>
                    <div className="text-center">
                      <span className="text-xl font-bold text-indigo-600">{Math.max(1, newBookLap)}</span>
                      <span className="text-xs text-slate-500 ml-1">周目</span>
                    </div>
                    <button onClick={() => setNewBookLap((p) => Math.min(99, p + 1))} className="h-8 w-8 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600 font-bold shrink-0">+</button>
                  </div>
                </div>
                <div>
                  <label className="block mb-3">
                    <span className="text-xs text-slate-500 font-bold block mb-1">全ページ数 (任意)</span>
                    <input
                      type="number" min="1" placeholder="例: 300"
                      value={newBookTotalPages} onChange={(e) => setNewBookTotalPages(e.target.value ? Number(e.target.value) : '')}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-slate-500 font-bold block mb-1">目標期限 (任意)</span>
                    <input
                      type="date"
                      value={newBookDeadline} onChange={(e) => setNewBookDeadline(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </label>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold mb-2">カテゴリ</p>
                <div className="flex flex-wrap gap-2">
                  {BOOK_CATEGORIES.map((c) => (
                    <button key={c} onClick={() => setNewBookCategory(c)} className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${newBookCategory === c ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'}`}>{c}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold mb-2">カラー</p>
                <div className="flex flex-wrap gap-2">
                  {BOOK_COLOR_PALETTE.map((p) => (
                    <button key={p.key} onClick={() => setNewBookColorKey(p.key)} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${newBookColorKey === p.key ? 'border-slate-700 bg-slate-100 text-slate-800' : 'border-slate-200 bg-white text-slate-600'}`}>
                      <span className={`h-4 w-4 rounded-full ${p.card.split(' ')[0]}`} />{p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button onClick={() => setIsAddBookModalOpen(false)} className="py-3 rounded-xl border border-slate-200 text-slate-600 bg-slate-50 font-bold text-sm">キャンセル</button>
                <button onClick={createBook} className="py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm disabled:opacity-50" disabled={!newBookTitle.trim()}>追加する</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Book Detail Modal — センターダイアログ型 */}
      {isBookDetailModalOpen && bookDraft && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => closeBookDetailModal(true)} />
          <div className="relative z-10 w-full max-w-2xl max-h-[88svh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">教材詳細</h3>
                <p className="text-xs text-slate-400">閉じると内容は保存されます</p>
              </div>
              <button onClick={() => closeBookDetailModal(true)} className="p-2 bg-slate-100 rounded-full"><X size={20} className="text-slate-500" /></button>
            </div>
            <div className="space-y-5">
              <label className="block">
                <span className="text-xs text-slate-500 font-bold">タイトル</span>
                <input value={bookDraft.title} onChange={(e) => updateBookDraft({ title: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200" />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 relative">
                  <p className="text-xs text-slate-500 font-bold mb-2">周回数</p>
                  <div className="flex items-center justify-between">
                    <button onClick={() => updateBookDraftLap(-1)} className="h-8 w-8 rounded-full border border-slate-200 bg-white text-slate-600 font-bold shrink-0">-</button>
                    <div className="text-center">
                      <span className="text-xl font-bold text-indigo-600">{Math.max(1, bookDraft.lap || 1)}</span>
                      <span className="text-xs text-slate-500 ml-1">周目</span>
                    </div>
                    <button onClick={() => updateBookDraftLap(1)} className="h-8 w-8 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600 font-bold shrink-0">+</button>
                  </div>
                </div>

                {bookDraft.status !== 'completed' && (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 relative">
                    <p className="text-[11px] text-slate-500 font-bold mb-2">進捗管理（ページ/単元など）</p>
                    <div className="flex items-center gap-1">
                      <input
                        type="number" min="0"
                        value={bookDraft.completedPages || 0}
                        onChange={(e) => updateBookDraft({ completedPages: Number(e.target.value) })}
                        className="w-[3.5rem] text-center rounded-lg border border-slate-200 px-1 py-1.5 text-sm font-bold text-indigo-600"
                      />
                      <span className="text-slate-400 font-bold">/</span>
                      <input
                        type="number" min="1" placeholder="総量"
                        value={bookDraft.totalPages || ''}
                        onChange={(e) => updateBookDraft({ totalPages: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-[3.5rem] text-center rounded-lg border border-slate-200 px-1 py-1.5 text-sm font-bold text-slate-700"
                      />
                    </div>
                    {bookDraft.totalPages && (
                      <div className="mt-3 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, Math.round(((bookDraft.completedPages || 0) / bookDraft.totalPages) * 100))}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs text-slate-500 font-bold block mb-1">目標期限</span>
                  <input
                    type="date"
                    value={bookDraft.deadline || ''}
                    onChange={(e) => updateBookDraft({ deadline: e.target.value || undefined })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </label>
                <div>
                  <p className="text-xs text-slate-500 font-bold mb-2">カテゴリ</p>
                  <div className="flex flex-wrap gap-2">
                    {BOOK_CATEGORIES.map((c) => (
                      <button key={c} onClick={() => updateBookDraft({ category: c })} className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${bookDraft.category === c ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'}`}>{c}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold mb-2">カラー</p>
                  <div className="flex flex-wrap gap-2">
                    {BOOK_COLOR_PALETTE.map((p) => (
                      <button key={p.key} onClick={() => updateBookDraftColor(p.key)} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${bookDraft.colorKey === p.key ? 'border-slate-700 bg-slate-100 text-slate-800' : 'border-slate-200 bg-white text-slate-600'}`}>
                        <span className={`h-4 w-4 rounded-full ${p.card.split(' ')[0]}`} />{p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs text-slate-500 font-bold mb-2">ステータス</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => updateBookDraft({ status: 'active' })} className={`rounded-xl px-3 py-2 text-sm font-semibold border ${bookDraft.status !== 'completed' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'}`}>机の上</button>
                    <button onClick={() => updateBookDraft({ status: 'completed' })} className={`rounded-xl px-3 py-2 text-sm font-semibold border ${bookDraft.status === 'completed' ? 'bg-amber-500 text-white border-amber-500' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>殿堂入り</button>
                  </div>
                </div>
              </div>

              {/* 今日の計画に追加ボタン */}
              {bookDraft.status !== 'completed' && (
                <button
                  onClick={() => handleAddToPlan(bookDraft)}
                  className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors"
                >
                  <CalendarPlus size={16} /> 今日の計画に追加して計画表を開く
                </button>
              )}

              <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button onClick={() => { deleteBook(bookDraft.id); setIsBookDetailModalOpen(false); setBookDraft(null); }} className="sm:col-span-1 py-3 rounded-xl border border-rose-200 text-rose-600 bg-rose-50 font-bold text-sm inline-flex items-center justify-center gap-1.5">
                  <Trash2 size={14} /> 削除
                </button>
                <button onClick={() => closeBookDetailModal(true)} className="sm:col-span-2 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm">保存</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
