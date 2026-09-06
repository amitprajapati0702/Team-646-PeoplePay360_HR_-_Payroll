import { Router } from 'express';
import validateRequest from '../../middleware/validate.middleware.js';
import { authenticate, requireMinRole } from '../../middleware/auth.middleware.js';
import { payrunBatchRateLimiter } from '../../middleware/rate-limit.middleware.js';
import { z } from 'zod';
import {
  getPayslipById, listPayslipsForPayrun, listPayslipsForEmployee, sendPayslipEmail, bulkSendEmails,
} from './payslip.controller.js';

const idParam = z.object({ id: z.string().uuid() });
const payrunIdParam = z.object({ payrunId: z.string().uuid() });
const employeeIdParam = z.object({ employeeId: z.string().uuid() });

const router: Router = Router();
router.use(authenticate);

router.get('/:id', validateRequest({ params: idParam }), getPayslipById);
router.get('/payrun/:payrunId', validateRequest({ params: payrunIdParam }), listPayslipsForPayrun);
router.get('/employee/:employeeId', validateRequest({ params: employeeIdParam }), listPayslipsForEmployee);
router.post('/:id/send-email', requireMinRole('HR_PAYROLL_USER'), validateRequest({ params: idParam }), sendPayslipEmail);
router.post('/:id/email', requireMinRole('HR_PAYROLL_USER'), validateRequest({ params: idParam }), sendPayslipEmail);
router.post('/payrun/:payrunId/send-all', payrunBatchRateLimiter, requireMinRole('HR_PAYROLL_USER'), validateRequest({ params: payrunIdParam }), bulkSendEmails);
router.post('/bulk-email/:payrunId', payrunBatchRateLimiter, requireMinRole('HR_PAYROLL_USER'), validateRequest({ params: payrunIdParam }), bulkSendEmails);

export default router;
