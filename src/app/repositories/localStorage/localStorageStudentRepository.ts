import { Student } from '../../types';
import { CreateStudentInput, StudentRepository } from '../studentRepository';
import { loadAppData, saveAppData } from './appDataStore';
import { createStudent } from '../../services/studentService';

export class LocalStorageStudentRepository implements StudentRepository {
  async listByOwner(ownerId: string): Promise<Student[]> {
    return loadAppData(ownerId).students;
  }

  async getById(ownerId: string, studentId: string): Promise<Student | null> {
    const data = loadAppData(ownerId);
    return data.students.find((s) => s.id === studentId) ?? null;
  }

  async create(ownerId: string, input: CreateStudentInput): Promise<Student> {
    const data = loadAppData(ownerId);
    const student = createStudent(input, ownerId);
    saveAppData(ownerId, { ...data, students: [student, ...data.students] });
    return student;
  }

  async update(ownerId: string, student: Student): Promise<Student> {
    const data = loadAppData(ownerId);
    const nextStudent = { ...student, ownerId: student.ownerId ?? ownerId };
    const exists = data.students.some((s) => s.id === nextStudent.id);
    const students = exists
      ? data.students.map((s) => (s.id === nextStudent.id ? nextStudent : s))
      : [nextStudent, ...data.students];
    saveAppData(ownerId, { ...data, students });
    return nextStudent;
  }

  async delete(ownerId: string, studentId: string): Promise<void> {
    const data = loadAppData(ownerId);
    saveAppData(ownerId, {
      ...data,
      students: data.students.filter((s) => s.id !== studentId),
      weeklyPlans: data.weeklyPlans.filter((p) => p.studentId !== studentId),
    });
  }
}
