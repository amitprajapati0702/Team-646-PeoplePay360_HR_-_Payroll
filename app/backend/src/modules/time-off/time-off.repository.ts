import { db } from '../../infrastructure/database/client.js';
import {
  timeOffTypes,
  timeOffAllocations,
  timeOffRequests,
} from '../../infrastructure/database/schema/index.js';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import type {
  CreateLeaveTypeInput,
  UpdateLeaveTypeInput,
  CreateLeaveAllocationInput,
  CreateLeaveRequestInput,
} from './time-off.schema.js';

export class TimeOffRepository {
  // Types
  async findManyTypes(limit = 50, offset = 0) {
    return await db.query.timeOffTypes.findMany({
      orderBy: (t, { asc }) => [asc(t.name)],
      limit,
      offset,
    });
  }

  async findTypeById(id: string) {
    return await db.query.timeOffTypes.findFirst({ where: eq(timeOffTypes.id, id) });
  }

  async findTypeByCode(code: string) {
    return await db.query.timeOffTypes.findFirst({ where: eq(timeOffTypes.code, code) });
  }

  async createType(data: CreateLeaveTypeInput) {
    const [created] = await db.insert(timeOffTypes).values({ ...data, code: data.code.toUpperCase() }).returning();
    return created;
  }

  async updateType(id: string, data: UpdateLeaveTypeInput) {
    const [updated] = await db.update(timeOffTypes).set({ ...data, updatedAt: new Date() }).where(eq(timeOffTypes.id, id)).returning();
    return updated;
  }

  async deleteType(id: string) {
    const [deleted] = await db.delete(timeOffTypes).where(eq(timeOffTypes.id, id)).returning();
    return deleted;
  }

  // Allocations
  async findAllocations(query: { employeeId?: string; timeOffTypeId?: string; status?: any; limit?: number; offset?: number }) {
    const conditions = [];
    if (query.employeeId) conditions.push(eq(timeOffAllocations.employeeId, query.employeeId));
    if (query.timeOffTypeId) conditions.push(eq(timeOffAllocations.timeOffTypeId, query.timeOffTypeId));
    if (query.status) conditions.push(eq(timeOffAllocations.status, query.status));

    return await db.query.timeOffAllocations.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: {
        employee: { columns: { id: true, firstName: true, lastName: true, employeeCode: true } },
        timeOffType: { columns: { id: true, name: true, code: true, unit: true } },
      },
      orderBy: [desc(timeOffAllocations.validityStart)],
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
    });
  }

  async findAllocationById(id: string) {
    return await db.query.timeOffAllocations.findFirst({
      where: eq(timeOffAllocations.id, id),
      with: {
        employee: { columns: { id: true, firstName: true, lastName: true } },
        timeOffType: true,
      },
    });
  }

  async createAllocation(data: CreateLeaveAllocationInput) {
    const [created] = await db.insert(timeOffAllocations).values({
      employeeId: data.employeeId,
      timeOffTypeId: data.timeOffTypeId,
      allocatedUnits: String(data.allocatedUnits),
      takenUnits: '0.00',
      validityStart: data.validityStart,
      validityEnd: data.validityEnd,
      status: 'DRAFT',
      notes: data.notes ?? null,
    }).returning();
    return created;
  }

  async updateAllocation(id: string, data: Partial<typeof timeOffAllocations.$inferInsert>) {
    const [updated] = await db.update(timeOffAllocations).set(data).where(eq(timeOffAllocations.id, id)).returning();
    return updated;
  }

  async deleteAllocation(id: string) {
    const [deleted] = await db.delete(timeOffAllocations).where(eq(timeOffAllocations.id, id)).returning();
    return deleted;
  }

  async deductTakenUnits(allocationId: string, units: string) {
    return await db.update(timeOffAllocations)
      .set({
        takenUnits: sql`taken_units + ${units}`,
        updatedAt: new Date(),
      })
      .where(eq(timeOffAllocations.id, allocationId))
      .returning();
  }

  // Requests
  async findRequests(query: { employeeId?: string; timeOffTypeId?: string; status?: any; dateFrom?: string; dateTo?: string; limit?: number; offset?: number }) {
    const conditions = [];
    if (query.employeeId) conditions.push(eq(timeOffRequests.employeeId, query.employeeId));
    if (query.timeOffTypeId) conditions.push(eq(timeOffRequests.timeOffTypeId, query.timeOffTypeId));
    if (query.status) conditions.push(eq(timeOffRequests.status, query.status));
    if (query.dateFrom) conditions.push(gte(timeOffRequests.startDate, query.dateFrom));
    if (query.dateTo) conditions.push(lte(timeOffRequests.endDate, query.dateTo));

    return await db.query.timeOffRequests.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: {
        employee: { columns: { id: true, firstName: true, lastName: true, employeeCode: true, avatarUrl: true } },
        timeOffType: { columns: { id: true, name: true, code: true, colorCode: true } },
        allocation: { columns: { id: true, allocatedUnits: true, takenUnits: true } },
        approvedByUser: { columns: { id: true, email: true } },
      },
      orderBy: [desc(timeOffRequests.createdAt)],
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
    });
  }

  async findRequestById(id: string) {
    return await db.query.timeOffRequests.findFirst({
      where: eq(timeOffRequests.id, id),
      with: {
        employee: true,
        timeOffType: true,
        allocation: true,
        approvedByUser: { columns: { id: true, email: true } },
      },
    });
  }

  async createRequest(data: CreateLeaveRequestInput) {
    const [created] = await db.insert(timeOffRequests).values({
      employeeId: data.employeeId,
      timeOffTypeId: data.timeOffTypeId,
      timeOffAllocationId: data.timeOffAllocationId ?? null,
      startDate: data.startDate,
      endDate: data.endDate,
      requestedUnits: String(data.requestedUnits),
      status: 'SUBMITTED',
      reason: data.reason ?? null,
    }).returning();
    return created;
  }

  async updateRequest(id: string, data: Partial<typeof timeOffRequests.$inferInsert>) {
    const [updated] = await db.update(timeOffRequests).set(data).where(eq(timeOffRequests.id, id)).returning();
    return updated;
  }

  async deleteRequest(id: string) {
    const [deleted] = await db.delete(timeOffRequests).where(eq(timeOffRequests.id, id)).returning();
    return deleted;
  }

  async findApprovedRequestsInRange(employeeId: string, periodStart: string, periodEnd: string) {
    return await db.query.timeOffRequests.findMany({
      where: and(
        eq(timeOffRequests.employeeId, employeeId),
        eq(timeOffRequests.status, 'APPROVED'),
        gte(timeOffRequests.startDate, periodStart),
        lte(timeOffRequests.endDate, periodEnd)
      ),
      columns: { requestedUnits: true },
    });
  }
}

export const timeOffRepository = new TimeOffRepository();
