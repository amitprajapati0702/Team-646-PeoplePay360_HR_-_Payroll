import { contractsRepository } from './contracts.repository.js';
import { db } from '../../infrastructure/database/client.js';
import { employees, salaryStructures } from '../../infrastructure/database/schema/index.js';
import { eq } from 'drizzle-orm';
import ApiError from '../../utils/Apierror.js';
import httpStatus from '../../utils/http-status.js';
import type { CreateContractInput, UpdateContractInput, ContractQueryInput } from './contracts.schema.js';

export class ContractsService {
  async listContracts(query: ContractQueryInput) {
    return await contractsRepository.findMany(query);
  }

  async getContractById(id: string) {
    const contract = await contractsRepository.findById(id);
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
    const emp = await db.query.employees.findFirst({
      where: eq(employees.id, data.employeeId),
    });

    if (!emp) {
      throw new ApiError({
        statuscode: httpStatus.NOT_FOUND,
        message: 'Employee not found for contract creation.',
        errorcode: 'EMPLOYEE_NOT_FOUND',
      });
    }

    const departmentId = data.departmentId || emp.departmentId;
    const jobPositionId = data.jobPositionId || emp.jobPositionId;
    const workingScheduleId = data.workingScheduleId || data.scheduleId || emp.workingScheduleId;

    let salaryStructureId = data.salaryStructureId || data.structureId;
    if (!salaryStructureId) {
      const defaultStruct = await db.query.salaryStructures.findFirst({
        where: eq(salaryStructures.isActive, true),
      });
      if (defaultStruct) salaryStructureId = defaultStruct.id;
    }

    if (!departmentId || !jobPositionId || !salaryStructureId || !workingScheduleId) {
      throw new ApiError({
        statuscode: httpStatus.BAD_REQUEST,
        message: 'Department, job position, salary structure, and working schedule are required for employment contracts.',
        errorcode: 'MISSING_CONTRACT_RELATIONS',
      });
    }

    const ref =
      data.contractReference?.trim() ||
      `CTR-${emp.employeeCode || 'EMP'}-${Date.now().toString().slice(-4)}`;

    const existing = await contractsRepository.findByReference(ref);
    if (existing) {
      throw new ApiError({
        statuscode: httpStatus.CONFLICT,
        message: `Contract reference '${ref}' already exists.`,
        errorcode: 'CONTRACT_REF_EXISTS',
      });
    }

    return await contractsRepository.create({
      contractReference: ref,
      employeeId: data.employeeId,
      departmentId,
      jobPositionId,
      salaryStructureId,
      workingScheduleId,
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      wage: String(data.wage),
      status: data.status ?? 'ACTIVE',
      notes: data.notes ?? data.terms ?? null,
    });
  }

  async updateContract(id: string, data: UpdateContractInput) {
    const existing = await contractsRepository.findById(id);
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

    return await contractsRepository.update(id, updatePayload);
  }

  async deleteContract(id: string) {
    const existing = await contractsRepository.findById(id);
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

    return await contractsRepository.delete(id);
  }

  /**
   * Find the active contract for an employee within a given payroll period.
   * Used by the payrun computation engine.
   */
  async findActiveContractForPeriod(employeeId: string, periodStart: string, periodEnd: string) {
    const allContracts = await contractsRepository.findActiveByEmployee(employeeId);

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
