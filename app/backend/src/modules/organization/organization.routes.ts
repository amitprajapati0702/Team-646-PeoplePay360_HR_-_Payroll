import { Router } from 'express';
import validateRequest from '../../middleware/validate.middleware.js';
import { authenticate, requireMinRole } from '../../middleware/auth.middleware.js';
import {
  createDepartmentSchema, updateDepartmentSchema,
  createJobPositionSchema, updateJobPositionSchema,
  createWorkingScheduleSchema, updateWorkingScheduleSchema,
  idParamSchema, listQuerySchema,
} from './organization.schema.js';
import {
  listDepartments, getDepartmentById, createDepartment, updateDepartment, deleteDepartment,
  listJobPositions, getJobPositionById, createJobPosition, updateJobPosition, deleteJobPosition,
  listWorkingSchedules, getWorkingScheduleById, createWorkingSchedule, updateWorkingSchedule, deleteWorkingSchedule,
} from './organization.controller.js';

const router: Router = Router();

// All org routes require at least HR_MANAGER
router.use(authenticate);

// Departments
router.get('/departments', validateRequest({ query: listQuerySchema }), listDepartments);
router.get('/departments/:id', validateRequest({ params: idParamSchema }), getDepartmentById);
router.post('/departments', requireMinRole('HR_MANAGER'), validateRequest({ body: createDepartmentSchema }), createDepartment);
router.patch('/departments/:id', requireMinRole('HR_MANAGER'), validateRequest({ params: idParamSchema, body: updateDepartmentSchema }), updateDepartment);
router.delete('/departments/:id', requireMinRole('ADMIN'), validateRequest({ params: idParamSchema }), deleteDepartment);

// Job Positions
router.get('/job-positions', validateRequest({ query: listQuerySchema }), listJobPositions);
router.get('/job-positions/:id', validateRequest({ params: idParamSchema }), getJobPositionById);
router.post('/job-positions', requireMinRole('HR_MANAGER'), validateRequest({ body: createJobPositionSchema }), createJobPosition);
router.patch('/job-positions/:id', requireMinRole('HR_MANAGER'), validateRequest({ params: idParamSchema, body: updateJobPositionSchema }), updateJobPosition);
router.delete('/job-positions/:id', requireMinRole('ADMIN'), validateRequest({ params: idParamSchema }), deleteJobPosition);

// Working Schedules
router.get('/working-schedules', validateRequest({ query: listQuerySchema }), listWorkingSchedules);
router.get('/working-schedules/:id', validateRequest({ params: idParamSchema }), getWorkingScheduleById);
router.post('/working-schedules', requireMinRole('HR_MANAGER'), validateRequest({ body: createWorkingScheduleSchema }), createWorkingSchedule);
router.patch('/working-schedules/:id', requireMinRole('HR_MANAGER'), validateRequest({ params: idParamSchema, body: updateWorkingScheduleSchema }), updateWorkingSchedule);
router.delete('/working-schedules/:id', requireMinRole('ADMIN'), validateRequest({ params: idParamSchema }), deleteWorkingSchedule);

export default router;
