import type { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import { attendanceService } from './attendance.service.js';
import { AttendanceQueryInput } from './attendance.schema.js';
import ApiError from '../../utils/Apierror.js';
import httpStatus from '../../utils/http-status.js';

export const listAttendance = asyncHandler(async (req: Request, res: Response) => {
  const query: AttendanceQueryInput = { ...(req.query as unknown as AttendanceQueryInput) };
  if (req.user?.role === 'EMPLOYEE' && req.user.employeeId) {
    query.employeeId = req.user.employeeId;
  }
  const data = await attendanceService.listAttendance(query);
  res.json({ success: true, message: 'Attendance records fetched', data });
});

export const getAttendanceById = asyncHandler(async (req: Request, res: Response) => {
  const data = await attendanceService.getAttendanceById(req.params.id);
  res.json({ success: true, data });
});

/**
 * Check In API: POST /attendance/check-in
 */
export const checkIn = asyncHandler(async (req: Request, res: Response) => {
  const employeeId = req.user?.role === 'EMPLOYEE' ? req.user.employeeId : (req.body.employeeId || req.user?.employeeId);
  if (!employeeId) {
    throw new ApiError({
      statuscode: httpStatus.BAD_REQUEST,
      message: 'Employee ID is required to record check-in.',
      errorcode: 'MISSING_EMPLOYEE_ID',
    });
  }
  const data = await attendanceService.checkIn(employeeId, req.body.checkIn);
  res.status(httpStatus.CREATED).json({ success: true, message: 'Checked in successfully', data });
});

/**
 * Check Out API: POST /attendance/check-out
 */
export const checkOut = asyncHandler(async (req: Request, res: Response) => {
  const employeeId = req.user?.role === 'EMPLOYEE' ? req.user.employeeId : (req.body.employeeId || req.user?.employeeId);
  if (!employeeId) {
    throw new ApiError({
      statuscode: httpStatus.BAD_REQUEST,
      message: 'Employee ID is required to record check-out.',
      errorcode: 'MISSING_EMPLOYEE_ID',
    });
  }
  const data = await attendanceService.checkOut(employeeId, req.body.checkOut);
  res.json({ success: true, message: 'Checked out successfully', data });
});

export const createAttendance = asyncHandler(async (req: Request, res: Response) => {
  const body = { ...req.body };
  if (req.user?.role === 'EMPLOYEE' && req.user.employeeId) {
    body.employeeId = req.user.employeeId;
  }
  const data = await attendanceService.createAttendance(body, req.user?.id);
  res.status(httpStatus.CREATED).json({ success: true, message: 'Attendance created', data });
});

export const updateAttendance = asyncHandler(async (req: Request, res: Response) => {
  const data = await attendanceService.updateAttendance(req.params.id, req.body, req.user?.id);
  res.json({ success: true, message: 'Attendance updated', data });
});

export const deleteAttendance = asyncHandler(async (req: Request, res: Response) => {
  const data = await attendanceService.deleteAttendance(req.params.id);
  res.json({ success: true, message: 'Attendance deleted', data });
});
