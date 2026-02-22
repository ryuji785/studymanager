import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from './index.js';

// DB初期化を待つ
beforeAll(async () => {
  // Initial request to trigger ensureDb
  await request(app).get('/api/books');
});

// ========== Books ==========
describe('POST /api/books', () => {
  it('returns 400 when title is missing', async () => {
    const res = await request(app).post('/api/books').send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('title');
  });

  it('returns 400 when title is empty string', async () => {
    const res = await request(app).post('/api/books').send({ title: '  ' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('title');
  });

  it('returns 400 for invalid deadline format', async () => {
    const res = await request(app).post('/api/books').send({ title: 'Test', deadline: 'not-a-date' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('deadline');
  });

  it('returns 400 for negative totalPages', async () => {
    const res = await request(app).post('/api/books').send({ title: 'Test', totalPages: -5 });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('totalPages');
  });

  it('returns 201 with valid data', async () => {
    const res = await request(app).post('/api/books').send({ title: 'テスト教材' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('テスト教材');
    expect(res.body.id).toBeDefined();
  });
});

describe('PUT /api/books/:id', () => {
  it('returns 400 for non-numeric id', async () => {
    const res = await request(app).put('/api/books/abc').send({ title: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Invalid id');
  });

  it('returns 404 for non-existent id', async () => {
    const res = await request(app).put('/api/books/99999').send({ title: 'x' });
    expect(res.status).toBe(404);
  });

  it('returns 400 for empty title', async () => {
    // First create a book
    const created = await request(app).post('/api/books').send({ title: 'PUT Test' });
    const res = await request(app).put(`/api/books/${created.body.id}`).send({ title: '' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/books/:id', () => {
  it('returns 400 for non-numeric id', async () => {
    const res = await request(app).delete('/api/books/abc');
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent id', async () => {
    const res = await request(app).delete('/api/books/99999');
    expect(res.status).toBe(404);
  });
});

// ========== Tasks ==========
describe('POST /api/tasks', () => {
  it('returns 400 when date is missing', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'test' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('date');
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app).post('/api/tasks').send({ date: '2026-01-01' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('title');
  });

  it('returns 400 for invalid date format', async () => {
    const res = await request(app).post('/api/tasks').send({ date: '2026/01/01', title: 'test' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('YYYY-MM-DD');
  });

  it('returns 400 for startMinutes out of range', async () => {
    const res = await request(app).post('/api/tasks').send({ date: '2026-01-01', title: 'test', startMinutes: 1500 });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('startMinutes');
  });

  it('returns 400 for negative startMinutes', async () => {
    const res = await request(app).post('/api/tasks').send({ date: '2026-01-01', title: 'test', startMinutes: -10 });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('startMinutes');
  });

  it('returns 400 for duration exceeding 1440', async () => {
    const res = await request(app).post('/api/tasks').send({ date: '2026-01-01', title: 'test', duration: 1500 });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('duration');
  });

  it('returns 400 for zero duration', async () => {
    const res = await request(app).post('/api/tasks').send({ date: '2026-01-01', title: 'test', duration: 0 });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('duration');
  });

  it('returns 201 with valid data', async () => {
    const res = await request(app).post('/api/tasks').send({ date: '2026-03-01', title: 'テスト', startMinutes: 540, duration: 60 });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('テスト');
  });
});

describe('PUT /api/tasks/:id', () => {
  it('returns 400 for non-numeric id', async () => {
    const res = await request(app).put('/api/tasks/xyz').send({ title: 'x' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent id', async () => {
    const res = await request(app).put('/api/tasks/99999').send({ title: 'x' });
    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid date in update', async () => {
    const created = await request(app).post('/api/tasks').send({ date: '2026-03-01', title: 'PUT Test', startMinutes: 0, duration: 30 });
    const res = await request(app).put(`/api/tasks/${created.body.id}`).send({ date: 'bad' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('returns 400 for non-numeric id', async () => {
    const res = await request(app).delete('/api/tasks/abc');
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent id', async () => {
    const res = await request(app).delete('/api/tasks/99999');
    expect(res.status).toBe(404);
  });
});

// ========== Goals ==========
describe('POST /api/goals', () => {
  it('returns 400 when title is missing', async () => {
    const res = await request(app).post('/api/goals').send({ examDate: '2026-10-01' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('title');
  });

  it('returns 400 when examDate is missing', async () => {
    const res = await request(app).post('/api/goals').send({ title: 'Goal' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('examDate');
  });

  it('returns 400 for invalid examDate format', async () => {
    const res = await request(app).post('/api/goals').send({ title: 'Goal', examDate: '2026/10/01' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('YYYY-MM-DD');
  });

  it('returns 400 for negative targetHours', async () => {
    const res = await request(app).post('/api/goals').send({ title: 'Goal', examDate: '2026-10-01', targetHours: -10 });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('targetHours');
  });

  it('returns 201 with valid data', async () => {
    const res = await request(app).post('/api/goals').send({ title: 'テスト目標', examDate: '2026-12-01' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
  });
});

describe('PUT /api/goals/:id', () => {
  it('returns 400 for non-numeric id', async () => {
    const res = await request(app).put('/api/goals/abc').send({ title: 'x' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid examDate', async () => {
    const created = await request(app).post('/api/goals').send({ title: 'PUT Goal', examDate: '2026-12-01' });
    const res = await request(app).put(`/api/goals/${created.body.id}`).send({ examDate: 'bad' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for negative targetHours in update', async () => {
    const created = await request(app).post('/api/goals').send({ title: 'PUT Goal 2', examDate: '2026-12-01' });
    const res = await request(app).put(`/api/goals/${created.body.id}`).send({ targetHours: -5 });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/goals/:id', () => {
  it('returns 400 for non-numeric id', async () => {
    const res = await request(app).delete('/api/goals/abc');
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent id', async () => {
    const res = await request(app).delete('/api/goals/99999');
    expect(res.status).toBe(404);
  });
});

// ========== GET with invalid query params ==========
describe('GET /api/tasks', () => {
  it('returns 400 for invalid from date', async () => {
    const res = await request(app).get('/api/tasks?from=bad&to=2026-01-01');
    expect(res.status).toBe(400);
  });

  it('returns 200 with valid date range', async () => {
    const res = await request(app).get('/api/tasks?from=2026-01-01&to=2026-12-31');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
