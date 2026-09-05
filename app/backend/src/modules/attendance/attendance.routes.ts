import { Router } from 'express';
import validateRequest from '../../middleware/validate.middleware.js';
import { authenticate, requireMinRole } from '../../middleware/auth.middleware.js';
import {
  createAttendanceSchema, updateAttendanceSchema, attendanceIdParamSchema, attendanceQuerySchema,
} from './attendance.schema.js';
import {
  listAttendance, getAttendanceById, createAttendance, updateAttendance, deleteAttendance,
} from './attendance.controller.js';

const router: Router = Router();

router.use(authenticate);

router.get('/', validateRequest({ query: attendanceQuerySchema }), listAttendance);
router.get('/:id', validateRequest({ params: attendanceIdParamSchema }), getAttendanceById);
// Employees can create their own attendance; HR can create for anyone
router.post('/', validateRequest({ body: createAttendanceSchema }), createAttendance);
// Only HR+ can update/delete (manual corrections)
router.patch('/:id', requireMinRole('HR_MANAGER'), validateRequest({ params: attendanceIdParamSchema, body: updateAttendanceSchema }), updateAttendance);
router.delete('/:id', requireMinRole('HR_MANAGER'), validateRequest({ params: attendanceIdParamSchema }), deleteAttendance);

export default router;
