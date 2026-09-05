import { db } from '../../infrastructure/database/client.js';
import { contracts } from '../../infrastructure/database/schema/index.js';
import { eq, and } from 'drizzle-orm';
import ApiError from '../../utils/Apierror.js';
import httpStatus from '../../utils/http-status.js';
import type { CreateContractInput, UpdateContractInput, ContractQueryInput } from './contracts.schema.js';

export class ContractsService {
  async listContracts(query: ContractQueryInput) {
    const conditions = [];
    if (query.employeeId) conditions.push(eq(contracts.employeeId, query.employeeId));
    if (query.status) conditions.push(eq(contracts.status, query.status));

    return await db.query.contracts.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: {
        employee: { columns: { id: true, firstName: true, lastName: true, employeeCode: true } },
        department: { columns: { id: true, name: true } },
        jobPosition: { columns: { id: true, title: true } },
        salaryStructure: { columns: { id: true, name: true, code: true } },
        workingSchedule: { columns: { id: true, name: true } },
      },
      orderBy: (c, { desc }) => [desc(c.startDate)],
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    });
  }

  async getContractById(id: string) {
    const contract = await db.query.contracts.findFirst({
      where: eq(contracts.id, id),
      with: {
        employee: { columns: { id: true, firstName: true, lastName: true, employeeCode: true, avatarUrl: true } },
        department: true,
        jobPosition: true,
        salaryStructure: { with: { structureRules: { with: { salaryRule: { with: { category: true } } } } } },
        workingSchedule: { with: { lines: true } },
      },
    });

    if (!contract) {
      throw new ApiError({
        statuscode: httpStatus.NOT_FOUND,
        message: 'Contract not found.',
        errorcode: 'CONTRACT_NOT_FOUND',
      });
    }
    return contract;
  }

  async createContract(data: CreateContractInput) {
    // Check duplicate reference
    const existing = await db.query.contracts.findFirst({
      where: eq(contracts.contractReference, data.contractReference),
    });
    if (existing) {
      throw new ApiError({
        statuscode: httpStatus.CONFLICT,
        message: `Contract reference '${data.contractReference}' already exists.`,
        errorcode: 'CONTRACT_REF_EXISTS',
      });
    }

    const [created] = await db
      .insert(contracts)
      .values({
        contractReference: data.contractReference,
        employeeId: data.employeeId,
        departmentId: data.departmentId,
        jobPositionId: data.jobPositionId,
        salaryStructureId: data.salaryStructureId,
        workingScheduleId: data.workingScheduleId,
        startDate: data.startDate,
        endDate: data.endDate ?? null,
        wage: String(data.wage),
        status: data.status ?? 'DRAFT',
        notes: data.notes ?? null,
      })
      .returning();

    return created;
  }

  async updateContract(id: string, data: UpdateContractInput) {
    const existing = await db.query.contracts.findFirst({ where: eq(contracts.id, id) });
    if (!existing) {
      throw new ApiError({
        statuscode: httpStatus.NOT_FOUND,
        message: 'Contract not found.',
        errorcode: 'CONTRACT_NOT_FOUND',
      });
    }

    const updatePayload: Record<string, unknown> = { updatedAt: new Date() };
    if (data.contractReference !== undefined) updatePayload.contractReference = data.contractReference;
    if (data.departmentId !== undefined) updatePayload.departmentId = data.departmentId;
    if (data.jobPositionId !== undefined) updatePayload.jobPositionId = data.jobPositionId;
    if (data.salaryStructureId !== undefined) updatePayload.salaryStructureId = data.salaryStructureId;
    if (data.workingScheduleId !== undefined) updatePayload.workingScheduleId = data.workingScheduleId;
    if (data.startDate !== undefined) updatePayload.startDate = data.startDate;
    if (data.endDate !== undefined) updatePayload.endDate = data.endDate;
    if (data.wage !== undefined) updatePayload.wage = String(data.wage);
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.notes !== undefined) updatePayload.notes = data.notes;

    const [updated] = await db
      .update(contracts)
      .set(updatePayload)
      .where(eq(contracts.id, id))
      .returning();

    return updated;
  }

  async deleteContract(id: string) {
    const existing = await db.query.contracts.findFirst({ where: eq(contracts.id, id) });
    if (!existing) {
      throw new ApiError({
        statuscode: httpStatus.NOT_FOUND,
        message: 'Contract not found.',
        errorcode: 'CONTRACT_NOT_FOUND',
      });
    }

    if (existing.status === 'ACTIVE') {
      throw new ApiError({
        statuscode: httpStatus.BAD_REQUEST,
        message: 'Cannot delete an active contract. Please terminate it first.',
        errorcode: 'CONTRACT_IS_ACTIVE',
      });
    }

    const [deleted] = await db.delete(contracts).where(eq(contracts.id, id)).returning();
    return deleted;
  }

  /**
   * Find the active contract for an employee within a given payroll period.
   * Used by the payrun computation engine.
   */
  async findActiveContractForPeriod(employeeId: string, periodStart: string, periodEnd: string) {
    const allContracts = await db.query.contracts.findMany({
      where: and(eq(contracts.employeeId, employeeId), eq(contracts.status, 'ACTIVE')),
      with: {
        salaryStructure: {
          with: {
            structureRules: {
              with: { salaryRule: { with: { category: true } } },
              orderBy: (sr, { asc }) => [asc(sr.sequenceOverride)],
            },
          },
        },
        workingSchedule: { with: { lines: true } },
      },
      orderBy: (c, { desc }) => [desc(c.startDate)],
    });

    // Find the contract that overlaps the pay period
    const active = allContracts.find((c) => {
      const contractStart = c.startDate;
      const contractEnd = c.endDate;
      if (contractEnd) {
        return contractStart <= periodEnd && contractEnd >= periodStart;
      }
      return contractStart <= periodEnd;
    });

    return active ?? null;
  }
}

export const contractsService = new ContractsService();
