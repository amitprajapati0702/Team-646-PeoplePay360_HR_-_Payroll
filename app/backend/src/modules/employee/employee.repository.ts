import { eq, and, or, ilike, sql, desc, asc, count } from 'drizzle-orm';
import { db } from '../../infrastructure/database/client.js';
import {
  employees,
  users,
  departments,
  jobPositions,
  workingSchedules,
  contracts,
  attendances,
  timeOffAllocations,
  timeOffRequests,
  payslips,
  auditLogs,
} from '../../infrastructure/database/schema/index.js';
import type {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  QueryEmployeesInput,
  KanbanQueryInput,
} from './employee.schema.js';
import type { SmartBadges, KanbanGroupItem } from './employee.types.js';

export class EmployeeRepository {
  async findMany(filters: QueryEmployeesInput) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (filters.search && filters.search.trim() !== '') {
      const searchPattern = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          ilike(employees.firstName, searchPattern),
          ilike(employees.lastName, searchPattern),
          ilike(employees.employeeCode, searchPattern),
          ilike(employees.workEmail, searchPattern)
        )
      );
    }

    if (filters.departmentId) {
      conditions.push(eq(employees.departmentId, filters.departmentId));
    }
    if (filters.jobPositionId) {
      conditions.push(eq(employees.jobPositionId, filters.jobPositionId));
    }
    if (filters.status) {
      conditions.push(eq(employees.status, filters.status));
    }
    if (filters.employmentType) {
      conditions.push(eq(employees.employmentType, filters.employmentType));
    }
    if (filters.managerId) {
      conditions.push(eq(employees.managerId, filters.managerId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const sortColumn = {
      firstName: employees.firstName,
      lastName: employees.lastName,
      employeeCode: employees.employeeCode,
      joiningDate: employees.joiningDate,
      createdAt: employees.createdAt,
    }[filters.sortBy || 'createdAt'] || employees.createdAt;

    const orderClause = filters.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const [items, totalResult] = await Promise.all([
      db
        .select({
          id: employees.id,
          employeeCode: employees.employeeCode,
          firstName: employees.firstName,
          lastName: employees.lastName,
          workEmail: employees.workEmail,
          personalEmail: employees.personalEmail,
          phone: employees.phone,
          employmentType: employees.employmentType,
          status: employees.status,
          joiningDate: employees.joiningDate,
          avatarUrl: employees.avatarUrl,
          createdAt: employees.createdAt,
          department: {
            id: departments.id,
            name: departments.name,
            code: departments.code,
          },
          jobPosition: {
            id: jobPositions.id,
            title: jobPositions.title,
            code: jobPositions.code,
          },
          workingSchedule: {
            id: workingSchedules.id,
            name: workingSchedules.name,
            code: workingSchedules.code,
          },
        })
        .from(employees)
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .leftJoin(jobPositions, eq(employees.jobPositionId, jobPositions.id))
        .leftJoin(workingSchedules, eq(employees.workingScheduleId, workingSchedules.id))
        .where(whereClause)
        .orderBy(orderClause)
        .limit(limit)
        .offset(offset),

      db
        .select({ total: count() })
        .from(employees)
        .where(whereClause),
    ]);

    const total = totalResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      items: items.map((item) => ({
        ...item,
        fullName: `${item.firstName} ${item.lastName}`,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async findById(id: string) {
    const record = await db.query.employees.findFirst({
      where: eq(employees.id, id),
      with: {
        department: {
          columns: { id: true, name: true, code: true },
        },
        jobPosition: {
          columns: { id: true, title: true, code: true },
        },
        manager: {
          columns: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            workEmail: true,
          },
        },
        workingSchedule: {
          columns: { id: true, name: true, code: true, totalWeeklyHours: true },
        },
      },
    });

    return record || null;
  }

  async findByEmail(email: string) {
    const record = await db.query.employees.findFirst({
      where: eq(employees.workEmail, email.toLowerCase().trim()),
    });
    return record || null;
  }

  async findByCode(code: string) {
    const record = await db.query.employees.findFirst({
      where: eq(employees.employeeCode, code.toUpperCase().trim()),
    });
    return record || null;
  }

  async getSmartBadges(employeeId: string): Promise<SmartBadges> {
    const now = new Date();
    const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    const [
      contractsList,
      attendancesCountResult,
      allocationsResult,
      pendingLeavesResult,
      payslipsCountResult,
    ] = await Promise.all([
      db
        .select({
          id: contracts.id,
          contractReference: contracts.contractReference,
          wage: contracts.wage,
          startDate: contracts.startDate,
          endDate: contracts.endDate,
          status: contracts.status,
        })
        .from(contracts)
        .where(eq(contracts.employeeId, employeeId)),

      db
        .select({ total: count() })
        .from(attendances)
        .where(
          and(
            eq(attendances.employeeId, employeeId),
            sql`${attendances.attendanceDate} >= ${startOfMonth}::date`
          )
        ),

      db
        .select({
          allocated: sql<string>`COALESCE(SUM(${timeOffAllocations.allocatedUnits}), 0)`,
          taken: sql<string>`COALESCE(SUM(${timeOffAllocations.takenUnits}), 0)`,
        })
        .from(timeOffAllocations)
        .where(
          and(
            eq(timeOffAllocations.employeeId, employeeId),
            eq(timeOffAllocations.status, 'APPROVED')
          )
        ),

      db
        .select({ total: count() })
        .from(timeOffRequests)
        .where(
          and(
            eq(timeOffRequests.employeeId, employeeId),
            eq(timeOffRequests.status, 'SUBMITTED')
          )
        ),

      db
        .select({ total: count() })
        .from(payslips)
        .where(eq(payslips.employeeId, employeeId)),
    ]);

    const activeContract =
      contractsList.find((c) => c.status === 'ACTIVE') || null;

    const allocatedDays = Number(allocationsResult[0]?.allocated || 0);
    const takenDays = Number(allocationsResult[0]?.taken || 0);

    return {
      contractsCount: contractsList.length,
      activeContract,
      attendancesCountThisMonth: attendancesCountResult[0]?.total || 0,
      timeOffAllocatedDays: allocatedDays,
      timeOffRemainingDays: Math.max(0, allocatedDays - takenDays),
      pendingTimeOffRequestsCount: pendingLeavesResult[0]?.total || 0,
      payslipsGeneratedCount: payslipsCountResult[0]?.total || 0,
    };
  }

  async getKanbanData(options: KanbanQueryInput): Promise<KanbanGroupItem[]> {
    const rawEmployees = await db
      .select({
        id: employees.id,
        employeeCode: employees.employeeCode,
        firstName: employees.firstName,
        lastName: employees.lastName,
        workEmail: employees.workEmail,
        avatarUrl: employees.avatarUrl,
        status: employees.status,
        employmentType: employees.employmentType,
        jobTitle: jobPositions.title,
        departmentId: departments.id,
        departmentName: departments.name,
      })
      .from(employees)
      .leftJoin(jobPositions, eq(employees.jobPositionId, jobPositions.id))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .orderBy(asc(employees.firstName));

    const groupBy = options.groupBy || 'status';

    type KanbanEmployeeCard = KanbanGroupItem['employees'][number];
    const groupMap = new Map<string, { title: string; list: KanbanEmployeeCard[] }>();

    if (groupBy === 'status') {
      const allStatuses = ['PROBATION', 'ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED'];
      allStatuses.forEach((st) => groupMap.set(st, { title: st.replace('_', ' '), list: [] }));
    } else if (groupBy === 'employmentType') {
      const allTypes = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'];
      allTypes.forEach((t) => groupMap.set(t, { title: t.replace('_', ' '), list: [] }));
    }

    for (const emp of rawEmployees) {
      let key = '';
      let title = '';

      if (groupBy === 'department') {
        key = emp.departmentId || 'unassigned';
        title = emp.departmentName || 'Unassigned';
      } else if (groupBy === 'employmentType') {
        key = emp.employmentType;
        title = emp.employmentType.replace('_', ' ');
      } else {
        key = emp.status;
        title = emp.status.replace('_', ' ');
      }

      if (!groupMap.has(key)) {
        groupMap.set(key, { title, list: [] });
      }

      groupMap.get(key)!.list.push({
        id: emp.id,
        employeeCode: emp.employeeCode,
        firstName: emp.firstName,
        lastName: emp.lastName,
        fullName: `${emp.firstName} ${emp.lastName}`,
        workEmail: emp.workEmail,
        avatarUrl: emp.avatarUrl,
        jobTitle: emp.jobTitle || 'N/A',
        departmentName: emp.departmentName || 'N/A',
        status: emp.status,
        employmentType: emp.employmentType,
      });
    }

    return Array.from(groupMap.entries()).map(([key, value]) => ({
      key,
      title: value.title,
      count: value.list.length,
      employees: value.list,
    }));
  }

  async getReportingTree(employeeId: string) {
    const [employee, directReports] = await Promise.all([
      db.query.employees.findFirst({
        where: eq(employees.id, employeeId),
        with: {
          manager: {
            columns: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
              workEmail: true,
              avatarUrl: true,
            },
          },
        },
      }),
      db.query.employees.findMany({
        where: eq(employees.managerId, employeeId),
        columns: {
          id: true,
          employeeCode: true,
          firstName: true,
          lastName: true,
          workEmail: true,
          status: true,
          avatarUrl: true,
        },
        with: {
          jobPosition: { columns: { title: true } },
          department: { columns: { name: true } },
        },
      }),
    ]);

    return {
      employeeId,
      manager: employee?.manager || null,
      directReportsCount: directReports.length,
      directReports,
    };
  }

  async create(data: CreateEmployeeInput, actingUserId?: string) {
    return await db.transaction(async (tx) => {
      let createdUserId: string | null = null;

      if (data.createUserAccount && data.userPassword) {
        const [newUser] = await tx
          .insert(users)
          .values({
            email: data.workEmail.toLowerCase().trim(),
            passwordHash: data.userPassword, // In production, password hash is handled in service
            role: data.userRole || 'EMPLOYEE',
            isActive: data.status === 'ACTIVE' || data.status === 'PROBATION',
          })
          .returning();
        createdUserId = newUser.id;
      }

      const [newEmployee] = await tx
        .insert(employees)
        .values({
          userId: createdUserId,
          employeeCode: data.employeeCode.toUpperCase().trim(),
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          workEmail: data.workEmail.toLowerCase().trim(),
          personalEmail: data.personalEmail?.trim() || null,
          phone: data.phone?.trim() || null,
          gender: data.gender || null,
          dateOfBirth: data.dateOfBirth || null,
          joiningDate: data.joiningDate,
          exitDate: data.exitDate || null,
          departmentId: data.departmentId,
          jobPositionId: data.jobPositionId,
          managerId: data.managerId || null,
          workingScheduleId: data.workingScheduleId,
          employmentType: data.employmentType || 'FULL_TIME',
          status: data.status || 'ACTIVE',
          bankName: data.bankName || null,
          bankAccountNumber: data.bankAccountNumber || null,
          bankRoutingOrIfsc: data.bankRoutingOrIfsc || null,
          bankAccountHolderName: data.bankAccountHolderName || null,
          avatarUrl: data.avatarUrl || null,
        })
        .returning();

      // Audit Log
      await tx.insert(auditLogs).values({
        userId: actingUserId || null,
        action: 'CREATE_EMPLOYEE',
        entityName: 'employees',
        entityId: newEmployee.id,
        payloadAfter: newEmployee,
      });

      return newEmployee;
    });
  }

  async update(id: string, data: UpdateEmployeeInput, actingUserId?: string) {
    return await db.transaction(async (tx) => {
      const existing = await tx.query.employees.findFirst({
        where: eq(employees.id, id),
      });

      if (!existing) return null;

      const [updated] = await tx
        .update(employees)
        .set({
          ...data,
          employeeCode: data.employeeCode ? data.employeeCode.toUpperCase().trim() : undefined,
          workEmail: data.workEmail ? data.workEmail.toLowerCase().trim() : undefined,
          updatedAt: new Date(),
        })
        .where(eq(employees.id, id))
        .returning();

      // Audit Log
      await tx.insert(auditLogs).values({
        userId: actingUserId || null,
        action: 'UPDATE_EMPLOYEE',
        entityName: 'employees',
        entityId: id,
        payloadBefore: existing,
        payloadAfter: updated,
      });

      return updated;
    });
  }

  async updateStatus(
    id: string,
    status: 'PROBATION' | 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED',
    exitDate?: string | null,
    actingUserId?: string
  ) {
    return await db.transaction(async (tx) => {
      const existing = await tx.query.employees.findFirst({
        where: eq(employees.id, id),
      });

      if (!existing) return null;

      const [updated] = await tx
        .update(employees)
        .set({
          status,
          exitDate: exitDate !== undefined ? exitDate : existing.exitDate,
          updatedAt: new Date(),
        })
        .where(eq(employees.id, id))
        .returning();

      // If terminated, deactivate user login
      if (status === 'TERMINATED' && existing.userId) {
        await tx
          .update(users)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(users.id, existing.userId));
      }

      await tx.insert(auditLogs).values({
        userId: actingUserId || null,
        action: 'UPDATE_EMPLOYEE_STATUS',
        entityName: 'employees',
        entityId: id,
        payloadBefore: existing,
        payloadAfter: updated,
      });

      return updated;
    });
  }

  async delete(id: string, actingUserId?: string) {
    return await db.transaction(async (tx) => {
      const existing = await tx.query.employees.findFirst({
        where: eq(employees.id, id),
      });

      if (!existing) return null;

      const [deleted] = await tx
        .delete(employees)
        .where(eq(employees.id, id))
        .returning();

      if (existing.userId) {
        await tx.delete(users).where(eq(users.id, existing.userId));
      }

      await tx.insert(auditLogs).values({
        userId: actingUserId || null,
        action: 'DELETE_EMPLOYEE',
        entityName: 'employees',
        entityId: id,
        payloadBefore: existing,
      });

      return deleted;
    });
  }

  async getFormOptions() {
    let [allDepartments, allPositions, allSchedules] = await Promise.all([
      db.select().from(departments).where(eq(departments.isActive, true)),
      db.select().from(jobPositions).where(eq(jobPositions.isActive, true)),
      db.select().from(workingSchedules).where(eq(workingSchedules.isActive, true)),
    ]);

    // If database tables are empty, seed standard enterprise defaults
    if (allDepartments.length === 0 || allPositions.length === 0 || allSchedules.length === 0) {
      if (allDepartments.length === 0) {
        allDepartments = await db
          .insert(departments)
          .values([
            { code: 'ENG', name: 'Engineering' },
            { code: 'HR', name: 'Human Resources' },
            { code: 'FIN', name: 'Finance & Accounting' },
            { code: 'MKT', name: 'Marketing & Growth' },
            { code: 'OPS', name: 'Operations' },
          ])
          .returning();
      }

      if (allSchedules.length === 0) {
        allSchedules = await db
          .insert(workingSchedules)
          .values([
            { code: 'STD-40', name: 'Standard Full-Time (40h/week)', totalWeeklyHours: '40.00' },
            { code: 'FLX-35', name: 'Flexible (35h/week)', totalWeeklyHours: '35.00' },
            { code: 'PT-20', name: 'Part-Time (20h/week)', totalWeeklyHours: '20.00' },
          ])
          .returning();
      }

      if (allPositions.length === 0 && allDepartments.length > 0) {
        const engDept = allDepartments.find((d) => d.code === 'ENG') || allDepartments[0];
        const hrDept = allDepartments.find((d) => d.code === 'HR') || allDepartments[0];
        const finDept = allDepartments.find((d) => d.code === 'FIN') || allDepartments[0];
        const opsDept = allDepartments.find((d) => d.code === 'OPS') || allDepartments[0];

        allPositions = await db
          .insert(jobPositions)
          .values([
            { departmentId: engDept.id, code: 'SWE-SR', title: 'Senior Software Engineer' },
            { departmentId: engDept.id, code: 'SWE-FE', title: 'Frontend Developer' },
            { departmentId: engDept.id, code: 'SWE-BE', title: 'Backend Developer' },
            { departmentId: hrDept.id, code: 'HR-MGR', title: 'HR Manager' },
            { departmentId: hrDept.id, code: 'HR-SPEC', title: 'Talent Acquisition Specialist' },
            { departmentId: finDept.id, code: 'FIN-ACC', title: 'Senior Accountant' },
            { departmentId: opsDept.id, code: 'OPS-LEAD', title: 'Operations Lead' },
          ])
          .returning();
      }
    }

    const rawManagers = await db
      .select({
        id: employees.id,
        employeeCode: employees.employeeCode,
        firstName: employees.firstName,
        lastName: employees.lastName,
        workEmail: employees.workEmail,
      })
      .from(employees)
      .where(or(eq(employees.status, 'ACTIVE'), eq(employees.status, 'PROBATION')))
      .orderBy(asc(employees.firstName));

    return {
      departments: allDepartments.map((d) => ({ id: d.id, name: d.name, code: d.code })),
      jobPositions: allPositions.map((p) => ({
        id: p.id,
        title: p.title,
        code: p.code,
        departmentId: p.departmentId,
      })),
      workingSchedules: allSchedules.map((s) => ({
        id: s.id,
        name: s.name,
        code: s.code,
        totalWeeklyHours: s.totalWeeklyHours,
      })),
      managers: rawManagers.map((m) => ({
        id: m.id,
        fullName: `${m.firstName} ${m.lastName}`,
        employeeCode: m.employeeCode,
        workEmail: m.workEmail,
      })),
    };
  }
}

export const employeeRepository = new EmployeeRepository();

