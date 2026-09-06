import { payrunRepository } from './payrun.repository.js';
import ApiError from '../../utils/Apierror.js';
import httpStatus from '../../utils/http-status.js';
import { contractsService } from '../contracts/contracts.service.js';
import { attendanceService } from '../attendance/attendance.service.js';
import { timeOffService } from '../time-off/time-off.service.js';
import type { CreatePayrunInput, PayrunQueryInput, PayrunActionInput } from './payrun.schema.js';

interface SalaryContext {
  contract_wage: number;
  worked_days: number;
  planned_days: number;
  approved_leave_days: number;
  unpaid_leave_days: number;
  [key: string]: number;
}

function evaluateRule(
  rule: { computationType: string; fixedAmount?: string | null; percentage?: string | null; percentageBaseRuleCode?: string | null; formulaExpression?: string | null },
  ctx: SalaryContext
): number {
  try {
    switch (rule.computationType) {
      case 'FIXED':
        return parseFloat(rule.fixedAmount ?? '0') || 0;

      case 'PERCENTAGE': {
        const base = rule.percentageBaseRuleCode ? (ctx[rule.percentageBaseRuleCode] ?? 0) : ctx.contract_wage;
        const pct = parseFloat(rule.percentage ?? '0') || 0;
        return Math.round((base * pct) / 100 * 100) / 100;
      }

      case 'FORMULA': {
        if (!rule.formulaExpression) return 0;
        let expr = rule.formulaExpression;
        for (const [key, val] of Object.entries(ctx)) {
          expr = expr.replace(new RegExp(`\\b${key}\\b`, 'g'), String(val));
        }
        if (/[^0-9+\-*/().% ]/.test(expr)) return 0;
        // eslint-disable-next-line no-eval
        const result = eval(expr);
        return typeof result === 'number' ? Math.round(result * 100) / 100 : 0;
      }

      default:
        return 0;
    }
  } catch {
    return 0;
  }
}

function calculateWorkingDays(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  let count = 0;
  const current = new Date(startDate);
  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export class PayrunService {
  async listPayruns(query: PayrunQueryInput) {
    return await payrunRepository.findMany(query);
  }

  async getPayrunById(id: string) {
    const payrun = await payrunRepository.findById(id);
    if (!payrun) {
      throw new ApiError({ statuscode: httpStatus.NOT_FOUND, message: 'Payrun not found.', errorcode: 'PAYRUN_NOT_FOUND' });
    }
    return payrun;
  }

  async createPayrun(data: CreatePayrunInput, actingUserId?: string) {
    const existing = await payrunRepository.findByBatchCode(data.batchCode);
    if (existing) {
      throw new ApiError({ statuscode: httpStatus.CONFLICT, message: `Batch code '${data.batchCode}' already exists.`, errorcode: 'BATCH_CODE_EXISTS' });
    }

    const payrun = await payrunRepository.create({
      name: data.name,
      batchCode: data.batchCode,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      defaultSalaryStructureId: data.defaultSalaryStructureId ?? null,
      status: 'COMPUTING',
      createdByUserId: actingUserId ?? null,
      notes: data.notes ?? null,
    });

    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    let payslipCount = 0;

    for (const employeeId of data.employeeIds) {
      try {
        await this.computePayslipForEmployee(payrun.id, employeeId, data.periodStart, data.periodEnd);
        payslipCount++;
      } catch (err) {
        console.error(`Failed to compute payslip for employee ${employeeId}:`, err);
      }
    }

    const createdPayslips = await payrunRepository.findPayslipsForPayrun(payrun.id);

    for (const ps of createdPayslips) {
      totalGross += parseFloat(ps.grossAmount ?? '0');
      totalDeductions += parseFloat(ps.deductionAmount ?? '0');
      totalNet += parseFloat(ps.netAmount ?? '0');
    }

    const updated = await payrunRepository.update(payrun.id, {
      status: 'COMPUTED',
      totalGrossAmount: String(Math.round(totalGross * 100) / 100),
      totalDeductionAmount: String(Math.round(totalDeductions * 100) / 100),
      totalNetAmount: String(Math.round(totalNet * 100) / 100),
      totalPayslipCount: payslipCount,
      updatedAt: new Date(),
    });

    return this.getPayrunById(updated.id);
  }

  private async computePayslipForEmployee(
    payrunId: string,
    employeeId: string,
    periodStart: string,
    periodEnd: string
  ) {
    const contract = await contractsService.findActiveContractForPeriod(employeeId, periodStart, periodEnd);
    if (!contract) {
      throw new Error(`No active contract found for employee ${employeeId} in period ${periodStart} - ${periodEnd}`);
    }

    const employee = await payrunRepository.findEmployeeBankDetails(employeeId);
    const attendanceSummary = await attendanceService.getSummaryForEmployee(employeeId, periodStart, periodEnd);
    const approvedLeaveDays = await timeOffService.getApprovedLeaveDays(employeeId, periodStart, periodEnd);

    const plannedDays = calculateWorkingDays(periodStart, periodEnd);
    const workedDays = attendanceSummary.presentDays;
    const unpaidLeaveDays = Math.max(0, plannedDays - workedDays - approvedLeaveDays);

    const structure = contract.salaryStructure;
    const rules = structure.structureRules
      .map((sr) => sr.salaryRule)
      .filter((r) => r.isActive)
      .sort((a, b) => a.sequence - b.sequence);

    const contractWage = parseFloat(String(contract.wage)) || 0;
    const ctx: SalaryContext = {
      contract_wage: contractWage,
      worked_days: workedDays,
      planned_days: plannedDays,
      approved_leave_days: approvedLeaveDays,
      unpaid_leave_days: unpaidLeaveDays,
    };

    let grossAmount = 0;
    let deductionAmount = 0;
    const payslipLineData: Array<{
      categoryId: string;
      salaryRuleId: string;
      name: string;
      code: string;
      categoryCode: string;
      sequence: number;
      rate?: string;
      baseAmount?: string;
      totalAmount: string;
    }> = [];

    for (const rule of rules) {
      const amount = evaluateRule(rule, ctx);
      ctx[rule.code] = amount;

      if (!rule.appearsOnPayslip) continue;

      const catCode = rule.category.code;

      if (['DED', 'PF', 'TAX', 'TDS'].includes(catCode)) {
        deductionAmount += amount;
      } else if (!['GROSS', 'NET'].includes(catCode)) {
        grossAmount += amount;
      }

      payslipLineData.push({
        categoryId: rule.categoryId,
        salaryRuleId: rule.id,
        name: rule.name,
        code: rule.code,
        categoryCode: catCode,
        sequence: rule.sequence,
        rate: rule.computationType === 'PERCENTAGE' ? rule.percentage ?? undefined : undefined,
        baseAmount: rule.computationType === 'PERCENTAGE' && rule.percentageBaseRuleCode
          ? String(ctx[rule.percentageBaseRuleCode] ?? 0)
          : undefined,
        totalAmount: String(amount),
      });
    }

    const netAmount = grossAmount - deductionAmount;

    const validationWarnings: string[] = [];
    if (!employee?.bankName || !employee?.bankAccountNumber) {
      validationWarnings.push('Missing bank details — payment may be delayed');
    }
    if (workedDays === 0) {
      validationWarnings.push('No attendance records found for this period');
    }

    const payslipNumber = `PS-${payrunId.slice(0, 8).toUpperCase()}-${employeeId.slice(0, 6).toUpperCase()}`;

    const existing = await payrunRepository.findPayslipByPayrunAndEmployee(payrunId, employeeId);
    if (existing) {
      return existing;
    }

    const payslip = await payrunRepository.createPayslip({
      payslipNumber,
      payrunId,
      employeeId,
      contractId: contract.id,
      salaryStructureId: contract.salaryStructureId,
      periodStart,
      periodEnd,
      status: 'COMPUTED',
      plannedWorkingDays: String(plannedDays),
      actualWorkedDays: String(workedDays),
      approvedLeaveDays: String(approvedLeaveDays),
      unpaidLeaveDays: String(unpaidLeaveDays),
      baseWage: String(contractWage),
      grossAmount: String(Math.round(grossAmount * 100) / 100),
      deductionAmount: String(Math.round(deductionAmount * 100) / 100),
      netAmount: String(Math.round(netAmount * 100) / 100),
      validationWarnings,
    });

    if (payslipLineData.length > 0) {
      await payrunRepository.createPayslipLines(
        payslipLineData.map((line) => ({
          payslipId: payslip.id,
          ...line,
        }))
      );
    }

    return payslip;
  }

  async performAction(id: string, data: PayrunActionInput, actingUserId?: string) {
    const payrun = await payrunRepository.findById(id);
    if (!payrun) {
      throw new ApiError({ statuscode: httpStatus.NOT_FOUND, message: 'Payrun not found.', errorcode: 'PAYRUN_NOT_FOUND' });
    }

    let newStatus: string;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (data.action === 'VALIDATE') {
      if (!['COMPUTED', 'DRAFT'].includes(payrun.status)) {
        throw new ApiError({ statuscode: httpStatus.BAD_REQUEST, message: 'Only computed payruns can be validated.', errorcode: 'INVALID_STATUS' });
      }
      newStatus = 'VALIDATED';
      updateData.validatedByUserId = actingUserId ?? null;
      updateData.validatedAt = new Date();
      await payrunRepository.updatePayslipsStatusByPayrun(id, 'VALIDATED');
    } else if (data.action === 'MARK_PAID') {
      if (payrun.status !== 'VALIDATED') {
        throw new ApiError({ statuscode: httpStatus.BAD_REQUEST, message: 'Only validated payruns can be marked as paid.', errorcode: 'INVALID_STATUS' });
      }
      newStatus = 'PAID';
      updateData.paidAt = new Date();
      await payrunRepository.updatePayslipsStatusByPayrun(id, 'PAID');
    } else {
      newStatus = 'CANCELLED';
      await payrunRepository.updatePayslipsStatusByPayrun(id, 'CANCELLED');
    }

    updateData.status = newStatus;
    if (data.notes) updateData.notes = data.notes;

    await payrunRepository.update(id, updateData);
    return this.getPayrunById(id);
  }

  async deletePayrun(id: string) {
    const payrun = await payrunRepository.findById(id);
    if (!payrun) {
      throw new ApiError({ statuscode: httpStatus.NOT_FOUND, message: 'Payrun not found.', errorcode: 'PAYRUN_NOT_FOUND' });
    }
    if (['VALIDATED', 'PAID'].includes(payrun.status)) {
      throw new ApiError({ statuscode: httpStatus.BAD_REQUEST, message: 'Cannot delete a validated or paid payrun.', errorcode: 'PAYRUN_LOCKED' });
    }
    return await payrunRepository.delete(id);
  }
}

export const payrunService = new PayrunService();
