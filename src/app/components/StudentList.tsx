import React, { useMemo, useState } from 'react';
import { parseISO } from 'date-fns';
import { Student, StudentGender, STUDENT_GENDER_LABELS, WeeklyPlan } from '../types';
import { formatDisplayFromISO } from '../utils/date';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Calendar, Filter, LayoutGrid, List as ListIcon, Plus, Search, Sparkles, RotateCcw, User, UserPlus, X } from 'lucide-react';
import { Button } from './ui/button';
import { AddStudentDialog } from './AddStudentDialog';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { AppChrome } from './layout/AppChrome';

interface StudentListProps {
  students: Student[];
  weeklyPlans: WeeklyPlan[];
  currentWeekStart: string;
  onSelectStudent: (student: Student) => void;
  onAddStudent?: (student: { name: string; grade: string; gender?: StudentGender; email?: string }) => void;
  onQuickCreateWeek?: (student: Student) => void;
  onSeedDemo?: () => void;
  onResetData?: () => void;
}

export function StudentList({
  students,
  weeklyPlans,
  currentWeekStart,
  onSelectStudent,
  onAddStudent,
  onQuickCreateWeek,
  onSeedDemo,
  onResetData,
}: StudentListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<'updatedDesc' | 'nameAsc' | 'gradeAsc'>('updatedDesc');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [gradeFilters, setGradeFilters] = useState<string[]>([]);
  const [genderFilters, setGenderFilters] = useState<StudentGender[]>([]);

  const gradeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of students) set.add(s.grade);
    if (set.size === 0) {
      return ['高校1年', '高校2年', '高校3年'];
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ja'));
  }, [students]);

  const activeFilterCount = gradeFilters.length + genderFilters.length;

  const toggleGradeFilter = (grade: string) => {
    setGradeFilters((prev) => (prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]));
  };

  const toggleGenderFilter = (gender: StudentGender) => {
    setGenderFilters((prev) => (prev.includes(gender) ? prev.filter((g) => g !== gender) : [...prev, gender]));
  };

  const clearFilters = () => {
    setGradeFilters([]);
    setGenderFilters([]);
  };

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students.filter((student) => {
      const gender = student.gender ?? 'unspecified';
      if (gradeFilters.length > 0 && !gradeFilters.includes(student.grade)) return false;
      if (genderFilters.length > 0 && !genderFilters.includes(gender)) return false;

      if (!q) return true;
      return (
        student.name.toLowerCase().includes(q) ||
        student.id.toLowerCase().includes(q) ||
        student.grade.toLowerCase().includes(q)
      );
    });
  }, [students, searchQuery, gradeFilters, genderFilters]);

  const handleAddStudent = (studentData: { name: string; grade: string; gender?: StudentGender; email?: string }) => {
    onAddStudent?.(studentData);
  };

  const getCurrentPlan = (studentId: string) =>
    weeklyPlans.find((p) => p.studentId === studentId && p.weekStart === currentWeekStart) ?? null;

  const sortedStudents = useMemo(() => {
    const getUpdatedAt = (student: Student) => {
      const plan = getCurrentPlan(student.id);
      const value = plan?.lastUpdated ?? student.lastUpdated ?? null;
      if (!value) return 0;
      try {
        return parseISO(value).getTime();
      } catch {
        return 0;
      }
    };

    const gradeRank = (grade: string) => {
      const match = grade.match(/(\d)/);
      if (!match) return 99;
      const value = Number(match[1]);
      return Number.isFinite(value) ? value : 99;
    };

    const next = filteredStudents.slice();
    if (sortKey === 'nameAsc') {
      next.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
      return next;
    }
    if (sortKey === 'gradeAsc') {
      next.sort((a, b) => {
        const rank = gradeRank(a.grade) - gradeRank(b.grade);
        if (rank !== 0) return rank;
        return a.name.localeCompare(b.name, 'ja');
      });
      return next;
    }
    next.sort((a, b) => getUpdatedAt(b) - getUpdatedAt(a));
    return next;
  }, [filteredStudents, sortKey, weeklyPlans, currentWeekStart]);

  return (
    <AppChrome
      title="生徒一覧"
      actions={
        <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          生徒を追加
        </Button>
      }
      subHeader={<p className="text-sm text-gray-600">生徒を選択して週計画の編集・閲覧を行います</p>}
    >
      <div className="max-w-6xl mx-auto">
        {students.length === 0 ? (
          /* 初回利用時のガイダンス */
          <div className="max-w-md mx-auto mt-16">
            <Card className="border-2 border-dashed border-gray-300 bg-white">
              <CardContent className="pt-12 pb-12 text-center">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-8 h-8 text-indigo-600" />
                </div>
                <h2 className="text-xl text-gray-900 mb-2">生徒を追加してください</h2>
                <p className="text-gray-600 mb-6 text-sm">
                  まだ生徒が登録されていません。<br />
                  右上の「生徒を追加」ボタンから担当生徒を追加しましょう。
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left text-sm">
                  <p className="text-gray-700 mb-2 font-medium">次にやること</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-600">
                    <li>生徒を追加</li>
                    <li>今週の計画を作成（または前週コピー）</li>
                    <li>公開して生徒に共有（プレビューで確認）</li>
                  </ol>
                </div>
                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  size="lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  最初の生徒を追加
                </Button>
                {(onSeedDemo || onResetData) && (
                  <div className="mt-4 flex flex-col sm:flex-row justify-center gap-2">
                    {onSeedDemo && (
                      <Button variant="outline" onClick={onSeedDemo} className="bg-white">
                        <Sparkles className="w-4 h-4 mr-2" />
                        サンプルデータを読み込む
                      </Button>
                    )}
                    {onResetData && (
                      <Button variant="outline" onClick={onResetData} className="bg-white">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        データをリセット
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* ツールバー */}
            <div className="mb-6 space-y-3">
              <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="生徒名 / ID / 学年で検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-9 h-10 border-gray-300 bg-white text-sm"
                  />
                  {searchQuery.trim() ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:bg-gray-100"
                      aria-label="検索をクリア"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="bg-white">
                        <Filter className="w-4 h-4 mr-2" />
                        フィルタ{activeFilterCount ? `(${activeFilterCount})` : ''}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <DropdownMenuLabel>学年</DropdownMenuLabel>
                      {gradeOptions.map((grade) => (
                        <DropdownMenuCheckboxItem
                          key={grade}
                          checked={gradeFilters.includes(grade)}
                          onCheckedChange={() => toggleGradeFilter(grade)}
                        >
                          {grade}
                        </DropdownMenuCheckboxItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>性別</DropdownMenuLabel>
                      {(['unspecified', 'male', 'female'] as const).map((gender) => (
                        <DropdownMenuCheckboxItem
                          key={gender}
                          checked={genderFilters.includes(gender)}
                          onCheckedChange={() => toggleGenderFilter(gender)}
                        >
                          {STUDENT_GENDER_LABELS[gender]}
                        </DropdownMenuCheckboxItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        disabled={activeFilterCount === 0}
                        onSelect={(event) => {
                          event.preventDefault();
                          clearFilters();
                        }}
                      >
                        すべてクリア
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="w-full sm:w-56">
                    <Select value={sortKey} onValueChange={(v) => setSortKey(v as typeof sortKey)}>
                      <SelectTrigger className="h-10 border-gray-300 bg-white text-sm">
                        <SelectValue placeholder="並び替え" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="updatedDesc">最終更新（新しい順）</SelectItem>
                        <SelectItem value="nameAsc">名前（あいうえお）</SelectItem>
                        <SelectItem value="gradeAsc">学年（昇順）</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="inline-flex items-center rounded-md border border-gray-300 bg-white overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setViewMode('card')}
                      className={`h-10 px-3 inline-flex items-center justify-center ${
                        viewMode === 'card' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      aria-label="カード表示"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <div className="w-px h-10 bg-gray-200" />
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={`h-10 px-3 inline-flex items-center justify-center ${
                        viewMode === 'list' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      aria-label="リスト表示"
                    >
                      <ListIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {activeFilterCount > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-500">適用中:</span>
                  {gradeFilters.map((grade) => (
                    <Badge key={`grade:${grade}`} variant="outline" className="bg-white border-gray-200">
                      学年: {grade}
                      <button
                        type="button"
                        onClick={() => toggleGradeFilter(grade)}
                        className="ml-2 rounded p-0.5 text-gray-500 hover:bg-gray-100"
                        aria-label={`学年フィルタ「${grade}」を解除`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </Badge>
                  ))}
                  {genderFilters.map((gender) => (
                    <Badge key={`gender:${gender}`} variant="outline" className="bg-white border-gray-200">
                      性別: {STUDENT_GENDER_LABELS[gender]}
                      <button
                        type="button"
                        onClick={() => toggleGenderFilter(gender)}
                        className="ml-2 rounded p-0.5 text-gray-500 hover:bg-gray-100"
                        aria-label={`性別フィルタ「${STUDENT_GENDER_LABELS[gender]}」を解除`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </Badge>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-7 px-2 text-xs text-gray-600"
                  >
                    クリア
                  </Button>
                </div>
              ) : null}
            </div>

            {viewMode === 'card' ? (
              <>
                {/* 生徒カード一覧 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedStudents.map((student) => {
                    const plan = getCurrentPlan(student.id);
                    const lastUpdated = formatDisplayFromISO(plan?.lastUpdated ?? student.lastUpdated);

                    const hasPlan = Boolean(plan);
                    const isPublished = plan?.isPublished ?? false;

                    return (
                      <Card
                        key={student.id}
                        className="hover:shadow-lg transition-shadow cursor-pointer border-gray-200"
                        onClick={() => onSelectStudent(student)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200 flex-shrink-0">
                                <User className="w-6 h-6 text-gray-500" />
                              </div>
                              <div className="min-w-0">
                                <CardTitle className="text-lg mb-1 truncate">{student.name}</CardTitle>
                                <p className="text-sm text-gray-600">
                                  {student.grade}
                                  <span className="mx-2 text-gray-200">|</span>
                                  {STUDENT_GENDER_LABELS[student.gender ?? 'unspecified']}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge
                                variant="outline"
                                className={
                                  hasPlan
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }
                              >
                                {hasPlan ? '計画あり' : '未作成'}
                              </Badge>
                              {hasPlan && (
                                <Badge
                                  variant="outline"
                                  className={
                                    isPublished
                                      ? 'bg-green-50 text-green-700 border-green-200'
                                      : 'bg-gray-100 text-gray-600 border-gray-200'
                                  }
                                >
                                  {isPublished ? '公開中' : '未公開'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                            <Calendar className="w-4 h-4" />
                            <span className="truncate">最終更新: {lastUpdated}</span>
                          </div>
                          {hasPlan ? (
                            <Button className="w-full">週計画を開く</Button>
                          ) : (
                            <Button
                              className="w-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onQuickCreateWeek) {
                                  onQuickCreateWeek(student);
                                  return;
                                }
                                onSelectStudent(student);
                              }}
                            >
                              今週を作成
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>生徒</TableHead>
                      <TableHead className="whitespace-nowrap">学年</TableHead>
                      <TableHead className="whitespace-nowrap">性別</TableHead>
                      <TableHead className="whitespace-nowrap">状態</TableHead>
                      <TableHead className="whitespace-nowrap">最終更新</TableHead>
                      <TableHead className="text-right whitespace-nowrap">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedStudents.map((student) => {
                      const plan = getCurrentPlan(student.id);
                      const lastUpdated = formatDisplayFromISO(plan?.lastUpdated ?? student.lastUpdated);

                      const hasPlan = Boolean(plan);
                      const isPublished = plan?.isPublished ?? false;

                      return (
                        <TableRow
                          key={student.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => onSelectStudent(student)}
                        >
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell className="whitespace-nowrap">{student.grade}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {STUDENT_GENDER_LABELS[student.gender ?? 'unspecified']}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className={
                                  hasPlan
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }
                              >
                                {hasPlan ? '計画あり' : '未作成'}
                              </Badge>
                              {hasPlan ? (
                                <Badge
                                  variant="outline"
                                  className={
                                    isPublished
                                      ? 'bg-green-50 text-green-700 border-green-200'
                                      : 'bg-gray-100 text-gray-600 border-gray-200'
                                  }
                                >
                                  {isPublished ? '公開中' : '未公開'}
                                </Badge>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-gray-600 tabular-nums">{lastUpdated}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant={hasPlan ? 'outline' : 'default'}
                              className={hasPlan ? 'bg-white' : undefined}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!hasPlan && onQuickCreateWeek) {
                                  onQuickCreateWeek(student);
                                  return;
                                }
                                onSelectStudent(student);
                              }}
                            >
                              {hasPlan ? '開く' : '今週を作成'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {sortedStudents.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">該当する生徒が見つかりません</p>
              </div>
            )}
          </>
        )}
      </div>

      <AddStudentDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddStudent={handleAddStudent}
      />
    </AppChrome>
  );
}
