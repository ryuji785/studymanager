import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

// GET /api/books
router.get('/', async (req, res) => {
  const userId = (req as any).userId as string;
  try {
    const result = await getDb().execute({ sql: 'SELECT * FROM books WHERE user_id = ? ORDER BY id', args: [userId] });
    const books = result.rows.map((r: any) => ({
      id: r.id, title: r.title, colorKey: r.color_key, color: r.color, taskColor: r.task_color,
      category: r.category, lap: r.lap, status: r.status, lastUsed: r.last_used,
      totalPages: r.total_pages, completedPages: r.completed_pages, deadline: r.deadline,
    }));
    res.json(books);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Internal error' }); }
});

// POST /api/books
router.post('/', async (req, res) => {
  const userId = (req as any).userId as string;
  const { title, colorKey, color, taskColor, category, lap, status, lastUsed, totalPages, deadline } = req.body;
  if (!title || typeof title !== 'string' || !title.trim()) { res.status(400).json({ message: 'title is required' }); return; }

  try {
    const result = await getDb().execute({
      sql: `INSERT INTO books (user_id, title, color_key, color, task_color, category, lap, status, last_used, total_pages, completed_pages, deadline)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [userId, title.trim(), colorKey || 'blue', color || '', taskColor || '', category || 'その他',
        Number(lap) || 1, status || 'active', lastUsed || '新規', totalPages ?? null, 0, deadline ?? null],
    });
    const book = await getDb().execute({ sql: 'SELECT * FROM books WHERE id = ?', args: [Number(result.lastInsertRowid)] });
    const r = book.rows[0] as any;
    res.status(201).json({
      id: r.id, title: r.title, colorKey: r.color_key, color: r.color, taskColor: r.task_color,
      category: r.category, lap: r.lap, status: r.status, lastUsed: r.last_used,
      totalPages: r.total_pages, completedPages: r.completed_pages, deadline: r.deadline,
    });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Internal error' }); }
});

// PUT /api/books/:id
router.put('/:id', async (req, res) => {
  const userId = (req as any).userId as string;
  const bookId = Number(req.params.id);
  try {
    const existing = await getDb().execute({ sql: 'SELECT * FROM books WHERE id = ? AND user_id = ?', args: [bookId, userId] });
    if (existing.rows.length === 0) { res.status(404).json({ message: 'Book not found' }); return; }

    const { title, colorKey, color, taskColor, category, lap, status, lastUsed, totalPages, completedPages, deadline } = req.body;
    await getDb().execute({
      sql: `UPDATE books SET
        title = COALESCE(?, title), color_key = COALESCE(?, color_key), color = COALESCE(?, color),
        task_color = COALESCE(?, task_color), category = COALESCE(?, category), lap = COALESCE(?, lap),
        status = COALESCE(?, status), last_used = COALESCE(?, last_used), total_pages = COALESCE(?, total_pages),
        completed_pages = COALESCE(?, completed_pages), deadline = COALESCE(?, deadline), updated_at = datetime('now')
        WHERE id = ? AND user_id = ?`,
      args: [title ?? null, colorKey ?? null, color ?? null, taskColor ?? null, category ?? null,
      lap != null ? Number(lap) : null, status ?? null, lastUsed ?? null,
      totalPages !== undefined ? (totalPages === null ? null : Number(totalPages)) : null,
      completedPages !== undefined ? Number(completedPages) : null,
      deadline !== undefined ? (deadline === null ? null : deadline) : null,
        bookId, userId],
    });
    const updated = await getDb().execute({ sql: 'SELECT * FROM books WHERE id = ?', args: [bookId] });
    const r = updated.rows[0] as any;
    res.json({
      id: r.id, title: r.title, colorKey: r.color_key, color: r.color, taskColor: r.task_color,
      category: r.category, lap: r.lap, status: r.status, lastUsed: r.last_used,
      totalPages: r.total_pages, completedPages: r.completed_pages, deadline: r.deadline,
    });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Internal error' }); }
});

// DELETE /api/books/:id
router.delete('/:id', async (req, res) => {
  const userId = (req as any).userId as string;
  const bookId = Number(req.params.id);
  try {
    const result = await getDb().execute({ sql: 'DELETE FROM books WHERE id = ? AND user_id = ?', args: [bookId, userId] });
    if (result.rowsAffected === 0) { res.status(404).json({ message: 'Book not found' }); return; }
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Internal error' }); }
});

export default router;
