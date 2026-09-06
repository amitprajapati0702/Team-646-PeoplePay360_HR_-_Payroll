import { db } from '../../infrastructure/database/client.js';
import {
  departments,
  jobPositions,
  workingSchedules,
  workingScheduleLines,
} from '../../infrastructure/database/schema/index.js';
import { eq, ilike, and, or, asc } from 'drizzle-orm';
import type {
  CreateDepartmentInput,
  UpdateDepartmentInput,
  CreateJobPositionInput,
  UpdateJobPositionInput,
  ListQueryInput,
} from './organization.schema.js';

export class OrganizationRepository {
  // Departments
  async findDepartments(query: ListQueryInput) {
    const conditions = [];
    if (query.search) {
      conditions.push(
        or(ilike(departments.name, `%${query.search}%`), ilike(departments.code, `%${query.search}%`))
      );
    }
    if (query.isActive !== undefined) conditions.push(eq(departments.isActive, query.isActive));

    return await db.query.departments.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: {
        manager: { columns: { id: true, firstName: true, lastName: true } },
        jobPositions: { columns: { id: true, title: true } },
        employees: { columns: { id: true } },
      },
      orderBy: [asc(departments.name)],
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    });
  }

  async findDepartmentById(id: string) {
    return await db.query.departments.findFirst({
      where: eq(departments.id, id),
      with: {
        manager: { columns: { id: true, firstName: true, lastName: true } },
        jobPositions: true,
        employees: { columns: { id: true, firstName: true, lastName: true, status: true } },
      },
    });
  }

  async findDepartmentByCode(code: string) {
    return await db.query.departments.findFirst({ where: eq(departments.code, code) });
  }

  async createDepartment(data: CreateDepartmentInput) {
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
    const [updated] = await db
      .update(departments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(departments.id, id))
      .returning();
    return updated;
  }

  async deleteDepartment(id: string) {
    const [deleted] = await db.delete(departments).where(eq(departments.id, id)).returning();
    return deleted;
  }

  // Job Positions
  async findJobPositions(query: ListQueryInput & { departmentId?: string }) {
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
      orderBy: [asc(jobPositions.title)],
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    });
  }

  async findJobPositionById(id: string) {
    return await db.query.jobPositions.findFirst({
      where: eq(jobPositions.id, id),
      with: { department: true, employees: { columns: { id: true, firstName: true, lastName: true } } },
    });
  }

  async findJobPositionByCode(code: string) {
    return await db.query.jobPositions.findFirst({ where: eq(jobPositions.code, code) });
  }

  async createJobPosition(data: CreateJobPositionInput) {
    const [created] = await db
      .insert(jobPositions)
      .values({ ...data, code: data.code.toUpperCase() })
      .returning();
    return created;
  }

  async updateJobPosition(id: string, data: UpdateJobPositionInput) {
    const [updated] = await db
      .update(jobPositions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(jobPositions.id, id))
      .returning();
    return updated;
  }

  async deleteJobPosition(id: string) {
    const [deleted] = await db.delete(jobPositions).where(eq(jobPositions.id, id)).returning();
    return deleted;
  }

  // Working Schedules
  async findWorkingSchedules(query: ListQueryInput) {
    const conditions = [];
    if (query.search) {
      conditions.push(or(ilike(workingSchedules.name, `%${query.search}%`), ilike(workingSchedules.code, `%${query.search}%`)));
    }
    if (query.isActive !== undefined) conditions.push(eq(workingSchedules.isActive, query.isActive));

    return await db.query.workingSchedules.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: { lines: true },
      orderBy: [asc(workingSchedules.name)],
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    });
  }

  async findWorkingScheduleById(id: string) {
    return await db.query.workingSchedules.findFirst({
      where: eq(workingSchedules.id, id),
      with: { lines: { orderBy: (l, { asc }) => [asc(l.dayOfWeek)] } },
    });
  }

  async findWorkingScheduleByCode(code: string) {
    return await db.query.workingSchedules.findFirst({ where: eq(workingSchedules.code, code) });
  }

  async createWorkingSchedule(data: typeof workingSchedules.$inferInsert) {
    const [created] = await db.insert(workingSchedules).values(data).returning();
    return created;
  }

  async createScheduleLines(lines: (typeof workingScheduleLines.$inferInsert)[]) {
    if (lines.length === 0) return [];
    return await db.insert(workingScheduleLines).values(lines).returning();
  }

  async updateWorkingSchedule(id: string, data: Partial<typeof workingSchedules.$inferInsert>) {
    const [updated] = await db.update(workingSchedules).set(data).where(eq(workingSchedules.id, id)).returning();
    return updated;
  }

  async deleteScheduleLines(scheduleId: string) {
    return await db.delete(workingScheduleLines).where(eq(workingScheduleLines.workingScheduleId, scheduleId)).returning();
  }

  async deleteWorkingSchedule(id: string) {
    const [deleted] = await db.delete(workingSchedules).where(eq(workingSchedules.id, id)).returning();
    return deleted;
  }
}

export const organizationRepository = new OrganizationRepository();
