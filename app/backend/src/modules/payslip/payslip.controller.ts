import type { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import { payslipService } from './payslip.service.js';
import httpStatus from '../../utils/http-status.js';

export const getPayslipById = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await payslipService.getPayslipById(req.params.id) });
});

export const listPayslipsForPayrun = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await payslipService.listPayslipsForPayrun(req.params.payrunId) });
});

export const listPayslipsForEmployee = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await payslipService.listPayslipsForEmployee(req.params.employeeId) });
});

export const sendPayslipEmail = asyncHandler(async (req: Request, res: Response) => {
  const data = await payslipService.sendPayslipEmail(req.params.id);
  res.json({ success: true, data });
});

export const bulkSendEmails = asyncHandler(async (req: Request, res: Response) => {
  const data = await payslipService.bulkSendEmails(req.params.payrunId);
  res.json({ success: true, data });
});
