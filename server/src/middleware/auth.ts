import type { Request, Response, NextFunction } from 'express';

/**
 * Extracts the user ID from the session, or falls back to 'local' in
 * development mode so the API can be used without authentication.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const sessionUser = req.session?.user;

  if (sessionUser?.id) {
    // Authenticated via Google OAuth
    (req as any).userId = sessionUser.id;
    return next();
  }

  // Development bypass — allow unauthenticated access with a fixed user id
  if (process.env.NODE_ENV !== 'production') {
    (req as any).userId = 'local';
    return next();
  }

  res.status(401).json({ message: 'Unauthorized' });
}
