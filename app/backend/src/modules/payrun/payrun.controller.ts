import type { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import { payrunService } from './payrun.service.js';
import httpStatus from '../../utils/http-status.js';

export const listPayruns = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await payrunService.listPayruns(req.query as any) });
});

export const getPayrunById = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await payrunService.getPayrunById(req.params.id) });
});

export const createPayrun = asyncHandler(async (req: Request, res: Response) => {
  const data = await payrunService.createPayrun(req.body, req.user?.id);
  res.status(httpStatus.CREATED).json({ success: true, data });
});

export const performPayrunAction = asyncHandler(async (req: Request, res: Response) => {
  const data = await payrunService.performAction(req.params.id, req.body, req.user?.id);
  res.json({ success: true, data });
});

export const deletePayrun = asyncHandler(async (req: Request, res: Response) => {
  const data = await payrunService.deletePayrun(req.params.id);
  res.json({ success: true, data });
});
