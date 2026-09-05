import { Router } from 'express';
import validateRequest from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { loginBodySchema } from './auth.schema.js';
import { login, logout, getMe } from './auth.controller.js';

const router: Router = Router();

router.post('/login', validateRequest({ body: loginBodySchema }), login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

export default router;
