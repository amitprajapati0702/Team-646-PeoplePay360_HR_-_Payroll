import type { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import { organizationService } from './organization.service.js';
import httpStatus from '../../utils/http-status.js';

// ─── Departments ────────────────────────────────────────────────
export const listDepartments = asyncHandler(async (req: Request, res: Response) => {
  const data = await organizationService.listDepartments(req.query as any);
  res.json({ success: true, data, departments: data });
});

export const getDepartmentById = asyncHandler(async (req: Request, res: Response) => {
  const data = await organizationService.getDepartmentById(req.params.id);
  res.json({ success: true, data });
});

export const createDepartment = asyncHandler(async (req: Request, res: Response) => {
  const data = await organizationService.createDepartment(req.body);
  res.status(httpStatus.CREATED).json({ success: true, data });
});

export const updateDepartment = asyncHandler(async (req: Request, res: Response) => {
  const data = await organizationService.updateDepartment(req.params.id, req.body);
  res.json({ success: true, data });
});

export const deleteDepartment = asyncHandler(async (req: Request, res: Response) => {
  const data = await organizationService.deleteDepartment(req.params.id);
  res.json({ success: true, data });
});

// ─── Job Positions ──────────────────────────────────────────────
export const listJobPositions = asyncHandler(async (req: Request, res: Response) => {
  const data = await organizationService.listJobPositions(req.query as any);
  res.json({ success: true, data, jobPositions: data });
});

export const getJobPositionById = asyncHandler(async (req: Request, res: Response) => {
  const data = await organizationService.getJobPositionById(req.params.id);
  res.json({ success: true, data });
});

export const createJobPosition = asyncHandler(async (req: Request, res: Response) => {
  const data = await organizationService.createJobPosition(req.body);
  res.status(httpStatus.CREATED).json({ success: true, data });
});

export const updateJobPosition = asyncHandler(async (req: Request, res: Response) => {
  const data = await organizationService.updateJobPosition(req.params.id, req.body);
  res.json({ success: true, data });
});

export const deleteJobPosition = asyncHandler(async (req: Request, res: Response) => {
  const data = await organizationService.deleteJobPosition(req.params.id);
  res.json({ success: true, data });
});

// ─── Working Schedules ──────────────────────────────────────────
export const listWorkingSchedules = asyncHandler(async (req: Request, res: Response) => {
  const data = await organizationService.listWorkingSchedules(req.query as any);
  res.json({ success: true, data, workingSchedules: data });
});

export const getWorkingScheduleById = asyncHandler(async (req: Request, res: Response) => {
  const data = await organizationService.getWorkingScheduleById(req.params.id);
  res.json({ success: true, data });
});

export const createWorkingSchedule = asyncHandler(async (req: Request, res: Response) => {
  const data = await organizationService.createWorkingSchedule(req.body);
  res.status(httpStatus.CREATED).json({ success: true, data });
});

export const updateWorkingSchedule = asyncHandler(async (req: Request, res: Response) => {
  const data = await organizationService.updateWorkingSchedule(req.params.id, req.body);
  res.json({ success: true, data });
});

export const deleteWorkingSchedule = asyncHandler(async (req: Request, res: Response) => {
  const data = await organizationService.deleteWorkingSchedule(req.params.id);
  res.json({ success: true, data });
});
