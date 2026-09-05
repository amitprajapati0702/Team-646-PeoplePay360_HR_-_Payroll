import { db } from '../../infrastructure/database/client.js';
import {
  departments,
  jobPositions,
  workingSchedules,
  workingScheduleLines,
} from '../../infrastructure/database/schema/index.js';
import { eq, ilike, and, or, sql } from 'drizzle-orm';
import ApiError from '../../utils/Apierror.js';
import httpStatus from '../../utils/http-status.js';
import type {
  CreateDepartmentInput,
  UpdateDepartmentInput,
  CreateJobPositionInput,
  UpdateJobPositionInput,
  CreateWorkingScheduleInput,
  UpdateWorkingScheduleInput,
  ListQueryInput,
} from './organization.schema.js';

export class OrganizationService {
  // ─── Departments ────────────────────────────────────────────────
  async listDepartments(query: ListQueryInput) {
    const conditions = [];
    if (query.search) {
      conditions.push(
        or(
          ilike(departments.name, `%${query.search}%`),
          ilike(departments.code, `%${query.search}%`)
        )
      );
    }
    if (query.isActive !== undefined) {
      conditions.push(eq(departments.isActive, query.isActive));
    }

    const rows = await db.query.departments.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: {
        manager: { columns: { id: true, firstName: true, lastName: true } },
        jobPositions: { columns: { id: true, title: true } },
        employees: { columns: { id: true } },
      },
      orderBy: (d, { asc }) => [asc(d.name)],
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    });

    return rows;
  }

  async getDepartmentById(id: string) {
    const dept = await db.query.departments.findFirst({
      where: eq(departments.id, id),
      with: {
        manager: { columns: { id: true, firstName: true, lastName: true } },
        jobPositions: true,
        employees: { columns: { id: true, firstName: true, lastName: true, status: true } },
      },
    });

    if (!dept) {
      throw new ApiError({
        statuscode: httpStatus.NOT_FOUND,
        message: 'Department not found.',
        errorcode: 'DEPARTMENT_NOT_FOUND',
      });
    }
    return dept;
  }

  async createDepartment(data: CreateDepartmentInput) {
    const existing = await db.query.departments.findFirst({
      where: eq(departments.code, data.code.toUpperCase()),
    });
    if (existing) {
      throw new ApiError({
        statuscode: httpStatus.CONFLICT,
        message: `Department code '${data.code}' already exists.`,
        errorcode: 'DEPT_CODE_EXISTS',
      });
    }

    const [created] = await db
      .insert(departments)
      .values({
        code: data.code.toUpperCase(),
        name: data.name,
        managerId: data.managerId ?? null,
        parentDepartmentId: data.parentDepartmentId ?? null,
        isActive: data.isActive,
      })
      .returning();

    return created;
  }

  async updateDepartment(id: string, data: UpdateDepartmentInput) {
    const existing = await db.query.departments.findFirst({ where: eq(departments.id, id) });
    if (!existing) {
      throw new ApiError({
        statuscode: httpStatus.NOT_FOUND,
        message: 'Department not found.',
        errorcode: 'DEPARTMENT_NOT_FOUND',
      });
    }

    const [updated] = await db
      .update(departments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(departments.id, id))
      .returning();

    return updated;
  }

  async deleteDepartment(id: string) {
    const existing = await db.query.departments.findFirst({ where: eq(departments.id, id) });
    if (!existing) {
      throw new ApiError({
        statuscode: httpStatus.NOT_FOUND,
        message: 'Department not found.',
        errorcode: 'DEPARTMENT_NOT_FOUND',
      });
    }

    const [deleted] = await db.delete(departments).where(eq(departments.id, id)).returning();
    return deleted;
  }

  // ─── Job Positions ──────────────────────────────────────────────
  async listJobPositions(query: ListQueryInput & { departmentId?: string }) {
    const conditions = [];
    if (query.search) {
      conditions.push(
        or(ilike(jobPositions.title, `%${query.search}%`), ilike(jobPositions.code, `%${query.search}%`))
      );
    }
    if (query.isActive !== undefined) conditions.push(eq(jobPositions.isActive, query.isActive));
    if (query.departmentId) conditions.push(eq(jobPositions.departmentId, query.departmentId));

    return await db.query.jobPositions.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: { department: { columns: { id: true, name: true, code: true } } },
      orderBy: (jp, { asc }) => [asc(jp.title)],
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    });
  }

  async getJobPositionById(id: string) {
    const pos = await db.query.jobPositions.findFirst({
      where: eq(jobPositions.id, id),
      with: { department: true, employees: { columns: { id: true, firstName: true, lastName: true } } },
    });
    if (!pos) {
      throw new ApiError({
        statuscode: httpStatus.NOT_FOUND,
        message: 'Job position not found.',
        errorcode: 'JOB_POSITION_NOT_FOUND',
      });
    }
    return pos;
  }

  async createJobPosition(data: CreateJobPositionInput) {
    const deptExists = await db.query.departments.findFirst({
      where: eq(departments.id, data.departmentId),
    });
    if (!deptExists) {
      throw new ApiError({
        statuscode: httpStatus.BAD_REQUEST,
        message: 'Department not found.',
        errorcode: 'INVALID_DEPARTMENT',
      });
    }

    const codeExists = await db.query.jobPositions.findFirst({
      where: eq(jobPositions.code, data.code.toUpperCase()),
    });
    if (codeExists) {
      throw new ApiError({
        statuscode: httpStatus.CONFLICT,
        message: `Job position code '${data.code}' already exists.`,
        errorcode: 'JP_CODE_EXISTS',
      });
    }

    const [created] = await db
      .insert(jobPositions)
      .values({ ...data, code: data.code.toUpperCase() })
      .returning();
    return created;
  }

  async updateJobPosition(id: string, data: UpdateJobPositionInput) {
    const existing = await db.query.jobPositions.findFirst({ where: eq(jobPositions.id, id) });
    if (!existing) {
      throw new ApiError({
        statuscode: httpStatus.NOT_FOUND,
        message: 'Job position not found.',
        errorcode: 'JOB_POSITION_NOT_FOUND',
      });
    }

    const [updated] = await db
      .update(jobPositions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(jobPositions.id, id))
      .returning();
    return updated;
  }

  async deleteJobPosition(id: string) {
    const existing = await db.query.jobPositions.findFirst({ where: eq(jobPositions.id, id) });
    if (!existing) {
      throw new ApiError({
        statuscode: httpStatus.NOT_FOUND,
        message: 'Job position not found.',
        errorcode: 'JOB_POSITION_NOT_FOUND',
      });
    }
    const [deleted] = await db.delete(jobPositions).where(eq(jobPositions.id, id)).returning();
    return deleted;
  }

  // ─── Working Schedules ──────────────────────────────────────────
  async listWorkingSchedules(query: ListQueryInput) {
    const conditions = [];
    if (query.search) {
      conditions.push(or(ilike(workingSchedules.name, `%${query.search}%`), ilike(workingSchedules.code, `%${query.search}%`)));
    }
    if (query.isActive !== undefined) conditions.push(eq(workingSchedules.isActive, query.isActive));

    return await db.query.workingSchedules.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: { lines: true },
      orderBy: (ws, { asc }) => [asc(ws.name)],
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    });
  }

  async getWorkingScheduleById(id: string) {
    const sched = await db.query.workingSchedules.findFirst({
      where: eq(workingSchedules.id, id),
      with: { lines: { orderBy: (l, { asc }) => [asc(l.dayOfWeek)] } },
    });
    if (!sched) {
      throw new ApiError({
        statuscode: httpStatus.NOT_FOUND,
        message: 'Working schedule not found.',
        errorcode: 'SCHEDULE_NOT_FOUND',
      });
    }
    return sched;
  }

  async createWorkingSchedule(data: CreateWorkingScheduleInput) {
    const codeExists = await db.query.workingSchedules.findFirst({
      where: eq(workingSchedules.code, data.code.toUpperCase()),
    });
    if (codeExists) {
      throw new ApiError({
        statuscode: httpStatus.CONFLICT,
        message: `Schedule code '${data.code}' already exists.`,
        errorcode: 'SCHEDULE_CODE_EXISTS',
      });
    }

    const [created] = await db
      .insert(workingSchedules)
      .values({
        name: data.name,
        code: data.code.toUpperCase(),
        scheduleType: data.scheduleType ?? 'STANDARD',
        totalWeeklyHours: String(data.totalWeeklyHours ?? 40),
        isActive: data.isActive ?? true,
      })
      .returning();

    if (data.lines?.length) {
      await db.insert(workingScheduleLines).values(
        data.lines.map((l) => ({
          workingScheduleId: created.id,
          dayOfWeek: l.dayOfWeek,
          workFrom: l.workFrom,
          workTo: l.workTo,
          breakDurationMinutes: l.breakDurationMinutes ?? 60,
          dailyWorkingHours: l.dailyWorkingHours ? String(l.dailyWorkingHours) : null,
        }))
      );
    }

    return this.getWorkingScheduleById(created.id);
  }

  async updateWorkingSchedule(id: string, data: UpdateWorkingScheduleInput) {
    const existing = await db.query.workingSchedules.findFirst({ where: eq(workingSchedules.id, id) });
    if (!existing) {
      throw new ApiError({
        statuscode: httpStatus.NOT_FOUND,
        message: 'Working schedule not found.',
        errorcode: 'SCHEDULE_NOT_FOUND',
      });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.code !== undefined) updateData.code = data.code.toUpperCase();
    if (data.scheduleType !== undefined) updateData.scheduleType = data.scheduleType;
    if (data.totalWeeklyHours !== undefined) updateData.totalWeeklyHours = String(data.totalWeeklyHours);
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    await db.update(workingSchedules).set(updateData).where(eq(workingSchedules.id, id));

    if (data.lines !== undefined) {
      await db.delete(workingScheduleLines).where(eq(workingScheduleLines.workingScheduleId, id));
      if (data.lines.length > 0) {
        await db.insert(workingScheduleLines).values(
          data.lines.map((l) => ({
            workingScheduleId: id,
            dayOfWeek: l.dayOfWeek,
            workFrom: l.workFrom,
            workTo: l.workTo,
            breakDurationMinutes: l.breakDurationMinutes ?? 60,
            dailyWorkingHours: l.dailyWorkingHours ? String(l.dailyWorkingHours) : null,
          }))
        );
      }
    }

    return this.getWorkingScheduleById(id);
  }

  async deleteWorkingSchedule(id: string) {
    const existing = await db.query.workingSchedules.findFirst({ where: eq(workingSchedules.id, id) });
    if (!existing) {
      throw new ApiError({
        statuscode: httpStatus.NOT_FOUND,
        message: 'Working schedule not found.',
        errorcode: 'SCHEDULE_NOT_FOUND',
      });
    }
    const [deleted] = await db.delete(workingSchedules).where(eq(workingSchedules.id, id)).returning();
    return deleted;
  }
}

export const organizationService = new OrganizationService();
