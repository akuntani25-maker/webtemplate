import type { AuthUser } from '../decorators';

// Augmentasi Express Request agar `req.user` bertipe.
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
