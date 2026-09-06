import type { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import { payrunService } from './payrun.service.js';
import httpStatus from '../../utils/http-status.js';

export const listPayruns = asyncHandler(async (req: Request, res: Response) => {
  const data = await payrunService.listPayruns(req.query as any);
  res.json({ success: true, message: 'Payruns fetched successfully', data, payruns: data });
});

export const getPayrunById = asyncHandler(async (req: Request, res: Response) => {
  const data = await payrunService.getPayrunById(req.params.id);
  res.json({ success: true, message: 'Payrun retrieved', data });
});

export const createPayrun = asyncHandler(async (req: Request, res: Response) => {
  const data = await payrunService.createPayrun(req.body, req.user?.id);
  res.status(httpStatus.CREATED).json({ success: true, message: 'Payrun batch created and computed successfully', data });
});

export const performPayrunAction = asyncHandler(async (req: Request, res: Response) => {
  const data = await payrunService.performAction(req.params.id, req.body, req.user?.id);
  res.json({ success: true, message: `Payrun action ${req.body.action} performed`, data });
});

export const processPayrun = asyncHandler(async (req: Request, res: Response) => {
  const data = await payrunService.performAction(req.params.id, { action: 'VALIDATE' }, req.user?.id);
  res.json({ success: true, message: 'Payrun processed successfully', data });
});

export const deletePayrun = asyncHandler(async (req: Request, res: Response) => {
  const data = await payrunService.deletePayrun(req.params.id);
  res.json({ success: true, message: 'Payrun deleted successfully', data });
});
