import crypto from 'node:crypto';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { initDb, getDb } from '../server/src/db.js';
import bookRoutes from '../server/src/routes/books.js';
import taskRoutes from '../server/src/routes/tasks.js';
import goalRoutes from '../server/src/routes/goals.js';

dotenv.config();

const {
  GOOGLE_CLIENT_ID = '',
  GOOGLE_CLIENT_SECRET = '',
  GOOGLE_CALLBACK_URL = '',
  FRONTEND_ORIGIN = 'http://localhost:5173',
  JWT_SECRET = 'dev-jwt-secret-change-in-production',
} = process.env;

const app = express();
app.use(express.json());
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));

// --- JWT helpers ---
function signToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token: string): any {
  return jwt.verify(token, JWT_SECRET);
}

const COOKIE_NAME = 'sm_token';
const COOKIE_OPTS: express.CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

// --- Auth middleware ---
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const token = req.cookies?.[COOKIE_NAME];
  if (token) {
    try {
      const payload = verifyToken(token) as any;
      (req as any).userId = payload.id;
      return next();
    } catch { /* fall through */ }
  }
  // Dev bypass
  if (process.env.NODE_ENV !== 'production') {
    (req as any).userId = 'local';
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
}

// --- Cookie parser (lightweight) ---
app.use((req, _res, next) => {
  const cookie = req.headers.cookie;
  if (cookie) {
    (req as any).cookies = Object.fromEntries(
      cookie.split(';').map((c) => {
        const [k, ...v] = c.trim().split('=');
        return [k, decodeURIComponent(v.join('='))];
      })
    );
  } else {
    (req as any).cookies = {};
  }
  next();
});

// --- DB init (lazy) ---
let dbInitialized = false;
app.use(async (_req, _res, next) => {
  if (!dbInitialized) {
    await initDb();
    dbInitialized = true;
  }
  next();
});

// --- Google OAuth ---
// 一時state保存（サーバーレスなのでcookieに保存）
app.get('/auth/google', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie('oauth_state', state, { ...COOKIE_OPTS, maxAge: 10 * 60 * 1000 });

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_CALLBACK_URL,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

app.get('/auth/google/callback', async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;
  if (typeof code !== 'string' || typeof state !== 'string') {
    return res.status(400).send('Invalid callback parameters.');
  }

  const expectedState = (req as any).cookies?.oauth_state;
  if (!expectedState || expectedState !== state) {
    return res.status(400).send('Invalid state parameter.');
  }
  res.clearCookie('oauth_state');

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_CALLBACK_URL, grant_type: 'authorization_code',
    }),
  });

  if (!tokenResponse.ok) { return res.status(500).send('Token exchange failed.'); }

  const tokenPayload = (await tokenResponse.json()) as { access_token: string };
  const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
  });
  if (!userResponse.ok) { return res.status(500).send('Failed to fetch user profile.'); }

  const user = (await userResponse.json()) as { sub: string; name?: string; email?: string; picture?: string };

  const token = signToken({ id: user.sub, name: user.name, email: user.email, picture: user.picture });
  res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
  res.redirect(FRONTEND_ORIGIN || '/');
});

app.get('/auth/me', (req, res) => {
  const token = (req as any).cookies?.[COOKIE_NAME];
  if (!token) { return res.status(401).json({ message: 'Unauthorized' }); }
  try {
    const payload = verifyToken(token);
    return res.json(payload);
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
});

app.post('/auth/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, COOKIE_OPTS);
  res.json({ ok: true });
});

// --- Dev login ---
app.post('/auth/dev-login', (req, res) => {
  if (process.env.NODE_ENV === 'production') { return res.status(404).json({ message: 'Not found' }); }
  const user = { id: 'local', name: '開発ユーザー', email: 'dev@localhost' };
  const token = signToken(user);
  res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
  res.json(user);
});

// --- API Routes ---
app.use('/api/books', requireAuth, bookRoutes);
app.use('/api/tasks', requireAuth, taskRoutes);
app.use('/api/goals', requireAuth, goalRoutes);

export default app;
