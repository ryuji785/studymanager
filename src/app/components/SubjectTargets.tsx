import React from 'react';
import { Edit2 } from 'lucide-react';

import type { SubjectTarget } from '../types';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface SubjectTargetsProps {
  targets: SubjectTarget[];
  editable?: boolean;
  onTargetChange?: (targetId: string, field: keyof SubjectTarget, value: string) => void;
}

export function SubjectTargets({ targets, editable = false, onTargetChange }: SubjectTargetsProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-[var(--app-card-padding)]">
      <div className="border-b border-gray-300 pb-2 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg tracking-wide text-gray-800">科目別ミニ目標</h2>
          {editable && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Edit2 className="w-3 h-3" />
              セルをクリックして編集
            </span>
          )}
        </div>
      </div>

      <div className="border border-gray-200 rounded">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[15%] border-r border-gray-200 text-gray-700">科目</TableHead>
              <TableHead className="w-[25%] border-r border-gray-200 text-gray-700">教材名</TableHead>
              <TableHead className="w-[20%] border-r border-gray-200 text-gray-700">範囲</TableHead>
              <TableHead className="w-[40%] text-gray-700">内容</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {targets.map((target) => (
              <TableRow key={target.id} className="border-b border-gray-100 last:border-0">
                <TableCell className="border-r border-gray-100 p-2">
                  {editable ? (
                    <Input
                      value={target.subject}
                      onChange={(e) => onTargetChange?.(target.id, 'subject', e.target.value)}
                      placeholder="英語"
                      className="h-8 border-gray-200 text-sm hover:border-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-colors"
                    />
                  ) : (
                    <span className="text-sm text-gray-800">{target.subject || '—'}</span>
                  )}
                </TableCell>
                <TableCell className="border-r border-gray-100 p-2">
                  {editable ? (
                    <Input
                      value={target.material}
                      onChange={(e) => onTargetChange?.(target.id, 'material', e.target.value)}
                      placeholder="教材名"
                      className="h-8 border-gray-200 text-sm hover:border-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-colors"
                    />
                  ) : (
                    <span className="text-sm text-gray-800">{target.material || '—'}</span>
                  )}
                </TableCell>
                <TableCell className="border-r border-gray-100 p-2">
                  {editable ? (
                    <Input
                      value={target.range}
                      onChange={(e) => onTargetChange?.(target.id, 'range', e.target.value)}
                      placeholder="例: p.10-30"
                      className="h-8 border-gray-200 text-sm hover:border-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-colors"
                    />
                  ) : (
                    <span className="text-sm text-gray-800">{target.range || '—'}</span>
                  )}
                </TableCell>
                <TableCell className="p-2">
                  {editable ? (
                    <Input
                      value={target.content}
                      onChange={(e) => onTargetChange?.(target.id, 'content', e.target.value)}
                      placeholder="例: 重要単語30個"
                      className="h-8 border-gray-200 text-sm hover:border-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-colors"
                    />
                  ) : (
                    <span className="text-sm text-gray-800">{target.content || '—'}</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
