import type { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import { timeOffService } from './time-off.service.js';
import httpStatus from '../../utils/http-status.js';

// Leave Types
export const listLeaveTypes = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await timeOffService.listLeaveTypes(req.query as any) });
});
export const getLeaveTypeById = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await timeOffService.getLeaveTypeById(req.params.id) });
});
export const createLeaveType = asyncHandler(async (req: Request, res: Response) => {
  res.status(httpStatus.CREATED).json({ success: true, data: await timeOffService.createLeaveType(req.body) });
});
export const updateLeaveType = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await timeOffService.updateLeaveType(req.params.id, req.body) });
});
export const deleteLeaveType = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await timeOffService.deleteLeaveType(req.params.id) });
});

// Allocations
export const listAllocations = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await timeOffService.listAllocations(req.query as any) });
});
export const getAllocationById = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await timeOffService.getAllocationById(req.params.id) });
});
export const createAllocation = asyncHandler(async (req: Request, res: Response) => {
  res.status(httpStatus.CREATED).json({ success: true, data: await timeOffService.createAllocation(req.body) });
});
export const approveAllocation = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await timeOffService.approveAllocation(req.params.id, req.body, req.user!.id) });
});
export const deleteAllocation = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await timeOffService.deleteAllocation(req.params.id) });
});

// Requests
export const listRequests = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await timeOffService.listRequests(req.query as any) });
});
export const getRequestById = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await timeOffService.getRequestById(req.params.id) });
});
export const createRequest = asyncHandler(async (req: Request, res: Response) => {
  res.status(httpStatus.CREATED).json({ success: true, data: await timeOffService.createRequest(req.body) });
});
export const approveRequest = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await timeOffService.approveRequest(req.params.id, req.body, req.user!.id) });
});
export const deleteRequest = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await timeOffService.deleteRequest(req.params.id) });
});
