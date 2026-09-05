import { db } from '../../infrastructure/database/client.js';
import {
  timeOffTypes,
  timeOffAllocations,
  timeOffRequests,
} from '../../infrastructure/database/schema/index.js';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import ApiError from '../../utils/Apierror.js';
import httpStatus from '../../utils/http-status.js';
import type {
  CreateLeaveTypeInput, UpdateLeaveTypeInput,
  CreateLeaveAllocationInput, UpdateLeaveAllocationInput, ApproveAllocationInput,
  CreateLeaveRequestInput, UpdateLeaveRequestInput, ApproveRequestInput,
} from './time-off.schema.js';

export class TimeOffService {
  // ─── Leave Types ────────────────────────────────────────────────
  async listLeaveTypes(query: { search?: string; isActive?: boolean; page?: number; limit?: number }) {
    return await db.query.timeOffTypes.findMany({
      orderBy: (t, { asc }) => [asc(t.name)],
      limit: query.limit ?? 50,
      offset: ((query.page ?? 1) - 1) * (query.limit ?? 50),
    });
  }

  async getLeaveTypeById(id: string) {
    const type = await db.query.timeOffTypes.findFirst({ where: eq(timeOffTypes.id, id) });
    if (!type) {
      throw new ApiError({ statuscode: httpStatus.NOT_FOUND, message: 'Leave type not found.', errorcode: 'LEAVE_TYPE_NOT_FOUND' });
    }
    return type;
  }

  async createLeaveType(data: CreateLeaveTypeInput) {
    const exists = await db.query.timeOffTypes.findFirst({ where: eq(timeOffTypes.code, data.code.toUpperCase()) });
    if (exists) {
      throw new ApiError({ statuscode: httpStatus.CONFLICT, message: `Leave type code '${data.code}' already exists.`, errorcode: 'LEAVE_TYPE_CODE_EXISTS' });
    }
    const [created] = await db.insert(timeOffTypes).values({ ...data, code: data.code.toUpperCase() }).returning();
    return created;
  }

  async updateLeaveType(id: string, data: UpdateLeaveTypeInput) {
    const exists = await db.query.timeOffTypes.findFirst({ where: eq(timeOffTypes.id, id) });
    if (!exists) throw new ApiError({ statuscode: httpStatus.NOT_FOUND, message: 'Leave type not found.', errorcode: 'LEAVE_TYPE_NOT_FOUND' });
    const [updated] = await db.update(timeOffTypes).set({ ...data, updatedAt: new Date() }).where(eq(timeOffTypes.id, id)).returning();
    return updated;
  }

  async deleteLeaveType(id: string) {
    const exists = await db.query.timeOffTypes.findFirst({ where: eq(timeOffTypes.id, id) });
    if (!exists) throw new ApiError({ statuscode: httpStatus.NOT_FOUND, message: 'Leave type not found.', errorcode: 'LEAVE_TYPE_NOT_FOUND' });
    const [deleted] = await db.delete(timeOffTypes).where(eq(timeOffTypes.id, id)).returning();
    return deleted;
  }

  // ─── Leave Allocations ──────────────────────────────────────────
  async listAllocations(query: { employeeId?: string; timeOffTypeId?: string; status?: string; page?: number; limit?: number }) {
    const conditions = [];
    if (query.employeeId) conditions.push(eq(timeOffAllocations.employeeId, query.employeeId));
    if (query.timeOffTypeId) conditions.push(eq(timeOffAllocations.timeOffTypeId, query.timeOffTypeId));
    if (query.status) conditions.push(eq(timeOffAllocations.status, query.status as any));

    return await db.query.timeOffAllocations.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: {
        employee: { columns: { id: true, firstName: true, lastName: true, employeeCode: true } },
        timeOffType: { columns: { id: true, name: true, code: true, unit: true } },
      },
      orderBy: (a, { desc }) => [desc(a.validityStart)],
      limit: query.limit ?? 50,
      offset: ((query.page ?? 1) - 1) * (query.limit ?? 50),
    });
  }

  async getAllocationById(id: string) {
    const alloc = await db.query.timeOffAllocations.findFirst({
      where: eq(timeOffAllocations.id, id),
      with: {
        employee: { columns: { id: true, firstName: true, lastName: true } },
        timeOffType: true,
      },
    });
    if (!alloc) throw new ApiError({ statuscode: httpStatus.NOT_FOUND, message: 'Allocation not found.', errorcode: 'ALLOCATION_NOT_FOUND' });
    return alloc;
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

  async approveAllocation(id: string, data: ApproveAllocationInput, actingUserId: string) {
    const alloc = await db.query.timeOffAllocations.findFirst({ where: eq(timeOffAllocations.id, id) });
    if (!alloc) throw new ApiError({ statuscode: httpStatus.NOT_FOUND, message: 'Allocation not found.', errorcode: 'ALLOCATION_NOT_FOUND' });

    const newStatus = data.action === 'APPROVE' ? 'APPROVED' : 'REFUSED';
    const [updated] = await db.update(timeOffAllocations).set({
      status: newStatus,
      approvedByUserId: actingUserId,
      approvedAt: data.action === 'APPROVE' ? new Date() : null,
      notes: data.notes ?? alloc.notes,
      updatedAt: new Date(),
    }).where(eq(timeOffAllocations.id, id)).returning();

    return updated;
  }

  async deleteAllocation(id: string) {
    const alloc = await db.query.timeOffAllocations.findFirst({ where: eq(timeOffAllocations.id, id) });
    if (!alloc) throw new ApiError({ statuscode: httpStatus.NOT_FOUND, message: 'Allocation not found.', errorcode: 'ALLOCATION_NOT_FOUND' });
    if (alloc.status === 'APPROVED') throw new ApiError({ statuscode: httpStatus.BAD_REQUEST, message: 'Cannot delete an approved allocation.', errorcode: 'ALLOCATION_IS_APPROVED' });
    const [deleted] = await db.delete(timeOffAllocations).where(eq(timeOffAllocations.id, id)).returning();
    return deleted;
  }

  // ─── Leave Requests ─────────────────────────────────────────────
  async listRequests(query: { employeeId?: string; timeOffTypeId?: string; status?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number }) {
    const conditions = [];
    if (query.employeeId) conditions.push(eq(timeOffRequests.employeeId, query.employeeId));
    if (query.timeOffTypeId) conditions.push(eq(timeOffRequests.timeOffTypeId, query.timeOffTypeId));
    if (query.status) conditions.push(eq(timeOffRequests.status, query.status as any));
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
      orderBy: (r, { desc }) => [desc(r.createdAt)],
      limit: query.limit ?? 50,
      offset: ((query.page ?? 1) - 1) * (query.limit ?? 50),
    });
  }

  async getRequestById(id: string) {
    const req = await db.query.timeOffRequests.findFirst({
      where: eq(timeOffRequests.id, id),
      with: {
        employee: true,
        timeOffType: true,
        allocation: true,
        approvedByUser: { columns: { id: true, email: true } },
      },
    });
    if (!req) throw new ApiError({ statuscode: httpStatus.NOT_FOUND, message: 'Leave request not found.', errorcode: 'REQUEST_NOT_FOUND' });
    return req;
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

  async approveRequest(id: string, data: ApproveRequestInput, actingUserId: string) {
    const request = await db.query.timeOffRequests.findFirst({ where: eq(timeOffRequests.id, id) });
    if (!request) throw new ApiError({ statuscode: httpStatus.NOT_FOUND, message: 'Leave request not found.', errorcode: 'REQUEST_NOT_FOUND' });

    if (request.status !== 'SUBMITTED') {
      throw new ApiError({ statuscode: httpStatus.BAD_REQUEST, message: `Cannot process a request in '${request.status}' status.`, errorcode: 'INVALID_STATUS' });
    }

    let newStatus: 'APPROVED' | 'REFUSED' | 'CANCELLED';
    if (data.action === 'APPROVE') newStatus = 'APPROVED';
    else if (data.action === 'REFUSE') newStatus = 'REFUSED';
    else newStatus = 'CANCELLED';

    const [updated] = await db.update(timeOffRequests).set({
      status: newStatus,
      approvedByUserId: actingUserId,
      approvedAt: newStatus === 'APPROVED' ? new Date() : null,
      refusalReason: data.refusalReason ?? null,
      updatedAt: new Date(),
    }).where(eq(timeOffRequests.id, id)).returning();

    // If approved and has allocation, deduct taken units
    if (newStatus === 'APPROVED' && request.timeOffAllocationId) {
      await db.update(timeOffAllocations)
        .set({
          takenUnits: sql`taken_units + ${request.requestedUnits}`,
          updatedAt: new Date(),
        })
        .where(eq(timeOffAllocations.id, request.timeOffAllocationId));
    }

    return updated;
  }

  async deleteRequest(id: string) {
    const request = await db.query.timeOffRequests.findFirst({ where: eq(timeOffRequests.id, id) });
    if (!request) throw new ApiError({ statuscode: httpStatus.NOT_FOUND, message: 'Leave request not found.', errorcode: 'REQUEST_NOT_FOUND' });
    if (request.status === 'APPROVED') throw new ApiError({ statuscode: httpStatus.BAD_REQUEST, message: 'Cannot delete an approved leave request.', errorcode: 'REQUEST_IS_APPROVED' });
    const [deleted] = await db.delete(timeOffRequests).where(eq(timeOffRequests.id, id)).returning();
    return deleted;
  }

  /**
   * Count approved leave days for an employee in a period — used by payrun engine
   */
  async getApprovedLeaveDays(employeeId: string, periodStart: string, periodEnd: string): Promise<number> {
    const requests = await db.query.timeOffRequests.findMany({
      where: and(
        eq(timeOffRequests.employeeId, employeeId),
        eq(timeOffRequests.status, 'APPROVED'),
        gte(timeOffRequests.startDate, periodStart),
        lte(timeOffRequests.endDate, periodEnd)
      ),
      columns: { requestedUnits: true },
    });

    return requests.reduce((sum, r) => sum + parseFloat(r.requestedUnits), 0);
  }
}

export const timeOffService = new TimeOffService();
