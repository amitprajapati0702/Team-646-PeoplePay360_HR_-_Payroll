import { db } from '../../infrastructure/database/client.js';
import {
  payruns, payslips, employees, timeOffRequests, attendances, contracts,
} from '../../infrastructure/database/schema/index.js';
import { eq, and, count, sql, desc } from 'drizzle-orm';

interface DepartmentCostRow {
  department?: string;
  department_id?: string;
  code?: string;
  total_gross?: string | number;
  total_net?: string | number;
  employee_count?: string | number;
}

interface MonthlyTrendRow {
  month_name?: string;
  month_code?: string;
  total_net?: string | number;
  total_gross?: string | number;
  total_deductions?: string | number;
}

export class DashboardService {
  async getKPIs() {
    const today = new Date().toISOString().split('T')[0];

    // 1. Total & Active Employees
    const totalEmployeesResult = await db.select({ count: count() }).from(employees);
    const totalEmployees = Number(totalEmployeesResult[0]?.count ?? 0);

    const activeEmployeesResult = await db.select({ count: count() })
      .from(employees)
      .where(eq(employees.status, 'ACTIVE'));
    const activeEmployees = Number(activeEmployeesResult[0]?.count ?? 0);

    // 2. Attendance Today (Present / Absent)
    const presentTodayResult = await db.select({ count: count() })
      .from(attendances)
      .where(and(
        eq(attendances.attendanceDate, today),
        eq(attendances.status, 'PRESENT')
      ));
    const presentToday = Number(presentTodayResult[0]?.count ?? 0);

    const absentTodayResult = await db.select({ count: count() })
      .from(attendances)
      .where(and(
        eq(attendances.attendanceDate, today),
        eq(attendances.status, 'ABSENT')
      ));
    const absentRecords = Number(absentTodayResult[0]?.count ?? 0);
    const absentToday = absentRecords > 0 ? absentRecords : Math.max(0, activeEmployees - presentToday);

    // 3. Leaves (Pending / Approved)
    const pendingLeaveResult = await db.select({ count: count() })
      .from(timeOffRequests)
      .where(eq(timeOffRequests.status, 'SUBMITTED'));
    const pendingLeaves = Number(pendingLeaveResult[0]?.count ?? 0);

    const approvedLeaveResult = await db.select({ count: count() })
      .from(timeOffRequests)
      .where(eq(timeOffRequests.status, 'APPROVED'));
    const approvedLeaves = Number(approvedLeaveResult[0]?.count ?? 0);

    // 4. Current Payroll Cost
    const activeContractsResult = await db.select({
      count: count(),
      totalWage: sql<string>`COALESCE(SUM(wage::numeric), 0)`,
      avgWage: sql<string>`COALESCE(AVG(wage::numeric), 0)`,
    })
      .from(contracts)
      .where(eq(contracts.status, 'ACTIVE'));
    const activeContractsCount = Number(activeContractsResult[0]?.count ?? 0);
    const contractTotalWage = parseFloat(activeContractsResult[0]?.totalWage ?? '0');
    const contractAvgWage = parseFloat(activeContractsResult[0]?.avgWage ?? '0');

    const latestPayrun = await db.query.payruns.findFirst({
      orderBy: [desc(payruns.periodStart)],
    });

    let currentPayrollCost = latestPayrun ? parseFloat(latestPayrun.totalGrossAmount ?? '0') : contractTotalWage;
    if (currentPayrollCost === 0 && contractTotalWage > 0) {
      currentPayrollCost = contractTotalWage;
    }

    const totalGrossMonthly = currentPayrollCost;
    const totalDeductionsMonthly = latestPayrun ? parseFloat(latestPayrun.totalDeductionAmount ?? '0') : currentPayrollCost * 0.13;
    const totalNetMonthly = latestPayrun ? parseFloat(latestPayrun.totalNetAmount ?? '0') : totalGrossMonthly - totalDeductionsMonthly;

    // Total payslips
    const allPayslipsCount = await db.select({ count: count() }).from(payslips);
    const totalPayslipsGenerated = Number(allPayslipsCount[0]?.count ?? 0);

    return {
      // Exact LLD layout fields
      totalEmployees,
      activeEmployees,
      presentToday,
      absentToday,
      pendingLeaves,
      approvedLeaves,
      currentPayrollCost: Math.round(currentPayrollCost * 100) / 100,

      // Supporting financials & metrics
      activeEmployeesCount: activeEmployees,
      pendingLeavesCount: pendingLeaves,
      activeContractsCount,
      totalPayslipsGenerated,
      totalGrossMonthly: Math.round(totalGrossMonthly * 100) / 100,
      totalNetMonthly: Math.round(totalNetMonthly * 100) / 100,
      totalDeductionsMonthly: Math.round(totalDeductionsMonthly * 100) / 100,
      avgSalary: Math.round(contractAvgWage * 100) / 100,
    };
  }

  async getSalaryCostByDepartment() {
    try {
      const result = await db.execute(sql`
        SELECT
          d.name as department,
          d.id as department_id,
          d.code as code,
          COALESCE(SUM(c.wage::numeric), 0) as total_gross,
          COALESCE(SUM(c.wage::numeric * 0.87), 0) as total_net,
          COUNT(DISTINCT e.id) as employee_count
        FROM departments d
        LEFT JOIN employees e ON e.department_id = d.id AND e.status = 'ACTIVE'
        LEFT JOIN contracts c ON c.employee_id = e.id AND c.status = 'ACTIVE'
        GROUP BY d.id, d.name, d.code
        ORDER BY total_net DESC
      `);

      const raw = result as unknown as DepartmentCostRow[] | { rows?: DepartmentCostRow[] };
      const rows: DepartmentCostRow[] = Array.isArray(raw) ? raw : raw?.rows || [];
      const totalCompanyNet = rows.reduce((s, r) => s + parseFloat(String(r.total_net ?? '0')), 0) || 1;

      return rows.map((row) => {
        const net = parseFloat(String(row.total_net ?? '0'));
        const percentage = Math.round((net / totalCompanyNet) * 100);
        return {
          department: row.department || 'General',
          departmentId: row.department_id,
          code: row.code || 'DEPT',
          totalGross: parseFloat(String(row.total_gross ?? '0')),
          totalNet: net,
          employeeCount: parseInt(String(row.employee_count ?? '0'), 10),
          percentage: percentage > 0 ? percentage : 0,
        };
      });
    } catch {
      return [];
    }
  }

  async getMonthlyTrend() {
    try {
      const result = await db.execute(sql`
        SELECT
          TO_CHAR(period_start::date, 'Mon') as month_name,
          TO_CHAR(period_start::date, 'YYYY-MM') as month_code,
          COALESCE(total_net_amount::numeric, 0) as total_net,
          COALESCE(total_gross_amount::numeric, 0) as total_gross,
          COALESCE(total_deduction_amount::numeric, 0) as total_deductions
        FROM payruns
        ORDER BY period_start ASC
        LIMIT 6
      `);

      const raw = result as unknown as MonthlyTrendRow[] | { rows?: MonthlyTrendRow[] };
      const rows: MonthlyTrendRow[] = Array.isArray(raw) ? raw : raw?.rows || [];
      return rows.map((row) => ({
        month: row.month_name || 'Period',
        monthCode: row.month_code,
        gross: parseFloat(String(row.total_gross ?? '0')),
        net: parseFloat(String(row.total_net ?? '0')),
        deductions: parseFloat(String(row.total_deductions ?? '0')),
      }));
    } catch {
      return [];
    }
  }

  async getAlerts() {
    const alerts: Array<{ id: string; type: string; severity: 'warning' | 'error' | 'info'; title: string; message: string; link: string; linkText: string }> = [];

    try {
      const missingBank = await db.select({ count: count() }).from(employees).where(
        and(
          eq(employees.status, 'ACTIVE'),
          sql`(bank_account_number IS NULL OR bank_account_number = '')`
        )
      );
      const missingBankCount = Number(missingBank[0]?.count ?? 0);
      if (missingBankCount > 0) {
        alerts.push({
          id: 'missing-bank',
          type: 'MISSING_BANK_DETAILS',
          severity: 'warning',
          title: 'Missing Bank Details',
          message: `${missingBankCount} active employee(s) require bank accounts & IFSC for direct salary disbursement.`,
          link: '/employees',
          linkText: 'Update Profiles',
        });
      }

      const pendingLeave = await db.select({ count: count() }).from(timeOffRequests)
        .where(eq(timeOffRequests.status, 'SUBMITTED'));
      const pendingLeaveCount = Number(pendingLeave[0]?.count ?? 0);
      if (pendingLeaveCount > 0) {
        alerts.push({
          id: 'pending-leaves',
          type: 'PENDING_LEAVE',
          severity: 'info',
          title: 'Pending Leave Approvals',
          message: `${pendingLeaveCount} leave application(s) awaiting manager review.`,
          link: '/time-off',
          linkText: 'Review Leaves',
        });
      }

      const openPayruns = await db.select({ count: count() }).from(payruns)
        .where(sql`status IN ('DRAFT', 'COMPUTED', 'VALIDATED')`);
      const openPayrunCount = Number(openPayruns[0]?.count ?? 0);
      if (openPayrunCount > 0) {
        alerts.push({
          id: 'open-payruns',
          type: 'OPEN_PAYRUNS',
          severity: 'warning',
          title: 'Active Payrun Cycle In Draft',
          message: `Current payrun cycle requires computation and validation before bank disbursement.`,
          link: '/payroll',
          linkText: 'Process Payruns',
        });
      }
    } catch {
      // Safe fallback
    }

    return alerts;
  }

  async getFullDashboard() {
    const [kpis, departmentCost, monthlyTrend, alerts] = await Promise.all([
      this.getKPIs(),
      this.getSalaryCostByDepartment(),
      this.getMonthlyTrend(),
      this.getAlerts(),
    ]);

    return { kpis, departmentCost, monthlyTrend, alerts };
  }
}

export const dashboardService = new DashboardService();
