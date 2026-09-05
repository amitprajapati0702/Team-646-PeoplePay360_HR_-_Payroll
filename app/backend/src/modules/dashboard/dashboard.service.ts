import { db } from '../../infrastructure/database/client.js';
import {
  payruns, payslips, employees, timeOffRequests, attendances, contracts, departments,
} from '../../infrastructure/database/schema/index.js';
import { eq, and, gte, lte, count, sql, desc } from 'drizzle-orm';

export class DashboardService {
  async getKPIs() {
    // 1. Active Employees Count
    const activeEmployeesResult = await db.select({ count: count() })
      .from(employees)
      .where(eq(employees.status, 'ACTIVE'));
    const activeEmployeesCount = Number(activeEmployeesResult[0]?.count ?? 0);

    // 2. Active Contracts Count & Monthly Base Contract Wage
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

    // 3. Latest Payrun Financials (Gross, Deductions, Net)
    const latestPayrun = await db.query.payruns.findFirst({
      orderBy: [desc(payruns.periodStart)],
    });

    let totalGrossMonthly = latestPayrun ? parseFloat(latestPayrun.totalGrossAmount ?? '0') : contractTotalWage;
    let totalDeductionsMonthly = latestPayrun ? parseFloat(latestPayrun.totalDeductionAmount ?? '0') : contractTotalWage * 0.13;
    let totalNetMonthly = latestPayrun ? parseFloat(latestPayrun.totalNetAmount ?? '0') : totalGrossMonthly - totalDeductionsMonthly;

    if (totalGrossMonthly === 0 && contractTotalWage > 0) {
      totalGrossMonthly = contractTotalWage;
      totalDeductionsMonthly = Math.round(contractTotalWage * 0.13);
      totalNetMonthly = totalGrossMonthly - totalDeductionsMonthly;
    }

    // 4. Total payslips generated across all payruns
    const allPayslipsCount = await db.select({ count: count() }).from(payslips);
    const totalPayslipsGenerated = Number(allPayslipsCount[0]?.count ?? 0);

    // 5. Average salary
    const avgResult = await db.select({
      avg: sql<string>`AVG(net_amount::numeric)`,
    }).from(payslips);
    const avgSalary = parseFloat(avgResult[0]?.avg ?? String(contractAvgWage || 75000));

    // 6. Pending leave approvals
    const pendingLeaveResult = await db.select({ count: count() })
      .from(timeOffRequests)
      .where(eq(timeOffRequests.status, 'SUBMITTED'));
    const pendingLeavesCount = Number(pendingLeaveResult[0]?.count ?? 0);

    // 7. Approved leave (current month)
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const approvedLeaveResult = await db.select({ total: sql<string>`COALESCE(SUM(requested_units::numeric), 0)` })
      .from(timeOffRequests)
      .where(and(
        eq(timeOffRequests.status, 'APPROVED'),
        gte(timeOffRequests.startDate, monthStart),
        lte(timeOffRequests.endDate, monthEnd)
      ));
    const approvedLeave = parseFloat(approvedLeaveResult[0]?.total ?? '0');

    // 8. Attendance health: % present this month
    const totalAttendance = await db.select({ count: count() }).from(attendances)
      .where(and(
        gte(attendances.attendanceDate, monthStart),
        lte(attendances.attendanceDate, monthEnd)
      ));
    const presentAttendance = await db.select({ count: count() }).from(attendances)
      .where(and(
        gte(attendances.attendanceDate, monthStart),
        lte(attendances.attendanceDate, monthEnd),
        eq(attendances.status, 'PRESENT')
      ));

    const totalAtt = Number(totalAttendance[0]?.count ?? 0);
    const presentAtt = Number(presentAttendance[0]?.count ?? 0);
    const attendanceHealth = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 95;

    return {
      totalGrossMonthly: Math.round(totalGrossMonthly * 100) / 100,
      totalNetMonthly: Math.round(totalNetMonthly * 100) / 100,
      totalDeductionsMonthly: Math.round(totalDeductionsMonthly * 100) / 100,
      activeEmployeesCount,
      pendingLeavesCount,
      activeContractsCount,
      totalPayslipsGenerated,
      avgSalary: Math.round(avgSalary * 100) / 100,
      approvedLeave,
      attendanceHealth,
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

      const rows: any[] = Array.isArray(result) ? result : (result as any)?.rows || [];
      const totalCompanyNet = rows.reduce((s, r) => s + parseFloat(r.total_net ?? '0'), 0) || 1;

      return rows.map((row) => {
        const net = parseFloat(row.total_net ?? '0');
        const percentage = Math.round((net / totalCompanyNet) * 100);
        return {
          department: row.department || 'General',
          departmentId: row.department_id,
          code: row.code || 'DEPT',
          totalGross: parseFloat(row.total_gross ?? '0'),
          totalNet: net,
          employeeCount: parseInt(row.employee_count ?? '0'),
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

      const rows: any[] = Array.isArray(result) ? result : (result as any)?.rows || [];
      return rows.map((row) => ({
        month: row.month_name || 'Period',
        monthCode: row.month_code,
        gross: parseFloat(row.total_gross ?? '0'),
        net: parseFloat(row.total_net ?? '0'),
        deductions: parseFloat(row.total_deductions ?? '0'),
      }));
    } catch {
      return [];
    }
  }

  async getAlerts() {
    const alerts: Array<{ id: string; type: string; severity: 'warning' | 'error' | 'info'; title: string; message: string; link: string; linkText: string }> = [];

    try {
      // 1. Missing bank details
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

      // 2. Pending leave requests
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

      // 3. Active payruns in draft or computed
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

  async getRuleBreakdown() {
    try {
      const result = await db.execute(sql`
        SELECT
          sr.name,
          sr.code,
          src.code as category_code,
          sr.computation_type,
          sr.percentage,
          sr.fixed_amount,
          COALESCE(SUM(psl.total_amount::numeric), 0) as monthly_aggregated
        FROM salary_rules sr
        JOIN salary_rule_categories src ON src.id = sr.category_id
        LEFT JOIN payslip_lines psl ON psl.code = sr.code
        GROUP BY sr.id, sr.name, sr.code, src.code, sr.computation_type, sr.percentage, sr.fixed_amount, sr.sequence
        ORDER BY sr.sequence ASC
      `);

      const rows: any[] = Array.isArray(result) ? result : (result as any)?.rows || [];
      return rows.map((row) => ({
        name: row.name,
        code: row.code,
        category: row.category_code,
        computationType: row.computation_type,
        percentage: row.percentage ? parseFloat(row.percentage) : null,
        fixedAmount: row.fixed_amount ? parseFloat(row.fixed_amount) : null,
        monthlyAggregated: parseFloat(row.monthly_aggregated ?? '0'),
      }));
    } catch {
      return [];
    }
  }

  async getFullDashboard() {
    const [kpis, departmentCost, monthlyTrend, alerts, ruleBreakdown] = await Promise.all([
      this.getKPIs(),
      this.getSalaryCostByDepartment(),
      this.getMonthlyTrend(),
      this.getAlerts(),
      this.getRuleBreakdown(),
    ]);

    return { kpis, departmentCost, monthlyTrend, alerts, ruleBreakdown };
  }
}

export const dashboardService = new DashboardService();
