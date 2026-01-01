import { Student, StudentGender } from '../types';
import { formatIsoDate } from '../utils/date';

export type CreateStudentInput = {
  name: string;
  grade: string;
  gender?: StudentGender;
  email?: string;
};

export function createStudent(input: CreateStudentInput, ownerId?: string): Student {
  return {
    id: `stu_${Date.now()}`,
    ownerId,
    name: input.name.trim(),
    grade: input.grade,
    gender: input.gender,
    email: input.email?.trim() || undefined,
    lastUpdated: formatIsoDate(new Date()),
  };
}
