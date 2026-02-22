import { create } from 'zustand';
import { tasksApi } from '../api/api';
import type { Task } from '../constants';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  fetchTasks: () => Promise<void>;
  addTask: (taskData: Omit<Task, 'id'>) => Promise<number>;
  removeTask: (id: number) => Promise<void>;
  updateTask: (id: number, patch: Partial<Omit<Task, 'id'>>) => Promise<void>;
  updateTaskStartMinutes: (id: number, newStartMinutes: number) => Promise<void>;
  toggleTaskCompletion: (id: number) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,

  fetchTasks: async () => {
    set({ isLoading: true });
    try {
      const tasks = await tasksApi.list();
      set({ tasks, isLoading: false });
    } catch (e) {
      console.error('Failed to fetch tasks:', e);
      set({ isLoading: false });
    }
  },

  addTask: async (taskData) => {
    try {
      const newTask = await tasksApi.create(taskData);
      set((state) => ({ tasks: [...state.tasks, newTask] }));
      return newTask.id;
    } catch (e) {
      console.error('Failed to add task:', e);
      return -1;
    }
  },

  removeTask: async (id) => {
    try {
      await tasksApi.delete(id);
      set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
    } catch (e) {
      console.error('Failed to remove task:', e);
    }
  },

  updateTask: async (id, patch) => {
    try {
      const updated = await tasksApi.update(id, patch);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
      }));
    } catch (e) {
      console.error('Failed to update task:', e);
    }
  },

  updateTaskStartMinutes: async (id, newStartMinutes) => {
    await get().updateTask(id, { startMinutes: newStartMinutes });
  },

  toggleTaskCompletion: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    await get().updateTask(id, { isCompleted: !task.isCompleted });
  },
}));
