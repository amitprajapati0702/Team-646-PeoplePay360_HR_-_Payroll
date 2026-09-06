import { timeOffRepository } from './time-off.repository.js';
import ApiError from '../../utils/Apierror.js';
import httpStatus from '../../utils/http-status.js';
import type {
  CreateLeaveTypeInput, UpdateLeaveTypeInput,
  CreateLeaveAllocationInput, ApproveAllocationInput,
  CreateLeaveRequestInput, ApproveRequestInput,
} from './time-off.schema.js';

export class TimeOffService {
  // ─── Leave Types ────────────────────────────────────────────────
  async listLeaveTypes(query: { search?: string; isActive?: boolean; page?: number; limit?: number }) {
    const limit = query.limit ?? 50;
    const offset = ((query.page ?? 1) - 1) * limit;
    return await timeOffRepository.findManyTypes(limit, offset);
  }

  async getLeaveTypeById(id: string) {
    const type = await timeOffRepository.findTypeById(id);
    if (!type) {
      throw new ApiError({ statuscode: httpStatus.NOT_FOUND, message: 'Leave type not found.', errorcode: 'LEAVE_TYPE_NOT_FOUND' });
    }
    return type;
  }

  async createLeaveType(data: CreateLeaveTypeInput) {
    const exists = await timeOffRepository.findTypeByCode(data.code.toUpperCase());
    if (exists) {
      throw new ApiError({ statuscode: httpStatus.CONFLICT, message: `Leave type code '${data.code}' already exists.`, errorcode: 'LEAVE_TYPE_CODE_EXISTS' });
    }
    return await timeOffRepository.createType(data);
  }

  async updateLeaveType(id: string, data: UpdateLeaveTypeInput) {
    const exists = await timeOffRepository.findTypeById(id);
    if (!exists) throw new ApiError({ statuscode: httpStatus.NOT_FOUND, message: 'Leave type not found.', errorcode: 'LEAVE_TYPE_NOT_FOUND' });
    return await timeOffRepository.updateType(id, data);
  }

  async deleteLeaveType(id: string) {
    const exists = await timeOffRepository.findTypeById(id);
    if (!exists) throw new ApiError({ statuscode: httpStatus.NOT_FOUND, message: 'Leave type not found.', errorcode: 'LEAVE_TYPE_NOT_FOUND' });
    return await timeOffRepository.deleteType(id);
  }

  // ─── Leave Allocations ──────────────────────────────────────────
  async listAllocations(query: { employeeId?: string; timeOffTypeId?: string; status?: string; page?: number; limit?: number }) {
    const limit = query.limit ?? 50;
    const offset = ((query.page ?? 1) - 1) * limit;
    return await timeOffRepository.findAllocations({ ...query, limit, offset });
  }

  async getAllocationById(id: string) {
    const alloc = await timeOffRepository.findAllocationById(id);
    if (!alloc) throw new ApiError({ statuscode: httpStatus.NOT_FOUND, message: 'Allocation not found.', errorcode: 'ALLOCATION_NOT_FOUND' });
    return alloc;
  }

  async createAllocation(data: CreateLeaveAllocationInput) {
    return await timeOffRepository.createAllocation(data);
  }

  async approveAllocation(id: string, data: ApproveAllocationInput, actingUserId: string) {
    const alloc = await timeOffRepository.findAllocationById(id);
    if (!alloc) throw new ApiError({ statuscode: httpStatus.NOT_FOUND, message: 'Allocation not found.', errorcode: 'ALLOCATION_NOT_FOUND' });

    const newStatus = data.action === 'APPROVE' ? 'APPROVED' : 'REFUSED';
    return await timeOffRepository.updateAllocation(id, {
      status: newStatus,
      approvedByUserId: actingUserId,
      approvedAt: data.action === 'APPROVE' ? new Date() : null,
      notes: data.notes ?? alloc.notes,
      updatedAt: new Date(),
    });
  }

  async deleteAllocation(id: string) {
    const alloc = await timeOffRepository.findAllocationById(id);
    if (!alloc) throw new ApiError({ statuscode: httpStatus.NOT_FOUND, message: 'Allocation not found.', errorcode: 'ALLOCATION_NOT_FOUND' });
    if (alloc.status === 'APPROVED') throw new ApiError({ statuscode: httpStatus.BAD_REQUEST, message: 'Cannot delete an approved allocation.', errorcode: 'ALLOCATION_IS_APPROVED' });
    return await timeOffRepository.deleteAllocation(id);
  }

  // ─── Leave Requests ─────────────────────────────────────────────
  async listRequests(query: { employeeId?: string; timeOffTypeId?: string; status?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number }) {
    const limit = query.limit ?? 50;
    const offset = ((query.page ?? 1) - 1) * limit;
    return await timeOffRepository.findRequests({ ...query, limit, offset });
  }

  async getRequestById(id: string) {
    const req = await timeOffRepository.findRequestById(id);
    if (!req) throw new ApiError({ statuscode: httpStatus.NOT_FOUND, message: 'Leave request not found.', errorcode: 'REQUEST_NOT_FOUND' });
    return req;
  }

  async createRequest(data: CreateLeaveRequestInput) {
    return await timeOffRepository.createRequest(data);
  }

  async approveRequest(id: string, data: ApproveRequestInput, actingUserId: string) {
    const request = await timeOffRepository.findRequestById(id);
    if (!request) throw new ApiError({ statuscode: httpStatus.NOT_FOUND, message: 'Leave request not found.', errorcode: 'REQUEST_NOT_FOUND' });

    if (request.status !== 'SUBMITTED') {
      throw new ApiError({ statuscode: httpStatus.BAD_REQUEST, message: `Cannot process a request in '${request.status}' status.`, errorcode: 'INVALID_STATUS' });
    }

    let newStatus: 'APPROVED' | 'REFUSED' | 'CANCELLED';
    if (data.action === 'APPROVE') newStatus = 'APPROVED';
    else if (data.action === 'REFUSE') newStatus = 'REFUSED';
    else newStatus = 'CANCELLED';

    const updated = await timeOffRepository.updateRequest(id, {
      status: newStatus,
      approvedByUserId: actingUserId,
      approvedAt: newStatus === 'APPROVED' ? new Date() : null,
      refusalReason: data.refusalReason ?? null,
      updatedAt: new Date(),
    });

    // If approved and has allocation, deduct taken units
    if (newStatus === 'APPROVED' && request.timeOffAllocationId) {
      await timeOffRepository.deductTakenUnits(request.timeOffAllocationId, request.requestedUnits);
    }

    return updated;
  }

  async rejectRequest(id: string, reason?: string, actingUserId?: string) {
    return await this.approveRequest(id, { action: 'REFUSE', refusalReason: reason }, actingUserId || '');
  }

  async deleteRequest(id: string) {
    const request = await timeOffRepository.findRequestById(id);
    if (!request) throw new ApiError({ statuscode: httpStatus.NOT_FOUND, message: 'Leave request not found.', errorcode: 'REQUEST_NOT_FOUND' });
    if (request.status === 'APPROVED') throw new ApiError({ statuscode: httpStatus.BAD_REQUEST, message: 'Cannot delete an approved leave request.', errorcode: 'REQUEST_IS_APPROVED' });
    return await timeOffRepository.deleteRequest(id);
  }

  /**
   * Count approved leave days for an employee in a period — used by payrun engine
   */
  async getApprovedLeaveDays(employeeId: string, periodStart: string, periodEnd: string): Promise<number> {
    const requests = await timeOffRepository.findApprovedRequestsInRange(employeeId, periodStart, periodEnd);
    return requests.reduce((sum, r) => sum + parseFloat(r.requestedUnits), 0);
  }
}

export const timeOffService = new TimeOffService();
