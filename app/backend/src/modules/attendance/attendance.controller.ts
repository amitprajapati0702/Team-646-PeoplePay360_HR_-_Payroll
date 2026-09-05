import type { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import { attendanceService } from './attendance.service.js';
import httpStatus from '../../utils/http-status.js';

export const listAttendance = asyncHandler(async (req: Request, res: Response) => {
  const data = await attendanceService.listAttendance(req.query as any);
  res.json({ success: true, data });
});

export const getAttendanceById = asyncHandler(async (req: Request, res: Response) => {
  const data = await attendanceService.getAttendanceById(req.params.id);
  res.json({ success: true, data });
});

export const createAttendance = asyncHandler(async (req: Request, res: Response) => {
  const data = await attendanceService.createAttendance(req.body, req.user?.id);
  res.status(httpStatus.CREATED).json({ success: true, data });
});

export const updateAttendance = asyncHandler(async (req: Request, res: Response) => {
  const data = await attendanceService.updateAttendance(req.params.id, req.body, req.user?.id);
  res.json({ success: true, data });
});

export const deleteAttendance = asyncHandler(async (req: Request, res: Response) => {
  const data = await attendanceService.deleteAttendance(req.params.id);
  res.json({ success: true, data });
});
