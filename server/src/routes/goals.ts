import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

// GET /api/goals
router.get('/', async (req, res) => {
  const userId = (req as any).userId as string;
  try {
    const result = await getDb().execute({
      sql: `SELECT id, title, exam_date as examDate, target_hours as targetHours,
            weekday_hours_target as weekdayHoursTarget, weekend_hours_target as weekendHoursTarget,
            is_active as isActive FROM goals WHERE user_id = ? ORDER BY created_at DESC`,
      args: [userId],
    });
    res.json(result.rows.map((g: any) => ({ ...g, isActive: Boolean(g.isActive) })));
  } catch (e) { console.error(e); res.status(500).json({ error: 'Internal server error' }); }
});

// POST /api/goals
router.post('/', async (req, res) => {
  const userId = (req as any).userId as string;
  const { title, examDate, targetHours, weekdayHoursTarget, weekendHoursTarget, isActive } = req.body;
  try {
    const result = await getDb().execute({
      sql: `INSERT INTO goals (user_id, title, exam_date, target_hours, weekday_hours_target, weekend_hours_target, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [userId, title, examDate, targetHours ?? 150, weekdayHoursTarget ?? 1.5, weekendHoursTarget ?? 3.0,
        isActive !== undefined ? (isActive ? 1 : 0) : 1],
    });
    res.status(201).json({ id: Number(result.lastInsertRowid) });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Internal server error' }); }
});

// PUT /api/goals/:id
router.put('/:id', async (req, res) => {
  const userId = (req as any).userId as string;
  const id = req.params.id;
  const updates = req.body;
  try {
    const sets: string[] = [];
    const values: any[] = [];
    if (updates.title !== undefined) { sets.push('title = ?'); values.push(updates.title); }
    if (updates.examDate !== undefined) { sets.push('exam_date = ?'); values.push(updates.examDate); }
    if (updates.targetHours !== undefined) { sets.push('target_hours = ?'); values.push(updates.targetHours); }
    if (updates.weekdayHoursTarget !== undefined) { sets.push('weekday_hours_target = ?'); values.push(updates.weekdayHoursTarget); }
    if (updates.weekendHoursTarget !== undefined) { sets.push('weekend_hours_target = ?'); values.push(updates.weekendHoursTarget); }
    if (updates.isActive !== undefined) { sets.push('is_active = ?'); values.push(updates.isActive ? 1 : 0); }
    if (sets.length === 0) { res.json({ success: true }); return; }
    sets.push('updated_at = datetime("now")');
    values.push(id, userId);
    await getDb().execute({ sql: `UPDATE goals SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`, args: values });
    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Internal server error' }); }
});

// DELETE /api/goals/:id
router.delete('/:id', async (req, res) => {
  const userId = (req as any).userId as string;
  const id = req.params.id;
  try {
    await getDb().execute({ sql: 'DELETE FROM goals WHERE id = ? AND user_id = ?', args: [id, userId] });
    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
