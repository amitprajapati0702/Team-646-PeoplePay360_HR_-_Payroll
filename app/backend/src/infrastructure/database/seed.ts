/**
 * PeoplePay360 Database Seed Script
 * Populates the database with real Indian Rupees (₹) demo data.
 * Run: npx tsx src/infrastructure/database/seed.ts
 */

import 'dotenv/config';
import { db } from './client.js';
import {
  users, departments, jobPositions, workingSchedules, workingScheduleLines,
  employees, contracts, salaryRuleCategories, salaryStructures, salaryRules,
  salaryStructureRules, attendances, timeOffTypes, timeOffAllocations, timeOffRequests,
  payruns, payslips, payslipLines,
} from './schema/index.js';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Starting Indian Rupees (₹) database seed...\n');

  // ─── 1. Users (Auth) ────────────────────────────────────────────
  console.log('Creating users...');
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const [adminUser] = await db.insert(users).values({
    email: 'admin@peoplepay360.com',
    passwordHash,
    role: 'ADMIN',
    isActive: true,
  }).onConflictDoUpdate({
    target: users.email,
    set: { passwordHash, role: 'ADMIN', isActive: true, updatedAt: new Date() },
  }).returning();

  const [hrManagerUser] = await db.insert(users).values({
    email: 'hr@peoplepay360.com',
    passwordHash,
    role: 'HR_MANAGER',
    isActive: true,
  }).onConflictDoUpdate({
    target: users.email,
    set: { passwordHash, role: 'HR_MANAGER', isActive: true, updatedAt: new Date() },
  }).returning();

  const [payrollUser] = await db.insert(users).values({
    email: 'payroll@peoplepay360.com',
    passwordHash,
    role: 'HR_PAYROLL_MANAGER',
    isActive: true,
  }).onConflictDoUpdate({
    target: users.email,
    set: { passwordHash, role: 'HR_PAYROLL_MANAGER', isActive: true, updatedAt: new Date() },
  }).returning();

  const [aliceUser] = await db.insert(users).values({
    email: 'alice.johnson@example.com',
    passwordHash,
    role: 'EMPLOYEE',
    isActive: true,
  }).onConflictDoUpdate({
    target: users.email,
    set: { passwordHash, role: 'EMPLOYEE', isActive: true, updatedAt: new Date() },
  }).returning();

  const [priyaUser] = await db.insert(users).values({
    email: 'priya.sharma@company.com',
    passwordHash,
    role: 'EMPLOYEE',
    isActive: true,
  }).onConflictDoUpdate({
    target: users.email,
    set: { passwordHash, role: 'EMPLOYEE', isActive: true, updatedAt: new Date() },
  }).returning();

  const [rahulUser] = await db.insert(users).values({
    email: 'rahul.verma@company.com',
    passwordHash,
    role: 'EMPLOYEE',
    isActive: true,
  }).onConflictDoUpdate({
    target: users.email,
    set: { passwordHash, role: 'EMPLOYEE', isActive: true, updatedAt: new Date() },
  }).returning();

  console.log('  ✅ Users seeded with Password123!: admin, hr, payroll, alice.johnson, priya.sharma, rahul.verma');

  // ─── 2. Departments ─────────────────────────────────────────────
  console.log('Creating departments...');
  const [engDept] = await db.insert(departments).values({
    code: 'ENG', name: 'Engineering & Technology', isActive: true,
  }).onConflictDoUpdate({ target: departments.code, set: { name: 'Engineering & Technology' } }).returning();

  const [hrDept] = await db.insert(departments).values({
    code: 'HR', name: 'Human Resources', isActive: true,
  }).onConflictDoUpdate({ target: departments.code, set: { name: 'Human Resources' } }).returning();

  const [finDept] = await db.insert(departments).values({
    code: 'FIN', name: 'Finance & Accounts', isActive: true,
  }).onConflictDoUpdate({ target: departments.code, set: { name: 'Finance & Accounts' } }).returning();

  const [salesDept] = await db.insert(departments).values({
    code: 'SALES', name: 'Sales & Marketing', isActive: true,
  }).onConflictDoUpdate({ target: departments.code, set: { name: 'Sales & Marketing' } }).returning();

  console.log('  ✅ Departments: Engineering, HR, Finance, Sales');

  // ─── 3. Job Positions ───────────────────────────────────────────
  console.log('Creating job positions...');
  const [sweDev] = await db.insert(jobPositions).values({
    code: 'SWE', title: 'Software Engineer', departmentId: engDept.id, isActive: true,
  }).onConflictDoUpdate({ target: jobPositions.code, set: { title: 'Software Engineer' } }).returning();

  const [srSwe] = await db.insert(jobPositions).values({
    code: 'SR-SWE', title: 'Senior Software Engineer', departmentId: engDept.id, isActive: true,
  }).onConflictDoUpdate({ target: jobPositions.code, set: { title: 'Senior Software Engineer' } }).returning();

  const [hrExec] = await db.insert(jobPositions).values({
    code: 'HR-EXEC', title: 'HR Executive', departmentId: hrDept.id, isActive: true,
  }).onConflictDoUpdate({ target: jobPositions.code, set: { title: 'HR Executive' } }).returning();

  const [finAnalyst] = await db.insert(jobPositions).values({
    code: 'FIN-ANLT', title: 'Financial Analyst', departmentId: finDept.id, isActive: true,
  }).onConflictDoUpdate({ target: jobPositions.code, set: { title: 'Financial Analyst' } }).returning();

  const [salesExec] = await db.insert(jobPositions).values({
    code: 'SALES-EXEC', title: 'Sales Executive', departmentId: salesDept.id, isActive: true,
  }).onConflictDoUpdate({ target: jobPositions.code, set: { title: 'Sales Executive' } }).returning();

  console.log('  ✅ Job Positions: 5 positions');

  // ─── 4. Working Schedules ───────────────────────────────────────
  console.log('Creating working schedules...');
  const [stdSchedule] = await db.insert(workingSchedules).values({
    code: 'STD-9-6', name: 'Standard 9AM-6PM (Mon-Fri)', scheduleType: 'STANDARD', totalWeeklyHours: '40.00', isActive: true,
  }).onConflictDoUpdate({ target: workingSchedules.code, set: { name: 'Standard 9AM-6PM (Mon-Fri)' } }).returning();

  const stdDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const;
  for (const day of stdDays) {
    await db.insert(workingScheduleLines).values({
      workingScheduleId: stdSchedule.id,
      dayOfWeek: day,
      workFrom: '09:00',
      workTo: '18:00',
      breakDurationMinutes: 60,
      dailyWorkingHours: '8.00',
    }).onConflictDoNothing();
  }

  console.log('  ✅ Working Schedules: Standard 9-6');

  // ─── 5. Salary Rule Categories ──────────────────────────────────
  console.log('Creating salary rule categories...');
  const catData = [
    { code: 'BASIC', name: 'Basic Salary', sequence: 1 },
    { code: 'ALW', name: 'Allowances', sequence: 2 },
    { code: 'GROSS', name: 'Gross Salary', sequence: 3 },
    { code: 'DED', name: 'Statutory Deductions', sequence: 4 },
    { code: 'NET', name: 'Net Take-Home Pay', sequence: 5 },
  ];

  const categoryMap: Record<string, string> = {};
  for (const cat of catData) {
    const [created] = await db.insert(salaryRuleCategories).values(cat)
      .onConflictDoUpdate({ target: salaryRuleCategories.code, set: { name: cat.name } })
      .returning();
    categoryMap[cat.code] = created.id;
  }

  // ─── 6. Salary Rules (Indian Statutory Compensation) ─────────────
  console.log('Creating salary rules...');
  const rulesData = [
    {
      code: 'BASIC', name: 'Basic Salary (50% Base)', categoryId: categoryMap['BASIC'],
      sequence: 10, computationType: 'PERCENTAGE' as const,
      percentage: '50.000', percentageBaseRuleCode: 'contract_wage',
      appearsOnPayslip: true, isActive: true,
    },
    {
      code: 'HRA', name: 'House Rent Allowance (40% of Basic)', categoryId: categoryMap['ALW'],
      sequence: 20, computationType: 'PERCENTAGE' as const,
      percentage: '40.000', percentageBaseRuleCode: 'BASIC',
      appearsOnPayslip: true, isActive: true,
    },
    {
      code: 'SA', name: 'Special Allowance (30% Base)', categoryId: categoryMap['ALW'],
      sequence: 30, computationType: 'PERCENTAGE' as const,
      percentage: '30.000', percentageBaseRuleCode: 'contract_wage',
      appearsOnPayslip: true, isActive: true,
    },
    {
      code: 'GROSS', name: 'Gross Earnings', categoryId: categoryMap['GROSS'],
      sequence: 40, computationType: 'FORMULA' as const,
      formulaExpression: 'BASIC + HRA + SA',
      appearsOnPayslip: true, isActive: true,
    },
    {
      code: 'PF', name: 'Provident Fund (12% of Basic)', categoryId: categoryMap['DED'],
      sequence: 50, computationType: 'PERCENTAGE' as const,
      percentage: '12.000', percentageBaseRuleCode: 'BASIC',
      appearsOnPayslip: true, isActive: true,
    },
    {
      code: 'PT', name: 'Professional Tax (Fixed)', categoryId: categoryMap['DED'],
      sequence: 60, computationType: 'FIXED' as const,
      fixedAmount: '200.00',
      appearsOnPayslip: true, isActive: true,
    },
    {
      code: 'TDS', name: 'Income Tax (TDS 5% Gross)', categoryId: categoryMap['DED'],
      sequence: 70, computationType: 'PERCENTAGE' as const,
      percentage: '5.000', percentageBaseRuleCode: 'GROSS',
      appearsOnPayslip: true, isActive: true,
    },
    {
      code: 'NET', name: 'Net Take-Home Pay', categoryId: categoryMap['NET'],
      sequence: 100, computationType: 'FORMULA' as const,
      formulaExpression: 'GROSS - PF - PT - TDS',
      appearsOnPayslip: true, isActive: true,
    },
  ];

  const ruleMap: Record<string, string> = {};
  for (const rule of rulesData) {
    const [created] = await db.insert(salaryRules).values(rule)
      .onConflictDoUpdate({ target: salaryRules.code, set: { name: rule.name } })
      .returning();
    ruleMap[rule.code] = created.id;
  }

  // ─── 7. Salary Structure ────────────────────────────────────────
  console.log('Creating salary structure...');
  const [mainStructure] = await db.insert(salaryStructures).values({
    code: 'IND-MONTHLY', name: 'Indian Standard Monthly Structure',
    description: 'Standard Indian CTC structure with Basic (50%), HRA (40%), PF (12%), PT, and TDS',
    isActive: true,
  }).onConflictDoUpdate({ target: salaryStructures.code, set: { name: 'Indian Standard Monthly Structure' } }).returning();

  for (const [code, ruleId] of Object.entries(ruleMap)) {
    await db.insert(salaryStructureRules).values({
      salaryStructureId: mainStructure.id,
      salaryRuleId: ruleId,
      sequenceOverride: rulesData.find(r => r.code === code)?.sequence,
    }).onConflictDoNothing();
  }

  // ─── 8. Employees (Indian Profiles) ─────────────────────────────
  console.log('Creating employees...');
  const employeesData = [
    {
      employeeCode: 'EMP001', firstName: 'Priya', lastName: 'Sharma',
      workEmail: 'priya.sharma@company.com', departmentId: engDept.id,
      jobPositionId: srSwe.id, workingScheduleId: stdSchedule.id,
      joiningDate: '2023-01-15', employmentType: 'FULL_TIME' as const,
      status: 'ACTIVE' as const,
      bankName: 'HDFC Bank', bankAccountNumber: '50100123456789',
      bankRoutingOrIfsc: 'HDFC0001234', bankAccountHolderName: 'Priya Sharma',
    },
    {
      employeeCode: 'EMP002', firstName: 'Rahul', lastName: 'Verma',
      workEmail: 'rahul.verma@company.com', departmentId: engDept.id,
      jobPositionId: sweDev.id, workingScheduleId: stdSchedule.id,
      joiningDate: '2023-06-01', employmentType: 'FULL_TIME' as const,
      status: 'ACTIVE' as const,
      bankName: 'ICICI Bank', bankAccountNumber: '004401234567',
      bankRoutingOrIfsc: 'ICIC0000044', bankAccountHolderName: 'Rahul Verma',
    },
    {
      employeeCode: 'EMP003', firstName: 'Anjali', lastName: 'Patel',
      workEmail: 'anjali.patel@company.com', departmentId: hrDept.id,
      jobPositionId: hrExec.id, workingScheduleId: stdSchedule.id,
      joiningDate: '2022-09-10', employmentType: 'FULL_TIME' as const,
      status: 'ACTIVE' as const,
      bankName: 'State Bank of India', bankAccountNumber: '31234567890',
      bankRoutingOrIfsc: 'SBIN0001234', bankAccountHolderName: 'Anjali Patel',
    },
    {
      employeeCode: 'EMP004', firstName: 'Kiran', lastName: 'Mehta',
      workEmail: 'kiran.mehta@company.com', departmentId: finDept.id,
      jobPositionId: finAnalyst.id, workingScheduleId: stdSchedule.id,
      joiningDate: '2024-02-20', employmentType: 'FULL_TIME' as const,
      status: 'ACTIVE' as const,
      bankName: 'Axis Bank', bankAccountNumber: '917010012345678',
      bankRoutingOrIfsc: 'UTIB0001234', bankAccountHolderName: 'Kiran Mehta',
    },
    {
      employeeCode: 'EMP005', firstName: 'Deepak', lastName: 'Kumar',
      workEmail: 'deepak.kumar@company.com', departmentId: salesDept.id,
      jobPositionId: salesExec.id, workingScheduleId: stdSchedule.id,
      joiningDate: '2024-07-01', employmentType: 'FULL_TIME' as const,
      status: 'ACTIVE' as const,
      // No bank details — for alert demo
    },
  ];

  const empMap: Record<string, string> = {};
  for (const emp of employeesData) {
    const [created] = await db.insert(employees).values(emp)
      .onConflictDoUpdate({ target: employees.employeeCode, set: { workEmail: emp.workEmail } })
      .returning();
    empMap[emp.employeeCode] = created.id;
  }

  // ─── 9. Contracts (Indian Rupees INR) ────────────────────────────
  console.log('Creating contracts with Indian Rupees...');
  const contractData = [
    { ref: 'CON-001', empCode: 'EMP001', deptId: engDept.id, posId: srSwe.id, wage: '120000.00', start: '2023-01-15' },
    { ref: 'CON-002', empCode: 'EMP002', deptId: engDept.id, posId: sweDev.id, wage: '85000.00', start: '2023-06-01' },
    { ref: 'CON-003', empCode: 'EMP003', deptId: hrDept.id, posId: hrExec.id, wage: '70000.00', start: '2022-09-10' },
    { ref: 'CON-004', empCode: 'EMP004', deptId: finDept.id, posId: finAnalyst.id, wage: '90000.00', start: '2024-02-20' },
    { ref: 'CON-005', empCode: 'EMP005', deptId: salesDept.id, posId: salesExec.id, wage: '65000.00', start: '2024-07-01' },
  ];

  const contractMap: Record<string, string> = {};
  for (const con of contractData) {
    const [created] = await db.insert(contracts).values({
      contractReference: con.ref,
      employeeId: empMap[con.empCode],
      departmentId: con.deptId,
      jobPositionId: con.posId,
      salaryStructureId: mainStructure.id,
      workingScheduleId: stdSchedule.id,
      startDate: con.start,
      wage: con.wage,
      status: 'ACTIVE',
    }).onConflictDoUpdate({ target: contracts.contractReference, set: { wage: con.wage } }).returning();
    contractMap[con.empCode] = created.id;
  }

  // ─── 10. Attendance Records ─────────────────────────────────────
  console.log('Creating attendance records...');
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  for (const [empCode, empId] of Object.entries(empMap)) {
    const current = new Date(startOfMonth);
    let daysAdded = 0;

    while (current <= today && daysAdded < 22) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const dateStr = current.toISOString().split('T')[0];
        const checkIn = new Date(current);
        checkIn.setHours(9, Math.floor(Math.random() * 15), 0);
        const checkOut = new Date(checkIn);
        checkOut.setHours(18, Math.floor(Math.random() * 30), 0);

        await db.insert(attendances).values({
          employeeId: empId,
          attendanceDate: dateStr,
          checkIn,
          checkOut,
          workedHours: '8.50',
          overtimeHours: '0.00',
          status: 'PRESENT',
          isManuallyEdited: false,
        }).onConflictDoNothing();
        daysAdded++;
      }
      current.setDate(current.getDate() + 1);
    }
  }

  // ─── 11. Leave Types & Requests ─────────────────────────────────
  console.log('Creating leave types & applications...');
  const [annualLeave] = await db.insert(timeOffTypes).values({
    code: 'ANNUAL', name: 'Annual Leave', unit: 'DAYS', isPaid: true,
    requiresAllocation: true, colorCode: '#3B82F6', isActive: true,
  }).onConflictDoUpdate({ target: timeOffTypes.code, set: { name: 'Annual Leave' } }).returning();

  const [sickLeave] = await db.insert(timeOffTypes).values({
    code: 'SICK', name: 'Sick Leave', unit: 'DAYS', isPaid: true,
    requiresAllocation: true, colorCode: '#F59E0B', isActive: true,
  }).onConflictDoUpdate({ target: timeOffTypes.code, set: { name: 'Sick Leave' } }).returning();

  const [casualLeave] = await db.insert(timeOffTypes).values({
    code: 'CASUAL', name: 'Casual Leave', unit: 'DAYS', isPaid: true,
    requiresAllocation: true, colorCode: '#10B981', isActive: true,
  }).onConflictDoUpdate({ target: timeOffTypes.code, set: { name: 'Casual Leave' } }).returning();

  const currentYear = today.getFullYear();
  for (const empId of Object.values(empMap)) {
    for (const [type, days] of [[annualLeave, 20], [sickLeave, 12], [casualLeave, 10]] as const) {
      await db.insert(timeOffAllocations).values({
        employeeId: empId,
        timeOffTypeId: type.id,
        allocatedUnits: String(days),
        takenUnits: '0.00',
        validityStart: `${currentYear}-01-01`,
        validityEnd: `${currentYear}-12-31`,
        status: 'APPROVED',
        approvedAt: new Date(),
      }).onConflictDoNothing();
    }
  }

  // Insert live leave requests (Pending, Approved, Rejected)
  await db.insert(timeOffRequests).values([
    {
      employeeId: empMap['EMP002'],
      timeOffTypeId: casualLeave.id,
      startDate: '2026-09-08',
      endDate: '2026-09-09',
      requestedUnits: '2.00',
      status: 'APPROVED',
      approvedByUserId: hrManagerUser.id,
      reason: 'Family function at hometown',
    },
    {
      employeeId: empMap['EMP003'],
      timeOffTypeId: sickLeave.id,
      startDate: '2026-09-04',
      endDate: '2026-09-04',
      requestedUnits: '1.00',
      status: 'APPROVED',
      approvedByUserId: hrManagerUser.id,
      reason: 'Viral fever consultation',
    },
    {
      employeeId: empMap['EMP005'],
      timeOffTypeId: annualLeave.id,
      startDate: '2026-09-15',
      endDate: '2026-09-17',
      requestedUnits: '3.00',
      status: 'SUBMITTED',
      reason: 'Personal vacation',
    },
  ]).onConflictDoNothing();

  // ─── 12. Historical & Active Payruns with Payslips ───────────────
  console.log('Creating historical and current payruns in Indian Rupees...');

  const monthlyCycles = [
    {
      name: 'Payrun - May 2026',
      batchCode: 'PAY-2026-05',
      periodStart: '2026-05-01',
      periodEnd: '2026-05-31',
      status: 'PAID' as const,
      totalGross: '410000.00',
      totalDeduction: '53300.00',
      totalNet: '356700.00',
    },
    {
      name: 'Payrun - June 2026',
      batchCode: 'PAY-2026-06',
      periodStart: '2026-06-01',
      periodEnd: '2026-06-30',
      status: 'PAID' as const,
      totalGross: '420000.00',
      totalDeduction: '54600.00',
      totalNet: '365400.00',
    },
    {
      name: 'Payrun - July 2026',
      batchCode: 'PAY-2026-07',
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
      status: 'PAID' as const,
      totalGross: '425000.00',
      totalDeduction: '55250.00',
      totalNet: '369750.00',
    },
    {
      name: 'Payrun - August 2026',
      batchCode: 'PAY-2026-08',
      periodStart: '2026-08-01',
      periodEnd: '2026-08-31',
      status: 'PAID' as const,
      totalGross: '430000.00',
      totalDeduction: '55900.00',
      totalNet: '374100.00',
    },
    {
      name: 'Payrun - September 2026',
      batchCode: 'PAY-2026-09',
      periodStart: '2026-09-01',
      periodEnd: '2026-09-30',
      status: 'DRAFT' as const,
      totalGross: '430000.00',
      totalDeduction: '55900.00',
      totalNet: '374100.00',
    },
  ];

  for (const cycle of monthlyCycles) {
    const [createdPayrun] = await db.insert(payruns).values({
      name: cycle.name,
      batchCode: cycle.batchCode,
      periodStart: cycle.periodStart,
      periodEnd: cycle.periodEnd,
      defaultSalaryStructureId: mainStructure.id,
      status: cycle.status,
      totalGrossAmount: cycle.totalGross,
      totalDeductionAmount: cycle.totalDeduction,
      totalNetAmount: cycle.totalNet,
      totalPayslipCount: 5,
      createdByUserId: payrollUser.id,
      paidAt: cycle.status === 'PAID' ? new Date(`${cycle.periodEnd}T18:00:00Z`) : null,
    }).onConflictDoUpdate({
      target: payruns.batchCode,
      set: {
        totalGrossAmount: cycle.totalGross,
        totalDeductionAmount: cycle.totalDeduction,
        totalNetAmount: cycle.totalNet,
        status: cycle.status,
      },
    }).returning();

    // Create 5 employee payslips for this payrun
    for (const con of contractData) {
      const wageNum = parseFloat(con.wage);
      const basic = wageNum * 0.5;
      const hra = basic * 0.4;
      const sa = wageNum * 0.3;
      const gross = basic + hra + sa;
      const pf = basic * 0.12;
      const pt = 200;
      const tds = gross * 0.05;
      const totalDed = pf + pt + tds;
      const net = gross - totalDed;
      const slipNum = `SLIP-${cycle.batchCode}-${con.empCode}`;

      const [createdSlip] = await db.insert(payslips).values({
        payslipNumber: slipNum,
        payrunId: createdPayrun.id,
        employeeId: empMap[con.empCode],
        contractId: contractMap[con.empCode],
        salaryStructureId: mainStructure.id,
        periodStart: cycle.periodStart,
        periodEnd: cycle.periodEnd,
        status: cycle.status === 'PAID' ? 'PAID' : 'DRAFT',
        plannedWorkingDays: '30.00',
        actualWorkedDays: '30.00',
        baseWage: con.wage,
        grossAmount: String(gross.toFixed(2)),
        deductionAmount: String(totalDed.toFixed(2)),
        netAmount: String(net.toFixed(2)),
        isEmailSent: cycle.status === 'PAID',
      }).onConflictDoUpdate({
        target: payslips.payslipNumber,
        set: {
          grossAmount: String(gross.toFixed(2)),
          deductionAmount: String(totalDed.toFixed(2)),
          netAmount: String(net.toFixed(2)),
          status: cycle.status === 'PAID' ? 'PAID' : 'DRAFT',
        },
      }).returning();

      // Insert line items
      const lineItemsData = [
        { code: 'BASIC', name: 'Basic Salary (50%)', cat: 'BASIC', amt: basic, seq: 10 },
        { code: 'HRA', name: 'House Rent Allowance (40% Basic)', cat: 'ALW', amt: hra, seq: 20 },
        { code: 'SA', name: 'Special Allowance', cat: 'ALW', amt: sa, seq: 30 },
        { code: 'PF', name: 'Provident Fund (12% Basic)', cat: 'DED', amt: pf, seq: 40 },
        { code: 'PT', name: 'Professional Tax', cat: 'DED', amt: pt, seq: 50 },
        { code: 'TDS', name: 'Income Tax TDS (5%)', cat: 'DED', amt: tds, seq: 60 },
      ];

      for (const item of lineItemsData) {
        await db.insert(payslipLines).values({
          payslipId: createdSlip.id,
          salaryRuleId: ruleMap[item.code],
          categoryId: categoryMap[item.cat],
          name: item.name,
          code: item.code,
          categoryCode: item.cat,
          sequence: item.seq,
          totalAmount: String(item.amt.toFixed(2)),
        }).onConflictDoNothing();
      }
    }
  }

  console.log('  ✅ Payruns & Payslips: 5 monthly batches (May-Sep 2026) with detailed line items');

  console.log('\n========================================');
  console.log('🇮🇳 SEED COMPLETED SUCCESSFULLY IN INR (₹)');
  console.log('========================================');
  console.log('Total Monthly Enterprise Wage: ₹4,30,000.00');
  console.log('Active Headcount: 5 Employees across 4 Departments');
  console.log('Historical Cycles: May, June, July, August (Paid) + September (Draft)');
  console.log('Login credentials:');
  console.log('  Payroll Officer: payroll@peoplepay360.com / Password123!');
  console.log('  HR Manager:      hr@peoplepay360.com / Password123!');
  console.log('  Employee:        priya.sharma@company.com / Password123!\n');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
