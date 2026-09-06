import { Router } from 'express';
import validateRequest from '../../middleware/validate.middleware.js';
import { authenticate, requireMinRole } from '../../middleware/auth.middleware.js';
import {
  createLeaveTypeSchema, updateLeaveTypeSchema,
  createLeaveAllocationSchema, approveAllocationSchema,
  createLeaveRequestSchema, approveRequestSchema,
  idParamSchema, leaveTypeQuerySchema, allocationQuerySchema, requestQuerySchema,
} from './time-off.schema.js';
import {
  listLeaveTypes, getLeaveTypeById, createLeaveType, updateLeaveType, deleteLeaveType,
  listAllocations, getAllocationById, createAllocation, approveAllocation, deleteAllocation,
  listRequests, getRequestById, createRequest, approveRequest, rejectRequest, deleteRequest,
} from './time-off.controller.js';

const router: Router = Router();
router.use(authenticate);

// Leave Types
router.get('/types', validateRequest({ query: leaveTypeQuerySchema }), listLeaveTypes);
router.get('/types/:id', validateRequest({ params: idParamSchema }), getLeaveTypeById);
router.post('/types', requireMinRole('HR_MANAGER'), validateRequest({ body: createLeaveTypeSchema }), createLeaveType);
router.patch('/types/:id', requireMinRole('HR_MANAGER'), validateRequest({ params: idParamSchema, body: updateLeaveTypeSchema }), updateLeaveType);
router.delete('/types/:id', requireMinRole('ADMIN'), validateRequest({ params: idParamSchema }), deleteLeaveType);

// Allocations
router.get('/allocations', validateRequest({ query: allocationQuerySchema }), listAllocations);
router.get('/allocations/:id', validateRequest({ params: idParamSchema }), getAllocationById);
router.post('/allocations', requireMinRole('HR_MANAGER'), validateRequest({ body: createLeaveAllocationSchema }), createAllocation);
router.patch('/allocations/:id/action', requireMinRole('HR_MANAGER'), validateRequest({ params: idParamSchema, body: approveAllocationSchema }), approveAllocation);
router.delete('/allocations/:id', requireMinRole('HR_MANAGER'), validateRequest({ params: idParamSchema }), deleteAllocation);

// Requests
router.get('/requests', validateRequest({ query: requestQuerySchema }), listRequests);
router.get('/requests/:id', validateRequest({ params: idParamSchema }), getRequestById);
router.post('/requests', validateRequest({ body: createLeaveRequestSchema }), createRequest);
// Standard LLD Approval & Rejection endpoints (Managers / HR can approve or reject)
router.patch('/requests/:id/approve', validateRequest({ params: idParamSchema }), approveRequest);
router.patch('/requests/:id/reject', validateRequest({ params: idParamSchema }), rejectRequest);
router.patch('/requests/:id/action', validateRequest({ params: idParamSchema, body: approveRequestSchema }), approveRequest);
router.delete('/requests/:id', validateRequest({ params: idParamSchema }), deleteRequest);

export default router;
