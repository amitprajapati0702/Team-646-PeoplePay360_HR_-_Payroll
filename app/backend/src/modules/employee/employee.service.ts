import ApiError from '../../utils/Apierror.js';
import httpStatus from '../../utils/http-status.js';
import { ErrorCodes } from '../../utils/error-codes.js';
import { employeeRepository, EmployeeRepository } from './employee.repository.js';
import { db } from '../../infrastructure/database/client.js';
import { departments, jobPositions, workingSchedules, employees, } from '../../infrastructure/database/schema/index.js';
import { eq } from 'drizzle-orm';
import type {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  QueryEmployeesInput,
  KanbanQueryInput,
  UpdateEmployeeStatusInput,
} from './employee.schema.js';
import type { EmployeeSmartView, KanbanGroupItem } from './employee.types.js';

export class EmployeeService {
  constructor(private readonly repo: EmployeeRepository = employeeRepository) { }

  async listEmployees(filters: QueryEmployeesInput) {
    return await this.repo.findMany(filters);
  }

  async getEmployeeById(id: string): Promise<EmployeeSmartView> {
    const employee = await this.repo.findById(id);

    if (!employee) {
      throw new ApiError({
        statuscode: httpStatus.NOT_FOUND,
        message: `Employee with ID ${id} was not found.`,
        errorcode: ErrorCodes.USER_NOT_FOUND,
      });
    }

    const smartBadges = await this.repo.getSmartBadges(id);

    const hasCompleteBankDetails = Boolean(
      employee.bankName &&
      employee.bankAccountNumber &&
      employee.bankRoutingOrIfsc &&
      employee.bankAccountHolderName
    );

    return {
      id: employee.id,
      userId: employee.userId,
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      fullName: `${employee.firstName} ${employee.lastName}`,
      workEmail: employee.workEmail,
      personalEmail: employee.personalEmail,
      phone: employee.phone,
      gender: employee.gender,
      dateOfBirth: employee.dateOfBirth,
      joiningDate: employee.joiningDate,
      exitDate: employee.exitDate,
      employmentType: employee.employmentType,
      status: employee.status,
      avatarUrl: employee.avatarUrl,
      department: employee.department || null,
      jobPosition: employee.jobPosition || null,
      manager: employee.manager || null,
      workingSchedule: employee.workingSchedule || null,
      bankDetails: {
        bankName: employee.bankName,
        bankAccountNumber: employee.bankAccountNumber,
        bankRoutingOrIfsc: employee.bankRoutingOrIfsc,
        bankAccountHolderName: employee.bankAccountHolderName,
        hasCompleteBankDetails,
      },
      smartBadges,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    };
  }

  async getKanbanData(options: KanbanQueryInput): Promise<KanbanGroupItem[]> {
    return await this.repo.getKanbanData(options);
  }

  async getReportingTree(id: string) {
    const employee = await this.repo.findById(id);
    if (!employee) {
      throw new ApiError({
        statuscode: httpStatus.NOT_FOUND,
        message: `Employee with ID ${id} not found.`,
        errorcode: ErrorCodes.USER_NOT_FOUND,
      });
    }
    return await this.repo.getReportingTree(id);
  }

  async createEmployee(data: CreateEmployeeInput, actingUserId?: string) {
    // 1. Check duplicate work email
    const existingEmail = await this.repo.findByEmail(data.workEmail);
    if (existingEmail) {
      throw new ApiError({
        statuscode: httpStatus.CONFLICT,
        message: `An employee with work email '${data.workEmail}' already exists.`,
        errorcode: ErrorCodes.EMAIL_ALREADY_EXISTS,
      });
    }

    // 2. Check duplicate employee code
    const existingCode = await this.repo.findByCode(data.employeeCode);
    if (existingCode) {
      throw new ApiError({
        statuscode: httpStatus.CONFLICT,
        message: `An employee with code '${data.employeeCode}' already exists.`,
        errorcode: 'EMPLOYEE_CODE_EXISTS',
      });
    }

    // 3. Validate organizational foreign entities exist
    await this.validateOrganizationalUnits(
      data.departmentId,
      data.jobPositionId,
      data.workingScheduleId,
      data.managerId
    );

    return await this.repo.create(data, actingUserId);
  }

  async updateEmployee(id: string, data: UpdateEmployeeInput, actingUserId?: string) {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new ApiError({
        statuscode: httpStatus.NOT_FOUND,
        message: `Employee with ID ${id} not found.`,
        errorcode: ErrorCodes.USER_NOT_FOUND,
      });
    }

    // 1. Email collision check if email changing
    if (data.workEmail && data.workEmail.toLowerCase() !== existing.workEmail.toLowerCase()) {
      const emailConflict = await this.repo.findByEmail(data.workEmail);
      if (emailConflict && emailConflict.id !== id) {
        throw new ApiError({
          statuscode: httpStatus.CONFLICT,
          message: `Work email '${data.workEmail}' is already in use by another employee.`,
          errorcode: ErrorCodes.EMAIL_ALREADY_EXISTS,
        });
      }
    }

    // 2. Code collision check if code changing
    if (data.employeeCode && data.employeeCode.toUpperCase() !== existing.employeeCode.toUpperCase()) {
      const codeConflict = await this.repo.findByCode(data.employeeCode);
      if (codeConflict && codeConflict.id !== id) {
        throw new ApiError({
          statuscode: httpStatus.CONFLICT,
          message: `Employee code '${data.employeeCode}' is already in use by another employee.`,
          errorcode: 'EMPLOYEE_CODE_EXISTS',
        });
      }
    }

    // 3. Prevent circular hierarchy if manager changed
    if (data.managerId !== undefined && data.managerId !== existing.managerId) {
      if (data.managerId) {
        await this.validateManagerHierarchy(id, data.managerId);
      }
    }

    // 4. Validate foreign keys if changed
    await this.validateOrganizationalUnits(
      data.departmentId || existing.departmentId,
      data.jobPositionId || existing.jobPositionId,
      data.workingScheduleId || existing.workingScheduleId,
      data.managerId !== undefined ? data.managerId : existing.managerId
    );

    const updated = await this.repo.update(id, data, actingUserId);
    return updated;
  }

  async updateEmployeeStatus(
    id: string,
    data: UpdateEmployeeStatusInput,
    actingUserId?: string
  ) {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new ApiError({
        statuscode: httpStatus.NOT_FOUND,
        message: `Employee with ID ${id} not found.`,
        errorcode: ErrorCodes.USER_NOT_FOUND,
      });
    }

    if (data.status === 'TERMINATED' && !data.exitDate && !existing.exitDate) {
      data.exitDate = new Date().toISOString().split('T')[0];
    }

    const updated = await this.repo.updateStatus(
      id,
      data.status,
      data.exitDate,
      actingUserId
    );
    return updated;
  }

  async deleteEmployee(id: string, actingUserId?: string) {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new ApiError({
        statuscode: httpStatus.NOT_FOUND,
        message: `Employee with ID ${id} not found.`,
        errorcode: ErrorCodes.USER_NOT_FOUND,
      });
    }

    // Check if employee has active direct subordinates
    const directReports = await db.query.employees.findFirst({
      where: eq(employees.managerId, id),
    });

    if (directReports) {
      throw new ApiError({
        statuscode: httpStatus.BAD_REQUEST,
        message:
          'Cannot delete employee who is assigned as a manager to other employees. Please reassign subordinates first.',
        errorcode: 'HAS_DIRECT_REPORTS',
      });
    }

    return await this.repo.delete(id, actingUserId);
  }

  private async validateOrganizationalUnits(
    departmentId?: string,
    jobPositionId?: string,
    workingScheduleId?: string,
    managerId?: string | null
  ) {
    if (departmentId) {
      const dept = await db.query.departments.findFirst({
        where: eq(departments.id, departmentId),
      });
      if (!dept) {
        throw new ApiError({
          statuscode: httpStatus.BAD_REQUEST,
          message: 'Selected department does not exist.',
          errorcode: 'INVALID_DEPARTMENT',
        });
      }
    }

    if (jobPositionId) {
      const pos = await db.query.jobPositions.findFirst({
        where: eq(jobPositions.id, jobPositionId),
      });
      if (!pos) {
        throw new ApiError({
          statuscode: httpStatus.BAD_REQUEST,
          message: 'Selected job position does not exist.',
          errorcode: 'INVALID_JOB_POSITION',
        });
      }
    }

    if (workingScheduleId) {
      const sched = await db.query.workingSchedules.findFirst({
        where: eq(workingSchedules.id, workingScheduleId),
      });
      if (!sched) {
        throw new ApiError({
          statuscode: httpStatus.BAD_REQUEST,
          message: 'Selected working schedule does not exist.',
          errorcode: 'INVALID_WORKING_SCHEDULE',
        });
      }
    }

    if (managerId) {
      const mgr = await db.query.employees.findFirst({
        where: eq(employees.id, managerId),
      });
      if (!mgr) {
        throw new ApiError({
          statuscode: httpStatus.BAD_REQUEST,
          message: 'Assigned manager does not exist.',
          errorcode: 'INVALID_MANAGER',
        });
      }
    }
  }

  private async validateManagerHierarchy(
    employeeId: string,
    targetManagerId: string
  ): Promise<void> {
    if (employeeId === targetManagerId) {
      throw new ApiError({
        statuscode: httpStatus.BAD_REQUEST,
        message: 'An employee cannot be assigned as their own manager.',
        errorcode: 'CIRCULAR_HIERARCHY',
      });
    }

    let currentManagerId: string | null = targetManagerId;
    const visited = new Set<string>();

    while (currentManagerId) {
      if (visited.has(currentManagerId)) {
        break;
      }
      visited.add(currentManagerId);

      const managerRecord: { managerId: string | null } | undefined =
        await db.query.employees.findFirst({
          where: eq(employees.id, currentManagerId),
          columns: { managerId: true },
        });

      if (!managerRecord) break;

      if (managerRecord.managerId === employeeId) {
        throw new ApiError({
          statuscode: httpStatus.BAD_REQUEST,
          message:
            'Circular reporting hierarchy detected: the assigned manager is already managed by this employee.',
          errorcode: 'CIRCULAR_HIERARCHY',
        });
      }

      currentManagerId = managerRecord.managerId;
    }
  }
}

export const employeeService = new EmployeeService();
