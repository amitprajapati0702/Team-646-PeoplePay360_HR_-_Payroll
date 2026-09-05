import { db } from '../../infrastructure/database/client.js';
import { payruns, payslips, payslipLines, employees, contracts } from '../../infrastructure/database/schema/index.js';
import { eq, and, inArray } from 'drizzle-orm';
import ApiError from '../../utils/Apierror.js';
import httpStatus from '../../utils/http-status.js';
import { contractsService } from '../contracts/contracts.service.js';
import { attendanceService } from '../attendance/attendance.service.js';
import { timeOffService } from '../time-off/time-off.service.js';
import type { CreatePayrunInput, UpdatePayrunInput, PayrunQueryInput, PayrunActionInput } from './payrun.schema.js';

// ─── Payroll Formula Engine ─────────────────────────────────────────────────
interface SalaryContext {
  contract_wage: number;
  worked_days: number;
  planned_days: number;
  approved_leave_days: number;
  unpaid_leave_days: number;
  [key: string]: number; // rule codes get stored here
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
        // Safe formula evaluation — replace context variables in expression
        let expr = rule.formulaExpression;
        for (const [key, val] of Object.entries(ctx)) {
          expr = expr.replace(new RegExp(`\\b${key}\\b`, 'g'), String(val));
        }
        // Only allow safe math expressions
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

// Calculate working days in a date range (excluding weekends)
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
    const conditions = [];
    if (query.status) conditions.push(eq(payruns.status, query.status));

    return await db.query.payruns.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: {
        defaultSalaryStructure: { columns: { id: true, name: true, code: true } },
        createdByUser: { columns: { id: true, email: true } },
        validatedByUser: { columns: { id: true, email: true } },
        payslips: { columns: { id: true, status: true, netAmount: true } },
      },
      orderBy: (p, { desc }) => [desc(p.createdAt)],
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    });
  }

  async getPayrunById(id: string) {
    const payrun = await db.query.payruns.findFirst({
      where: eq(payruns.id, id),
      with: {
        defaultSalaryStructure: true,
        createdByUser: { columns: { id: true, email: true } },
        validatedByUser: { columns: { id: true, email: true } },
        payslips: {
          with: {
            employee: { columns: { id: true, firstName: true, lastName: true, employeeCode: true, avatarUrl: true } },
            salaryStructure: { columns: { id: true, name: true } },
          },
          orderBy: (p, { asc }) => [asc(p.payslipNumber)],
        },
      },
    });

    if (!payrun) {
      throw new ApiError({ statuscode: httpStatus.NOT_FOUND, message: 'Payrun not found.', errorcode: 'PAYRUN_NOT_FOUND' });
    }
    return payrun;
  }

  async createPayrun(data: CreatePayrunInput, actingUserId?: string) {
    // Check for duplicate batch code
    const existing = await db.query.payruns.findFirst({ where: eq(payruns.batchCode, data.batchCode) });
    if (existing) {
      throw new ApiError({ statuscode: httpStatus.CONFLICT, message: `Batch code '${data.batchCode}' already exists.`, errorcode: 'BATCH_CODE_EXISTS' });
    }

    // Create the payrun record
    const [payrun] = await db.insert(payruns).values({
      name: data.name,
      batchCode: data.batchCode,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      defaultSalaryStructureId: data.defaultSalaryStructureId ?? null,
      status: 'COMPUTING',
      createdByUserId: actingUserId ?? null,
      notes: data.notes ?? null,
    }).returning();

    // Compute payslips for each employee
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    let payslipCount = 0;

    for (const employeeId of data.employeeIds) {
      try {
        await this.computePayslipForEmployee(payrun.id, employeeId, data.periodStart, data.periodEnd);
        payslipCount++;
      } catch (err) {
        // Log error but continue with other employees
        console.error(`Failed to compute payslip for employee ${employeeId}:`, err);
      }
    }

    // Aggregate totals from created payslips
    const createdPayslips = await db.query.payslips.findMany({
      where: eq(payslips.payrunId, payrun.id),
      columns: { grossAmount: true, deductionAmount: true, netAmount: true },
    });

    for (const ps of createdPayslips) {
      totalGross += parseFloat(ps.grossAmount ?? '0');
      totalDeductions += parseFloat(ps.deductionAmount ?? '0');
      totalNet += parseFloat(ps.netAmount ?? '0');
    }

    // Update payrun with totals and mark as COMPUTED
    const [updated] = await db.update(payruns).set({
      status: 'COMPUTED',
      totalGrossAmount: String(Math.round(totalGross * 100) / 100),
      totalDeductionAmount: String(Math.round(totalDeductions * 100) / 100),
      totalNetAmount: String(Math.round(totalNet * 100) / 100),
      totalPayslipCount: payslipCount,
      updatedAt: new Date(),
    }).where(eq(payruns.id, payrun.id)).returning();

    return this.getPayrunById(updated.id);
  }

  private async computePayslipForEmployee(
    payrunId: string,
    employeeId: string,
    periodStart: string,
    periodEnd: string
  ) {
    // 1. Find active contract
    const contract = await contractsService.findActiveContractForPeriod(employeeId, periodStart, periodEnd);
    if (!contract) {
      throw new Error(`No active contract found for employee ${employeeId} in period ${periodStart} - ${periodEnd}`);
    }

    // 2. Get employee for validation warnings
    const employee = await db.query.employees.findFirst({
      where: eq(employees.id, employeeId),
      columns: { bankName: true, bankAccountNumber: true, bankRoutingOrIfsc: true, bankAccountHolderName: true },
    });

    // 3. Get attendance summary
    const attendanceSummary = await attendanceService.getSummaryForEmployee(employeeId, periodStart, periodEnd);

    // 4. Get approved leave days
    const approvedLeaveDays = await timeOffService.getApprovedLeaveDays(employeeId, periodStart, periodEnd);

    // 5. Calculate planned working days
    const plannedDays = calculateWorkingDays(periodStart, periodEnd);
    const workedDays = attendanceSummary.presentDays;
    const unpaidLeaveDays = Math.max(0, plannedDays - workedDays - approvedLeaveDays);

    // 6. Get salary structure rules
    const structure = contract.salaryStructure;
    const rules = structure.structureRules
      .map((sr) => sr.salaryRule)
      .filter((r) => r.isActive)
      .sort((a, b) => a.sequence - b.sequence);

    // 7. Build initial salary context
    const contractWage = parseFloat(String(contract.wage)) || 0;
    const ctx: SalaryContext = {
      contract_wage: contractWage,
      worked_days: workedDays,
      planned_days: plannedDays,
      approved_leave_days: approvedLeaveDays,
      unpaid_leave_days: unpaidLeaveDays,
    };

    // 8. Execute rules sequentially
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
      ctx[rule.code] = amount; // Make this rule's result available to subsequent rules

      if (!rule.appearsOnPayslip) continue;

      const catCode = rule.category.code;

      // Track gross vs deductions by category
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

    // Final amounts
    const netAmount = grossAmount - deductionAmount;

    // 9. Validation warnings
    const validationWarnings: string[] = [];
    if (!employee?.bankName || !employee?.bankAccountNumber) {
      validationWarnings.push('Missing bank details — payment may be delayed');
    }
    if (workedDays === 0) {
      validationWarnings.push('No attendance records found for this period');
    }

    // 10. Generate payslip number
    const payslipNumber = `PS-${payrunId.slice(0, 8).toUpperCase()}-${employeeId.slice(0, 6).toUpperCase()}`;

    // 11. Check for duplicate payslip
    const existing = await db.query.payslips.findFirst({
      where: and(eq(payslips.payrunId, payrunId), eq(payslips.employeeId, employeeId)),
    });
    if (existing) {
      validationWarnings.push('Duplicate payslip detected for this employee in this payrun');
      return existing;
    }

    // 12. Insert payslip
    const [payslip] = await db.insert(payslips).values({
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
    }).returning();

    // 13. Insert payslip lines
    if (payslipLineData.length > 0) {
      await db.insert(payslipLines).values(
        payslipLineData.map((line) => ({
          payslipId: payslip.id,
          ...line,
        }))
      );
    }

    return payslip;
  }

  async performAction(id: string, data: PayrunActionInput, actingUserId?: string) {
    const payrun = await db.query.payruns.findFirst({ where: eq(payruns.id, id) });
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
      // Also validate all payslips in the payrun
      await db.update(payslips).set({ status: 'VALIDATED', updatedAt: new Date() }).where(eq(payslips.payrunId, id));
    } else if (data.action === 'MARK_PAID') {
      if (payrun.status !== 'VALIDATED') {
        throw new ApiError({ statuscode: httpStatus.BAD_REQUEST, message: 'Only validated payruns can be marked as paid.', errorcode: 'INVALID_STATUS' });
      }
      newStatus = 'PAID';
      updateData.paidAt = new Date();
      // Mark all payslips as paid
      await db.update(payslips).set({ status: 'PAID', updatedAt: new Date() }).where(eq(payslips.payrunId, id));
    } else {
      newStatus = 'CANCELLED';
      await db.update(payslips).set({ status: 'CANCELLED', updatedAt: new Date() }).where(eq(payslips.payrunId, id));
    }

    updateData.status = newStatus;
    if (data.notes) updateData.notes = data.notes;

    await db.update(payruns).set(updateData).where(eq(payruns.id, id));
    return this.getPayrunById(id);
  }

  async deletePayrun(id: string) {
    const payrun = await db.query.payruns.findFirst({ where: eq(payruns.id, id) });
    if (!payrun) {
      throw new ApiError({ statuscode: httpStatus.NOT_FOUND, message: 'Payrun not found.', errorcode: 'PAYRUN_NOT_FOUND' });
    }
    if (['VALIDATED', 'PAID'].includes(payrun.status)) {
      throw new ApiError({ statuscode: httpStatus.BAD_REQUEST, message: 'Cannot delete a validated or paid payrun.', errorcode: 'PAYRUN_LOCKED' });
    }
    // Cascade deletes payslips + lines via DB foreign keys
    const [deleted] = await db.delete(payruns).where(eq(payruns.id, id)).returning();
    return deleted;
  }
}

export const payrunService = new PayrunService();
