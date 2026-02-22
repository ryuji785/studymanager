import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

// GET /api/tasks?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/', async (req, res) => {
  const userId = (req as any).userId as string;
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;
  try {
    const result = (from && to)
      ? await getDb().execute({ sql: 'SELECT * FROM tasks WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date, start_minutes', args: [userId, from, to] })
      : await getDb().execute({ sql: 'SELECT * FROM tasks WHERE user_id = ? ORDER BY date, start_minutes', args: [userId] });

    const tasks = result.rows.map((r: any) => ({
      id: r.id, date: r.date, startMinutes: r.start_minutes, duration: r.duration,
      title: r.title, color: r.color, type: r.type, bookId: r.book_id, isCompleted: Boolean(r.is_completed),
    }));
    res.json(tasks);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Internal error' }); }
});

// POST /api/tasks
router.post('/', async (req, res) => {
  const userId = (req as any).userId as string;
  const { date, startMinutes, duration, title, color, type, bookId, isCompleted } = req.body;
  if (!date || !title) { res.status(400).json({ message: 'date and title are required' }); return; }

  try {
    const result = await getDb().execute({
      sql: `INSERT INTO tasks (user_id, book_id, date, start_minutes, duration, title, color, type, is_completed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [userId, bookId ?? null, date, Number(startMinutes) || 0, Number(duration) || 60, title, color || '', type || 'study', isCompleted ? 1 : 0],
    });
    const task = await getDb().execute({ sql: 'SELECT * FROM tasks WHERE id = ?', args: [Number(result.lastInsertRowid)] });
    const r = task.rows[0] as any;
    res.status(201).json({
      id: r.id, date: r.date, startMinutes: r.start_minutes, duration: r.duration,
      title: r.title, color: r.color, type: r.type, bookId: r.book_id, isCompleted: Boolean(r.is_completed),
    });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Internal error' }); }
});

// PUT /api/tasks/:id
router.put('/:id', async (req, res) => {
  const userId = (req as any).userId as string;
  const taskId = Number(req.params.id);
  try {
    const existing = await getDb().execute({ sql: 'SELECT * FROM tasks WHERE id = ? AND user_id = ?', args: [taskId, userId] });
    if (existing.rows.length === 0) { res.status(404).json({ message: 'Task not found' }); return; }

    const { date, startMinutes, duration, title, color, type, bookId, isCompleted } = req.body;
    await getDb().execute({
      sql: `UPDATE tasks SET date = COALESCE(?, date), start_minutes = COALESCE(?, start_minutes),
        duration = COALESCE(?, duration), title = COALESCE(?, title), color = COALESCE(?, color),
        type = COALESCE(?, type), book_id = COALESCE(?, book_id), is_completed = COALESCE(?, is_completed),
        updated_at = datetime('now') WHERE id = ? AND user_id = ?`,
      args: [date ?? null, startMinutes != null ? Number(startMinutes) : null, duration != null ? Number(duration) : null,
      title ?? null, color ?? null, type ?? null,
      bookId !== undefined ? (bookId ?? null) : null,
      isCompleted !== undefined ? (isCompleted ? 1 : 0) : null,
        taskId, userId],
    });
    const updated = await getDb().execute({ sql: 'SELECT * FROM tasks WHERE id = ?', args: [taskId] });
    const r = updated.rows[0] as any;
    res.json({
      id: r.id, date: r.date, startMinutes: r.start_minutes, duration: r.duration,
      title: r.title, color: r.color, type: r.type, bookId: r.book_id, isCompleted: Boolean(r.is_completed),
    });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Internal error' }); }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  const userId = (req as any).userId as string;
  const taskId = Number(req.params.id);
  try {
    const result = await getDb().execute({ sql: 'DELETE FROM tasks WHERE id = ? AND user_id = ?', args: [taskId, userId] });
    if (result.rowsAffected === 0) { res.status(404).json({ message: 'Task not found' }); return; }
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Internal error' }); }
});

export default router;
