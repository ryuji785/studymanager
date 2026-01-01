import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import type { StudentGender } from '../types';

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddStudent: (student: { name: string; grade: string; gender?: StudentGender; email?: string }) => void;
}

export function AddStudentDialog({ open, onOpenChange, onAddStudent }: AddStudentDialogProps) {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [gender, setGender] = useState<StudentGender>('unspecified');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && grade) {
      onAddStudent({
        name,
        grade,
        gender,
        email: email || undefined,
      });
      // リセット
      setName('');
      setGrade('');
      setGender('unspecified');
      setEmail('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>生徒を追加</DialogTitle>
          <DialogDescription>
            新しく担当する生徒の情報を入力してください
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                生徒名 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例：田中 花子"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="grade">
                学年 <span className="text-red-500">*</span>
              </Label>
              <Select value={grade} onValueChange={setGrade} required>
                <SelectTrigger id="grade">
                  <SelectValue placeholder="学年を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="高校1年">高校1年</SelectItem>
                  <SelectItem value="高校2年">高校2年</SelectItem>
                  <SelectItem value="高校3年">高校3年</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="gender">性別（任意）</Label>
              <Select value={gender} onValueChange={(value) => setGender(value as StudentGender)}>
                <SelectTrigger id="gender">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unspecified">未設定</SelectItem>
                  <SelectItem value="male">男</SelectItem>
                  <SelectItem value="female">女</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">メールアドレス（任意）</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="例：hanako@example.com"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit" disabled={!name || !grade}>
              追加
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
