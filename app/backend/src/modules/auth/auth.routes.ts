import { Router } from 'express';
import validateRequest from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authRateLimiter } from '../../middleware/rate-limit.middleware.js';
import {
  registerBodySchema,
  loginBodySchema,
  refreshTokenBodySchema,
  changePasswordBodySchema,
} from './auth.schema.js';
import {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  changePassword,
  listSessions,
  revokeSession,
  revokeAllOtherSessions,
} from './auth.controller.js';

const router: Router = Router();

// Public Authentication Endpoints (rate-limited)
router.post('/register', authRateLimiter, validateRequest({ body: registerBodySchema }), register);
router.post('/login', authRateLimiter, validateRequest({ body: loginBodySchema }), login);
router.post('/refresh', validateRequest({ body: refreshTokenBodySchema }), refreshToken);

// Authenticated Endpoints
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.patch('/change-password', authenticate, validateRequest({ body: changePasswordBodySchema }), changePassword);

// Session Management Endpoints
router.get('/sessions', authenticate, listSessions);
router.delete('/sessions/:sessionId', authenticate, revokeSession);
router.post('/sessions/revoke-all', authenticate, revokeAllOtherSessions);

export default router;
