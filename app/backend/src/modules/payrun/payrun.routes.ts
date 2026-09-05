import { Router } from 'express';
import validateRequest from '../../middleware/validate.middleware.js';
import { authenticate, requireMinRole } from '../../middleware/auth.middleware.js';
import {
  createPayrunSchema, payrunIdParamSchema, payrunQuerySchema, payrunActionSchema,
} from './payrun.schema.js';
import {
  listPayruns, getPayrunById, createPayrun, performPayrunAction, deletePayrun,
} from './payrun.controller.js';

const router: Router = Router();
router.use(authenticate);
router.use(requireMinRole('HR_PAYROLL_USER'));

router.get('/', validateRequest({ query: payrunQuerySchema }), listPayruns);
router.get('/:id', validateRequest({ params: payrunIdParamSchema }), getPayrunById);
router.post('/', validateRequest({ body: createPayrunSchema }), createPayrun);
router.patch('/:id/action', requireMinRole('HR_PAYROLL_MANAGER'), validateRequest({ params: payrunIdParamSchema, body: payrunActionSchema }), performPayrunAction);
router.delete('/:id', requireMinRole('HR_PAYROLL_MANAGER'), validateRequest({ params: payrunIdParamSchema }), deletePayrun);

export default router;
