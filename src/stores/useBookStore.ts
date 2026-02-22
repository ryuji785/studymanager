import { create } from 'zustand';
import { booksApi } from '../api/api';
import { BOOK_COLOR_PALETTE, type Book } from '../constants';

function getPaletteByKey(colorKey: string) {
  return BOOK_COLOR_PALETTE.find((p) => p.key === colorKey) ?? BOOK_COLOR_PALETTE[0];
}

interface BookState {
  books: Book[];
  isLoading: boolean;
  fetchBooks: () => Promise<void>;
  addBook: (
    title: string,
    category?: string,
    colorKey?: string,
    lap?: number,
    totalPages?: number,
    deadline?: string,
  ) => Promise<void>;
  updateBook: (id: number, patch: Partial<Book>) => Promise<void>;
  updateBookColor: (id: number, colorKey: string) => Promise<void>;
  updateBookLap: (id: number, delta: number) => Promise<void>;
  updateBookProgress: (id: number, completedPages: number) => Promise<void>;
  deleteBook: (id: number) => Promise<void>;
}

export const useBookStore = create<BookState>((set, get) => ({
  books: [],
  isLoading: false,

  fetchBooks: async () => {
    set({ isLoading: true });
    try {
      const books = await booksApi.list();
      set({ books, isLoading: false });
    } catch (e) {
      console.error('Failed to fetch books:', e);
      set({ isLoading: false });
    }
  },

  addBook: async (title, category = 'その他', colorKey = 'blue', lap = 1, totalPages, deadline) => {
    const palette = getPaletteByKey(colorKey);
    try {
      const newBook = await booksApi.create({
        title,
        colorKey,
        color: palette.card,
        taskColor: palette.task,
        category,
        lap,
        status: 'active',
        lastUsed: '新規',
        totalPages,
        completedPages: 0,
        deadline,
      });
      set((state) => ({ books: [...state.books, newBook] }));
    } catch (e) {
      console.error('Failed to add book:', e);
    }
  },

  updateBook: async (id, patch) => {
    try {
      const updated = await booksApi.update(id, patch);
      set((state) => ({
        books: state.books.map((b) => (b.id === id ? updated : b)),
      }));
    } catch (e) {
      console.error('Failed to update book:', e);
    }
  },

  updateBookColor: async (id, colorKey) => {
    const palette = getPaletteByKey(colorKey);
    await get().updateBook(id, { colorKey, color: palette.card, taskColor: palette.task });
  },

  updateBookLap: async (id, delta) => {
    const book = get().books.find((b) => b.id === id);
    if (!book) return;
    await get().updateBook(id, { lap: Math.max(1, (book.lap || 1) + delta) });
  },

  updateBookProgress: async (id, completedPages) => {
    await get().updateBook(id, { completedPages });
  },

  deleteBook: async (id) => {
    try {
      await booksApi.delete(id);
      set((state) => ({ books: state.books.filter((b) => b.id !== id) }));
    } catch (e) {
      console.error('Failed to delete book:', e);
    }
  },
}));
