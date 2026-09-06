import type { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import { payslipService } from './payslip.service.js';
import httpStatus from '../../utils/http-status.js';

import { db } from '../../infrastructure/database/client.js';
import { employees } from '../../infrastructure/database/schema/index.js';
import { eq } from 'drizzle-orm';
import ApiError from '../../utils/Apierror.js';

export const getPayslipById = asyncHandler(async (req: Request, res: Response) => {
  const payslip = await payslipService.getPayslipById(req.params.id);
  if (req.user?.role === 'EMPLOYEE') {
    let userEmpId = req.user.employeeId;
    if (!userEmpId && req.user.id) {
      const emp = await db.query.employees.findFirst({
        where: eq(employees.userId, req.user.id),
        columns: { id: true },
      });
      userEmpId = emp?.id;
    }
    if (userEmpId && payslip.employeeId !== userEmpId) {
      throw new ApiError({
        statuscode: httpStatus.FORBIDDEN,
        message: 'You are not authorized to view this payslip.',
        errorcode: 'FORBIDDEN',
      });
    }
  }
  res.json({ success: true, data: payslip });
});

export const getMyPayslips = asyncHandler(async (req: Request, res: Response) => {
  let targetEmpId = req.user?.employeeId;
  if (!targetEmpId && req.user?.id) {
    const emp = await db.query.employees.findFirst({
      where: eq(employees.userId, req.user.id),
      columns: { id: true },
    });
    targetEmpId = emp?.id;
  }
  if (!targetEmpId && req.user?.email) {
    const emp = await db.query.employees.findFirst({
      where: eq(employees.workEmail, req.user.email.toLowerCase()),
      columns: { id: true },
    });
    if (emp) {
      targetEmpId = emp.id;
      if (req.user?.id) {
        await db.update(employees).set({ userId: req.user.id }).where(eq(employees.id, emp.id));
      }
    }
  }
  if (!targetEmpId) {
    return res.json({ success: true, data: [] });
  }
  res.json({ success: true, data: await payslipService.listPayslipsForEmployee(targetEmpId) });
});

export const listPayslipsForPayrun = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await payslipService.listPayslipsForPayrun(req.params.payrunId) });
});

export const listPayslipsForEmployee = asyncHandler(async (req: Request, res: Response) => {
  let targetEmpId = req.params.employeeId;
  if (req.user?.role === 'EMPLOYEE') {
    let userEmpId = req.user.employeeId;
    if (!userEmpId && req.user?.id) {
      const emp = await db.query.employees.findFirst({
        where: eq(employees.userId, req.user.id),
        columns: { id: true },
      });
      userEmpId = emp?.id;
    }
    if (!userEmpId && req.user?.email) {
      const emp = await db.query.employees.findFirst({
        where: eq(employees.workEmail, req.user.email.toLowerCase()),
        columns: { id: true },
      });
      userEmpId = emp?.id;
    }
    targetEmpId = userEmpId || targetEmpId;
  }
  res.json({ success: true, data: await payslipService.listPayslipsForEmployee(targetEmpId) });
});

export const sendPayslipEmail = asyncHandler(async (req: Request, res: Response) => {
  const data = await payslipService.sendPayslipEmail(req.params.id);
  res.json({ success: true, data });
});

export const bulkSendEmails = asyncHandler(async (req: Request, res: Response) => {
  const data = await payslipService.bulkSendEmails(req.params.payrunId);
  res.json({ success: true, data });
});
