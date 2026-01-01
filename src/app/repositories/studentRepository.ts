import { Student, StudentGender } from '../types';

export type CreateStudentInput = {
  name: string;
  grade: string;
  gender?: StudentGender;
  email?: string;
};

/**
 * データアクセス境界（Students）。
 * UIは LocalStorage / Supabase 等の詳細を知らない前提で、このinterface越しにアクセスする。
 */
export interface StudentRepository {
  listByOwner(ownerId: string): Promise<Student[]>;
  getById(ownerId: string, studentId: string): Promise<Student | null>;
  create(ownerId: string, input: CreateStudentInput): Promise<Student>;
  update(ownerId: string, student: Student): Promise<Student>;
  delete(ownerId: string, studentId: string): Promise<void>;
}
