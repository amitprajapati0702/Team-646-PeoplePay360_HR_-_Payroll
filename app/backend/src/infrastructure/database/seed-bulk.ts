/**
 * PeoplePay360 Bulk Enterprise Seeding Script
 * Generates 250+ unique records across all system tables in Indian Rupees (₹).
 * Run: npx tsx src/infrastructure/database/seed-bulk.ts
 */

import 'dotenv/config';
import { db } from './client.js';
import {
  users, departments, jobPositions, workingSchedules, workingScheduleLines,
  employees, contracts, salaryRuleCategories, salaryStructures, salaryRules,
  salaryStructureRules, attendances, timeOffTypes, timeOffAllocations, timeOffRequests,
  payruns, payslips, payslipLines, auditLogs,
} from './schema/index.js';
import bcrypt from 'bcryptjs';

// Comprehensive Indian Names Dataset
const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Reyansh', 'Muhammad', 'Sai',
  'Arnav', 'Aayush', 'Krishna', 'Ishan', 'Shaurya', 'Atharv', 'Advik', 'Pranav',
  'Aditi', 'Ananya', 'Diya', 'Gauri', 'Ishita', 'Kavya', 'Khushi', 'Meera',
  'Navya', 'Pooja', 'Priya', 'Riya', 'Saanvi', 'Shreya', 'Sneha', 'Tanvi',
  'Vanya', 'Zoya', 'Rohan', 'Vikram', 'Nikhil', 'Siddharth', 'Varun', 'Kunal',
  'Deepak', 'Manish', 'Suresh', 'Ramesh', 'Alok', 'Abhishek', 'Gaurav', 'Tarun',
  'Neha', 'Swati', 'Pooja', 'Sunita', 'Divya', 'Komal', 'Ritu', 'Aarti',
  'Harsh', 'Mayank', 'Chirag', 'Yash', 'Dev', 'Karan', 'Rajesh', 'Amit'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Mehta', 'Kumar', 'Singh', 'Gupta', 'Joshi',
  'Rao', 'Nair', 'Chatterjee', 'Mukhopadhyay', 'Iyer', 'Kulkarni', 'Deshmukh',
  'Reddy', 'Nambiar', 'Bhat', 'Hegde', 'Agarwal', 'Bansal', 'Malhotra', 'Kapoor',
  'Khanna', 'Chopra', 'Saxena', 'Mishra', 'Pandey', 'Trivedi', 'Shukla', 'Dubey',
  'Chauhan', 'Yadav', 'Thakur', 'Bose', 'Dutta', 'Sengupta', 'Ghosh', 'Banerjee',
  'Pillai', 'Menon', 'Venkatesh', 'Subramanian', 'Krishnan', 'Narayanan', 'Naidu',
  'Gowda', 'Shetty', 'Pai', 'Kamath', 'Prabhu', 'Bhandari', 'Soni', 'Jain',
  'Shah', 'Parekh', 'Vora', 'Modi', 'Gandhi', 'Doshi', 'Merchant', 'Contractor'
];

const DEPARTMENTS_DATA = [
  { code: 'ENG', name: 'Engineering & Technology' },
  { code: 'HR', name: 'Human Resources & People Ops' },
  { code: 'FIN', name: 'Finance & Accounts' },
  { code: 'SALES', name: 'Sales & Business Development' },
  { code: 'MKTG', name: 'Marketing & Brand Communications' },
  { code: 'CS', name: 'Customer Success & Support' },
  { code: 'PROD', name: 'Product Management' },
  { code: 'QA', name: 'Quality Assurance & Testing' },
  { code: 'DEVOPS', name: 'Cloud Infrastructure & DevOps' },
  { code: 'LEGAL', name: 'Legal & Regulatory Compliance' },
  { code: 'IT', name: 'Information Technology & Security' },
  { code: 'OPS', name: 'Operations & Facilities' },
  { code: 'DATA', name: 'Data Engineering & Analytics' },
  { code: 'DESIGN', name: 'UI/UX Design & Research' },
  { code: 'RD', name: 'Research & Advanced Innovation' },
  { code: 'SUPPLY', name: 'Procurement & Supply Chain' },
];

const POSITIONS_DATA = [
  { code: 'ENG-SWE', title: 'Software Engineer', dept: 'ENG' },
  { code: 'ENG-SR-SWE', title: 'Senior Software Engineer', dept: 'ENG' },
  { code: 'ENG-LEAD', title: 'Staff Software Engineer', dept: 'ENG' },
  { code: 'ENG-ARCH', title: 'Principal Solutions Architect', dept: 'ENG' },
  { code: 'HR-EXEC', title: 'HR Executive', dept: 'HR' },
  { code: 'HR-BP', title: 'HR Business Partner', dept: 'HR' },
  { code: 'HR-TALENT', title: 'Talent Acquisition Lead', dept: 'HR' },
  { code: 'FIN-ANLT', title: 'Financial Analyst', dept: 'FIN' },
  { code: 'FIN-ACC', title: 'Senior Accountant', dept: 'FIN' },
  { code: 'FIN-CTRL', title: 'Financial Controller', dept: 'FIN' },
  { code: 'SALES-EXEC', title: 'Account Executive', dept: 'SALES' },
  { code: 'SALES-BDR', title: 'Business Development Rep', dept: 'SALES' },
  { code: 'SALES-MGR', title: 'Enterprise Sales Manager', dept: 'SALES' },
  { code: 'MKTG-SPEC', title: 'Digital Marketing Specialist', dept: 'MKTG' },
  { code: 'MKTG-CNT', title: 'Content & Social Lead', dept: 'MKTG' },
  { code: 'CS-SPEC', title: 'Customer Success Specialist', dept: 'CS' },
  { code: 'CS-LEAD', title: 'Customer Success Manager', dept: 'CS' },
  { code: 'PROD-PM', title: 'Product Manager', dept: 'PROD' },
  { code: 'PROD-GPM', title: 'Group Product Manager', dept: 'PROD' },
  { code: 'QA-ENG', title: 'QA Automation Engineer', dept: 'QA' },
  { code: 'QA-LEAD', title: 'QA Test Lead', dept: 'QA' },
  { code: 'DEV-ENG', title: 'DevOps Engineer', dept: 'DEVOPS' },
  { code: 'DEV-SRE', title: 'Site Reliability Engineer', dept: 'DEVOPS' },
  { code: 'LEG-COUNS', title: 'Corporate Legal Counsel', dept: 'LEGAL' },
  { code: 'IT-SPEC', title: 'IT Systems Administrator', dept: 'IT' },
  { code: 'IT-SEC', title: 'Cybersecurity Analyst', dept: 'IT' },
  { code: 'OPS-MGR', title: 'Operations Manager', dept: 'OPS' },
  { code: 'DATA-ENG', title: 'Data Engineer', dept: 'DATA' },
  { code: 'DATA-SCI', title: 'Data Scientist', dept: 'DATA' },
  { code: 'UI-DES', title: 'Product Designer (UI/UX)', dept: 'DESIGN' },
  { code: 'RD-RES', title: 'Research Scientist', dept: 'RD' },
  { code: 'SUP-SPEC', title: 'Supply Chain Analyst', dept: 'SUPPLY' },
];

const BANKS = [
  { name: 'HDFC Bank', ifscPrefix: 'HDFC' },
  { name: 'ICICI Bank', ifscPrefix: 'ICIC' },
  { name: 'State Bank of India', ifscPrefix: 'SBIN' },
  { name: 'Axis Bank', ifscPrefix: 'UTIB' },
  { name: 'Kotak Mahindra Bank', ifscPrefix: 'KKBK' },
  { name: 'Punjab National Bank', ifscPrefix: 'PUNB' },
];

async function seedBulk() {
  console.log('====================================================');
  console.log('🚀 STARTING BULK ENTERPRISE DATA SEED (250+ UNIQUE RECORDS)');
  console.log('====================================================\n');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // ─── 1. Ensure Core Admin & Managers Exist ────────────────────────
  console.log('1. Verifying Core Administrator & Manager Accounts...');
  const [adminUser] = await db.insert(users).values({
    email: 'admin@peoplepay360.com',
    passwordHash,
    role: 'ADMIN',
    isActive: true,
  }).onConflictDoUpdate({
    target: users.email,
    set: { role: 'ADMIN', isActive: true },
  }).returning();

  const [hrManagerUser] = await db.insert(users).values({
    email: 'hr@peoplepay360.com',
    passwordHash,
    role: 'HR_MANAGER',
    isActive: true,
  }).onConflictDoUpdate({
    target: users.email,
    set: { role: 'HR_MANAGER', isActive: true },
  }).returning();

  const [payrollUser] = await db.insert(users).values({
    email: 'payroll@peoplepay360.com',
    passwordHash,
    role: 'HR_PAYROLL_MANAGER',
    isActive: true,
  }).onConflictDoUpdate({
    target: users.email,
    set: { role: 'HR_PAYROLL_MANAGER', isActive: true },
  }).returning();

  console.log('   ✅ Core Administrative users verified.\n');

  // ─── 2. Departments (16 Departments) ──────────────────────────────
  console.log('2. Seeding 16 Organizational Departments...');
  const deptMap: Record<string, string> = {};
  for (const d of DEPARTMENTS_DATA) {
    const [created] = await db.insert(departments).values({
      code: d.code,
      name: d.name,
      isActive: true,
    }).onConflictDoUpdate({
      target: departments.code,
      set: { name: d.name, isActive: true },
    }).returning();
    deptMap[d.code] = created.id;
  }
  console.log(`   ✅ ${Object.keys(deptMap).length} Departments initialized.\n`);

  // ─── 3. Job Positions (32 Positions) ──────────────────────────────
  console.log('3. Seeding 32 Specialized Job Positions...');
  const posMap: Record<string, string> = {};
  for (const p of POSITIONS_DATA) {
    const deptId = deptMap[p.dept];
    if (!deptId) continue;
    const [created] = await db.insert(jobPositions).values({
      code: p.code,
      title: p.title,
      departmentId: deptId,
      isActive: true,
    }).onConflictDoUpdate({
      target: jobPositions.code,
      set: { title: p.title, departmentId: deptId, isActive: true },
    }).returning();
    posMap[p.code] = created.id;
  }
  console.log(`   ✅ ${Object.keys(posMap).length} Job Positions initialized.\n`);

  // ─── 4. Working Schedules (4 Schedules) ───────────────────────────
  console.log('4. Seeding Working Schedules & Working Schedule Lines...');
  const schedulesData = [
    { code: 'STD-9-6', name: 'Standard 9AM-6PM (Mon-Fri)', from: '09:00', to: '18:00', weekly: '40.00' },
    { code: 'EARLY-8-5', name: 'Early Shift 8AM-5PM (Mon-Fri)', from: '08:00', to: '17:00', weekly: '40.00' },
    { code: 'LATE-10-7', name: 'General Shift 10AM-7PM (Mon-Fri)', from: '10:00', to: '19:00', weekly: '40.00' },
    { code: 'ROTA-40', name: 'Rotational 40-Hour Shift', from: '09:30', to: '18:30', weekly: '40.00' },
  ];

  const schedIds: string[] = [];
  const stdDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const;

  for (const s of schedulesData) {
    const [created] = await db.insert(workingSchedules).values({
      code: s.code,
      name: s.name,
      scheduleType: 'STANDARD',
      totalWeeklyHours: s.weekly,
      isActive: true,
    }).onConflictDoUpdate({
      target: workingSchedules.code,
      set: { name: s.name, totalWeeklyHours: s.weekly, isActive: true },
    }).returning();

    schedIds.push(created.id);

    for (const day of stdDays) {
      await db.insert(workingScheduleLines).values({
        workingScheduleId: created.id,
        dayOfWeek: day,
        workFrom: s.from,
        workTo: s.to,
        breakDurationMinutes: 60,
        dailyWorkingHours: '8.00',
      }).onConflictDoNothing();
    }
  }
  console.log(`   ✅ ${schedIds.length} Working Schedules initialized with weekday lines.\n`);

  // ─── 5. Salary Structures & Rules ────────────────────────────────
  console.log('5. Seeding Salary Rule Categories, Rules & Structure...');
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

  const rulesData = [
    {
      code: 'BASIC', name: 'Basic Salary (50% Base)', categoryId: categoryMap['BASIC'],
      sequence: 10, computationType: 'PERCENTAGE' as const,
      percentage: '50.000', percentageBaseRuleCode: 'contract_wage',
      appearsOnPayslip: true, isActive: true,
    },
    {
      code: 'HRA', name: 'House Rent Allowance (40% Basic)', categoryId: categoryMap['ALW'],
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
      code: 'PF', name: 'Provident Fund (12% Basic)', categoryId: categoryMap['DED'],
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
  console.log('   ✅ Salary Structure & Statutory Indian Rules configured.\n');

  // ─── 6. Time Off Types ──────────────────────────────────────────
  console.log('6. Seeding Time Off Types...');
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
  console.log('   ✅ Time Off Types (Annual, Sick, Casual) configured.\n');

  // ─── 7. Generate 250 Unique Employees + Users + Contracts ───────
  console.log('7. Generating 250 Unique Employees, Users, and Employment Contracts...');
  const TOTAL_EMPLOYEES = 250;
  const deptCodes = Object.keys(deptMap);
  const posCodes = Object.keys(posMap);

  interface SeedEmployee {
    id: string;
    code: string;
    firstName: string;
    lastName: string;
    email: string;
    wage: string;
    deptId: string;
    posId: string;
    schedId: string;
  }

  const generatedEmployees: SeedEmployee[] = [];

  for (let i = 1; i <= TOTAL_EMPLOYEES; i++) {
    const numStr = String(1000 + i);
    const empCode = `EMP-${numStr}`;
    
    // Deterministic selection of unique Indian name combinations
    const firstIdx = (i * 7) % FIRST_NAMES.length;
    const lastIdx = (i * 11) % LAST_NAMES.length;
    const firstName = FIRST_NAMES[firstIdx];
    const lastName = LAST_NAMES[lastIdx];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${numStr}@peoplepay360.com`;
    const personalEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${numStr}@gmail.com`;

    // Indian Phone & Bank Details
    const phone = `+91 ${9800000000 + (i * 3719) % 199999999}`;
    const bank = BANKS[i % BANKS.length];
    const bankAcc = `${100000000000 + (i * 874319) % 899999999999}`;
    const ifsc = `${bank.ifscPrefix}000${String(1000 + (i % 900))}`;
    
    // Department & Position
    const deptCode = deptCodes[i % deptCodes.length];
    const deptId = deptMap[deptCode];
    const matchingPositions = POSITIONS_DATA.filter(p => p.dept === deptCode);
    const posChoice = matchingPositions.length > 0
      ? matchingPositions[i % matchingPositions.length].code
      : posCodes[i % posCodes.length];
    const posId = posMap[posChoice];
    const schedId = schedIds[i % schedIds.length];

    // Salary: ₹35,000 to ₹1,85,000 per month
    const baseWages = [35000, 42000, 50000, 60000, 75000, 85000, 95000, 110000, 125000, 140000, 160000, 185000];
    const wage = String(baseWages[i % baseWages.length] + ((i * 500) % 5000)) + '.00';

    // 1. Create User
    const [userRecord] = await db.insert(users).values({
      email,
      passwordHash,
      role: 'EMPLOYEE',
      isActive: true,
    }).onConflictDoUpdate({
      target: users.email,
      set: { role: 'EMPLOYEE', isActive: true },
    }).returning();

    // 2. Create Employee
    const [empRecord] = await db.insert(employees).values({
      userId: userRecord.id,
      employeeCode: empCode,
      firstName,
      lastName,
      workEmail: email,
      personalEmail,
      phone,
      gender: i % 2 === 0 ? 'Male' : 'Female',
      joiningDate: `202${2 + (i % 4)}-0${1 + (i % 8)}-${10 + (i % 15)}`,
      departmentId: deptId,
      jobPositionId: posId,
      workingScheduleId: schedId,
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      bankName: bank.name,
      bankAccountNumber: bankAcc,
      bankRoutingOrIfsc: ifsc,
      bankAccountHolderName: `${firstName} ${lastName}`,
    }).onConflictDoUpdate({
      target: employees.employeeCode,
      set: {
        userId: userRecord.id,
        workEmail: email,
        bankName: bank.name,
        bankAccountNumber: bankAcc,
        bankRoutingOrIfsc: ifsc,
      },
    }).returning();

    // 3. Create Employment Contract
    const contractRef = `CON-2026-${numStr}`;
    await db.insert(contracts).values({
      contractReference: contractRef,
      employeeId: empRecord.id,
      departmentId: deptId,
      jobPositionId: posId,
      salaryStructureId: mainStructure.id,
      workingScheduleId: schedId,
      startDate: `202${2 + (i % 4)}-01-01`,
      wage,
      status: 'ACTIVE',
    }).onConflictDoUpdate({
      target: contracts.contractReference,
      set: { wage, status: 'ACTIVE' },
    });

    generatedEmployees.push({
      id: empRecord.id,
      code: empCode,
      firstName,
      lastName,
      email,
      wage,
      deptId,
      posId,
      schedId,
    });
  }

  console.log(`   ✅ 250 Employees, 250 Users, and 250 Contracts created successfully.\n`);

  // ─── 8. Time Off Allocations (750 records = 250 emp × 3 types) ────
  console.log('8. Seeding 750 Time Off Allocations (Annual, Sick, Casual)...');
  const currentYear = new Date().getFullYear();
  let allocCount = 0;

  for (const emp of generatedEmployees) {
    for (const [type, days] of [[annualLeave, 20], [sickLeave, 12], [casualLeave, 10]] as const) {
      await db.insert(timeOffAllocations).values({
        employeeId: emp.id,
        timeOffTypeId: type.id,
        allocatedUnits: String(days),
        takenUnits: '0.00',
        validityStart: `${currentYear}-01-01`,
        validityEnd: `${currentYear}-12-31`,
        status: 'APPROVED',
        approvedAt: new Date(),
      }).onConflictDoNothing();
      allocCount++;
    }
  }
  console.log(`   ✅ ${allocCount} Time Off Allocations seeded.\n`);

  // ─── 9. Time Off Requests (250+ unique requests) ─────────────────
  console.log('9. Seeding 250+ Leave Applications & Status Workflows...');
  const leaveReasons = [
    'Family function at hometown', 'Attending cousin wedding', 'Personal health checkup',
    'Viral fever recovery', 'Home renovation supervision', 'Passport renewal appointment',
    'Festival celebration with relatives', 'Child school admission work', 'Urgent personal errand'
  ];

  const leaveStatuses = ['APPROVED', 'APPROVED', 'APPROVED', 'SUBMITTED', 'REFUSED'] as const;

  for (let i = 0; i < generatedEmployees.length; i++) {
    const emp = generatedEmployees[i];
    const status = leaveStatuses[i % leaveStatuses.length];
    const reason = leaveReasons[i % leaveReasons.length];
    const startDay = 1 + (i % 25);
    const dateStr = `2026-09-${String(startDay).padStart(2, '0')}`;

    await db.insert(timeOffRequests).values({
      employeeId: emp.id,
      timeOffTypeId: i % 3 === 0 ? sickLeave.id : i % 3 === 1 ? casualLeave.id : annualLeave.id,
      startDate: dateStr,
      endDate: dateStr,
      requestedUnits: '1.00',
      status,
      reason,
      approvedByUserId: status === 'APPROVED' ? hrManagerUser.id : null,
      approvedAt: status === 'APPROVED' ? new Date() : null,
    }).onConflictDoNothing();
  }
  console.log('   ✅ 250+ Time Off Requests seeded.\n');

  // ─── 10. Attendance Records (600+ records) ────────────────────────
  console.log('10. Seeding 600+ Daily Attendance Punch Records...');
  const recentDays = ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04'];
  let attCount = 0;

  for (const emp of generatedEmployees) {
    for (const d of recentDays) {
      const checkInHour = 9;
      const checkInMin = (parseInt(emp.code.slice(-2)) * 3) % 25;
      const checkIn = new Date(`${d}T0${checkInHour}:${String(checkInMin).padStart(2, '0')}:00Z`);
      const checkOut = new Date(`${d}T18:${String((checkInMin + 15) % 45).padStart(2, '0')}:00Z`);

      await db.insert(attendances).values({
        employeeId: emp.id,
        attendanceDate: d,
        checkIn,
        checkOut,
        workedHours: '8.50',
        overtimeHours: '0.00',
        status: checkInMin > 20 ? 'LATE' : 'PRESENT',
        isManuallyEdited: false,
      }).onConflictDoNothing();
      attCount++;
    }
  }
  console.log(`   ✅ ${attCount} Attendance records seeded.\n`);

  // ─── 11. Payruns, 250 Payslips & 1,500 Payslip Lines ──────────────
  console.log('11. Processing Closed August 2026 Payrun with 250 Payslips & 1,500 Itemized Lines...');
  
  // Calculate aggregate payroll totals for 250 employees
  let totalGrossAggregate = 0;
  let totalDedAggregate = 0;
  let totalNetAggregate = 0;

  for (const emp of generatedEmployees) {
    const wage = parseFloat(emp.wage);
    const basic = wage * 0.5;
    const hra = basic * 0.4;
    const sa = wage * 0.3;
    const gross = basic + hra + sa;
    const pf = basic * 0.12;
    const pt = 200;
    const tds = gross * 0.05;
    const totalDed = pf + pt + tds;
    const net = gross - totalDed;

    totalGrossAggregate += gross;
    totalDedAggregate += totalDed;
    totalNetAggregate += net;
  }

  const [augustPayrun] = await db.insert(payruns).values({
    name: 'Payrun - August 2026 (Enterprise Batch)',
    batchCode: 'PAY-2026-08',
    periodStart: '2026-08-01',
    periodEnd: '2026-08-31',
    defaultSalaryStructureId: mainStructure.id,
    status: 'PAID',
    totalGrossAmount: String(totalGrossAggregate.toFixed(2)),
    totalDeductionAmount: String(totalDedAggregate.toFixed(2)),
    totalNetAmount: String(totalNetAggregate.toFixed(2)),
    totalPayslipCount: generatedEmployees.length,
    createdByUserId: payrollUser.id,
    validatedByUserId: payrollUser.id,
    validatedAt: new Date('2026-08-31T17:00:00Z'),
    paidAt: new Date('2026-08-31T18:00:00Z'),
    notes: 'Official August 2026 batch salary disbursement for all 250 personnel.',
  }).onConflictDoUpdate({
    target: payruns.batchCode,
    set: {
      totalGrossAmount: String(totalGrossAggregate.toFixed(2)),
      totalDeductionAmount: String(totalDedAggregate.toFixed(2)),
      totalNetAmount: String(totalNetAggregate.toFixed(2)),
      status: 'PAID',
    },
  }).returning();

  // Create payslips and line items for all 250 employees
  let slipCount = 0;
  let lineCount = 0;

  for (const emp of generatedEmployees) {
    const wageNum = parseFloat(emp.wage);
    const basic = wageNum * 0.5;
    const hra = basic * 0.4;
    const sa = wageNum * 0.3;
    const gross = basic + hra + sa;
    const pf = basic * 0.12;
    const pt = 200;
    const tds = gross * 0.05;
    const totalDed = pf + pt + tds;
    const net = gross - totalDed;
    const slipNum = `SLIP-2026-08-${emp.code}`;

    // Get employee contract
    const contract = await db.query.contracts.findFirst({
      where: (c, { eq }) => eq(c.employeeId, emp.id),
      columns: { id: true },
    });

    if (!contract) continue;

    const [createdSlip] = await db.insert(payslips).values({
      payslipNumber: slipNum,
      payrunId: augustPayrun.id,
      employeeId: emp.id,
      contractId: contract.id,
      salaryStructureId: mainStructure.id,
      periodStart: '2026-08-01',
      periodEnd: '2026-08-31',
      status: 'PAID',
      plannedWorkingDays: '30.00',
      actualWorkedDays: '30.00',
      baseWage: emp.wage,
      grossAmount: String(gross.toFixed(2)),
      deductionAmount: String(totalDed.toFixed(2)),
      netAmount: String(net.toFixed(2)),
      isEmailSent: true,
      emailSentAt: new Date('2026-08-31T18:30:00Z'),
    }).onConflictDoUpdate({
      target: payslips.payslipNumber,
      set: {
        grossAmount: String(gross.toFixed(2)),
        deductionAmount: String(totalDed.toFixed(2)),
        netAmount: String(net.toFixed(2)),
        status: 'PAID',
      },
    }).returning();

    slipCount++;

    // Insert 6 itemized line items
    const lines = [
      { code: 'BASIC', name: 'Basic Salary (50%)', cat: 'BASIC', amt: basic, seq: 10 },
      { code: 'HRA', name: 'House Rent Allowance (40% Basic)', cat: 'ALW', amt: hra, seq: 20 },
      { code: 'SA', name: 'Special Allowance (30%)', cat: 'ALW', amt: sa, seq: 30 },
      { code: 'PF', name: 'Provident Fund (12% Basic)', cat: 'DED', amt: pf, seq: 40 },
      { code: 'PT', name: 'Professional Tax', cat: 'DED', amt: pt, seq: 50 },
      { code: 'TDS', name: 'Income Tax TDS (5%)', cat: 'DED', amt: tds, seq: 60 },
    ];

    for (const l of lines) {
      await db.insert(payslipLines).values({
        payslipId: createdSlip.id,
        salaryRuleId: ruleMap[l.code],
        categoryId: categoryMap[l.cat],
        name: l.name,
        code: l.code,
        categoryCode: l.cat,
        sequence: l.seq,
        totalAmount: String(l.amt.toFixed(2)),
      }).onConflictDoNothing();
      lineCount++;
    }
  }

  console.log(`   ✅ ${slipCount} Payslips and ${lineCount} itemized Payslip Lines created.\n`);

  // ─── 12. Audit Logs (250+ compliance entries) ────────────────────
  console.log('12. Seeding 250+ Audit Compliance Logs...');
  for (let i = 0; i < generatedEmployees.length; i++) {
    const emp = generatedEmployees[i];
    await db.insert(auditLogs).values({
      userId: hrManagerUser.id,
      action: i % 2 === 0 ? 'COMPUTE_PAYSLIP' : 'CONTRACT_APPROVAL',
      entityName: i % 2 === 0 ? 'payslips' : 'contracts',
      entityId: emp.id,
      ipAddress: '127.0.0.1',
      payloadAfter: { employeeCode: emp.code, status: 'COMPLIANT' },
    }).onConflictDoNothing();
  }
  console.log('   ✅ 250+ Audit Compliance Logs recorded.\n');

  console.log('====================================================');
  console.log('🎉 BULK SEED COMPLETED SUCCESSFULLY IN INR (₹)');
  console.log('====================================================');
  console.log(`Employees:           ${generatedEmployees.length} unique profiles`);
  console.log(`Users:               ${generatedEmployees.length} employee accounts (Password: Password123!)`);
  console.log(`Departments:         ${Object.keys(deptMap).length} departments`);
  console.log(`Job Positions:       ${Object.keys(posMap).length} positions`);
  console.log(`Contracts:           ${generatedEmployees.length} active employment contracts`);
  console.log(`Time Off Allocations: ${allocCount} allocations`);
  console.log(`Attendance Records:  ${attCount} records`);
  console.log(`Payslips:            ${slipCount} official payslips`);
  console.log(`Payslip Lines:       ${lineCount} itemized lines`);
  console.log(`Total Payroll (Aug): ₹${totalGrossAggregate.toLocaleString('en-IN', { minimumFractionDigits: 2 })} Gross / ₹${totalNetAggregate.toLocaleString('en-IN', { minimumFractionDigits: 2 })} Net`);
  console.log('\nSample Employee Credentials for Self-Service Login:');
  for (let i = 0; i < 3; i++) {
    const e = generatedEmployees[i];
    console.log(`   ${e.firstName} ${e.lastName} (${e.code}): ${e.email} / Password123!`);
  }
  console.log('====================================================\n');
}

seedBulk()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Bulk seed failed:', err);
    process.exit(1);
  });
