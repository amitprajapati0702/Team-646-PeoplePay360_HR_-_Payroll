import type { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import { dashboardService } from './dashboard.service.js';

export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: await dashboardService.getFullDashboard() });
});

export const getKPIs = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: await dashboardService.getKPIs() });
});

export const getDepartmentCost = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: await dashboardService.getSalaryCostByDepartment() });
});

export const getMonthlyTrend = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: await dashboardService.getMonthlyTrend() });
});

export const getAlerts = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: await dashboardService.getAlerts() });
});
