import crypto from 'node:crypto';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
  FRONTEND_ORIGIN,
  SESSION_SECRET,
  PORT = '4000',
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL || !FRONTEND_ORIGIN || !SESSION_SECRET) {
  throw new Error('Missing required environment variables.');
}

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  }),
);

app.use(
  session({
    name: 'study_manager_session',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  }),
);

app.get('/auth/google', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  // CSRF対策のため、stateをセッションに保存して照合する。
  req.session.oauthState = state;

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

  if (!req.session.oauthState || req.session.oauthState !== state) {
    return res.status(400).send('Invalid state parameter.');
  }

  req.session.oauthState = undefined;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_CALLBACK_URL,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('Token exchange failed', errorText);
    return res.status(500).send('Token exchange failed.');
  }

  const tokenPayload = (await tokenResponse.json()) as {
    access_token: string;
  };

  const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${tokenPayload.access_token}`,
    },
  });

  if (!userResponse.ok) {
    const errorText = await userResponse.text();
    console.error('Userinfo fetch failed', errorText);
    return res.status(500).send('Failed to fetch user profile.');
  }

  const user = (await userResponse.json()) as {
    sub: string;
    name?: string;
    email?: string;
    picture?: string;
  };

  req.session.user = {
    id: user.sub,
    name: user.name,
    email: user.email,
    picture: user.picture,
  };

  // ログイン完了後はフロントのルートに戻す。
  res.redirect(new URL('/', FRONTEND_ORIGIN).toString());
});

app.get('/auth/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  return res.json(req.session.user);
});

app.post('/auth/logout', (req, res) => {
  // セッション破棄によりHTTP Only Cookieを失効させる。
  req.session.destroy((error) => {
    if (error) {
      console.error('Session destroy failed', error);
      return res.status(500).json({ message: 'Failed to logout' });
    }
    res.clearCookie('study_manager_session');
    return res.json({ ok: true });
  });
});

app.listen(Number(PORT), () => {
  console.log(`Auth server listening on http://localhost:${PORT}`);
});
