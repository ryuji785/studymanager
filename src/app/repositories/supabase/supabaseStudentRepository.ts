import { Student } from '../../types';
import { CreateStudentInput, StudentRepository } from '../studentRepository';

/**
 * 将来のSupabase実装（stub）。
 * - 実装時は `@supabase/supabase-js` を導入し、ownerIdでRLSを効かせる想定。
 */
export class SupabaseStudentRepository implements StudentRepository {
  async listByOwner(_ownerId: string): Promise<Student[]> {
    throw new Error('SupabaseStudentRepository.listByOwner is not implemented');
  }

  async getById(_ownerId: string, _studentId: string): Promise<Student | null> {
    throw new Error('SupabaseStudentRepository.getById is not implemented');
  }

  async create(_ownerId: string, _input: CreateStudentInput): Promise<Student> {
    throw new Error('SupabaseStudentRepository.create is not implemented');
  }

  async update(_ownerId: string, _student: Student): Promise<Student> {
    throw new Error('SupabaseStudentRepository.update is not implemented');
  }

  async delete(_ownerId: string, _studentId: string): Promise<void> {
    throw new Error('SupabaseStudentRepository.delete is not implemented');
  }
}

