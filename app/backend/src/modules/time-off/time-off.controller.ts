import type { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import { timeOffService } from './time-off.service.js';
import httpStatus from '../../utils/http-status.js';

// Leave Types
export const listLeaveTypes = asyncHandler(async (req: Request, res: Response) => {
  const data = await timeOffService.listLeaveTypes(req.query as any);
  res.json({ success: true, message: 'Leave types retrieved', data, leaveTypes: data });
});
export const getLeaveTypeById = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Leave type retrieved', data: await timeOffService.getLeaveTypeById(req.params.id) });
});
export const createLeaveType = asyncHandler(async (req: Request, res: Response) => {
  res.status(httpStatus.CREATED).json({ success: true, message: 'Leave type created', data: await timeOffService.createLeaveType(req.body) });
});
export const updateLeaveType = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Leave type updated', data: await timeOffService.updateLeaveType(req.params.id, req.body) });
});
export const deleteLeaveType = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Leave type deleted', data: await timeOffService.deleteLeaveType(req.params.id) });
});

// Allocations
export const listAllocations = asyncHandler(async (req: Request, res: Response) => {
  const query = { ...(req.query as any) };
  if (req.user?.role === 'EMPLOYEE' && req.user.employeeId) {
    query.employeeId = req.user.employeeId;
  }
  const data = await timeOffService.listAllocations(query);
  res.json({ success: true, message: 'Allocations retrieved', data, allocations: data });
});
export const getAllocationById = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Allocation retrieved', data: await timeOffService.getAllocationById(req.params.id) });
});
export const createAllocation = asyncHandler(async (req: Request, res: Response) => {
  res.status(httpStatus.CREATED).json({ success: true, message: 'Allocation created', data: await timeOffService.createAllocation(req.body) });
});
export const approveAllocation = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Allocation processed', data: await timeOffService.approveAllocation(req.params.id, req.body, req.user!.id) });
});
export const deleteAllocation = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Allocation deleted', data: await timeOffService.deleteAllocation(req.params.id) });
});

// Requests
export const listRequests = asyncHandler(async (req: Request, res: Response) => {
  const query = { ...(req.query as any) };
  if (req.user?.role === 'EMPLOYEE' && req.user.employeeId) {
    query.employeeId = req.user.employeeId;
  }
  const data = await timeOffService.listRequests(query);
  res.json({ success: true, message: 'Leave requests retrieved', data, requests: data });
});
export const getRequestById = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Leave request retrieved', data: await timeOffService.getRequestById(req.params.id) });
});
export const createRequest = asyncHandler(async (req: Request, res: Response) => {
  const body = { ...req.body };
  if (req.user?.role === 'EMPLOYEE' && req.user.employeeId) {
    body.employeeId = req.user.employeeId;
  }
  res.status(httpStatus.CREATED).json({ success: true, message: 'Leave request created', data: await timeOffService.createRequest(body) });
});
export const approveRequest = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Leave request approved', data: await timeOffService.approveRequest(req.params.id, req.body, req.user!.id) });
});
export const rejectRequest = asyncHandler(async (req: Request, res: Response) => {
  const reason = req.body?.refusalReason || req.body?.reason;
  res.json({ success: true, message: 'Leave request rejected', data: await timeOffService.rejectRequest(req.params.id, reason, req.user!.id) });
});
export const deleteRequest = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Leave request deleted', data: await timeOffService.deleteRequest(req.params.id) });
});
