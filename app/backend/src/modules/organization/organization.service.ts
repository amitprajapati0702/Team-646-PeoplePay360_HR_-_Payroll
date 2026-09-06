import { organizationRepository } from './organization.repository.js';
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
    return await organizationRepository.findDepartments(query);
  }

  async getDepartmentById(id: string) {
    const dept = await organizationRepository.findDepartmentById(id);
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
    const existing = await organizationRepository.findDepartmentByCode(data.code.toUpperCase());
    if (existing) {
      throw new ApiError({
        statuscode: httpStatus.CONFLICT,
        message: `Department code '${data.code}' already exists.`,
        errorcode: 'DEPT_CODE_EXISTS',
      });
    }

    return await organizationRepository.createDepartment(data);
  }

  async updateDepartment(id: string, data: UpdateDepartmentInput) {
    const existing = await organizationRepository.findDepartmentById(id);
    if (!existing) {
      throw new ApiError({
        statuscode: httpStatus.NOT_FOUND,
        message: 'Department not found.',
        errorcode: 'DEPARTMENT_NOT_FOUND',
      });
    }

    return await organizationRepository.updateDepartment(id, data);
  }

  async deleteDepartment(id: string) {
    const existing = await organizationRepository.findDepartmentById(id);
    if (!existing) {
      throw new ApiError({
        statuscode: httpStatus.NOT_FOUND,
        message: 'Department not found.',
        errorcode: 'DEPARTMENT_NOT_FOUND',
      });
    }

    return await organizationRepository.deleteDepartment(id);
  }

  // ─── Job Positions ──────────────────────────────────────────────
  async listJobPositions(query: ListQueryInput & { departmentId?: string }) {
    return await organizationRepository.findJobPositions(query);
  }

  async getJobPositionById(id: string) {
    const pos = await organizationRepository.findJobPositionById(id);
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
    const deptExists = await organizationRepository.findDepartmentById(data.departmentId);
    if (!deptExists) {
      throw new ApiError({
        statuscode: httpStatus.BAD_REQUEST,
        message: 'Department not found.',
        errorcode: 'INVALID_DEPARTMENT',
      });
    }

    const codeExists = await organizationRepository.findJobPositionByCode(data.code.toUpperCase());
    if (codeExists) {
      throw new ApiError({
        statuscode: httpStatus.CONFLICT,
        message: `Job position code '${data.code}' already exists.`,
        errorcode: 'JP_CODE_EXISTS',
      });
    }

    return await organizationRepository.createJobPosition(data);
  }

  async updateJobPosition(id: string, data: UpdateJobPositionInput) {
    const existing = await organizationRepository.findJobPositionById(id);
    if (!existing) {
      throw new ApiError({
        statuscode: httpStatus.NOT_FOUND,
        message: 'Job position not found.',
        errorcode: 'JOB_POSITION_NOT_FOUND',
      });
    }

    return await organizationRepository.updateJobPosition(id, data);
  }

  async deleteJobPosition(id: string) {
    const existing = await organizationRepository.findJobPositionById(id);
    if (!existing) {
      throw new ApiError({
        statuscode: httpStatus.NOT_FOUND,
        message: 'Job position not found.',
        errorcode: 'JOB_POSITION_NOT_FOUND',
      });
    }

    return await organizationRepository.deleteJobPosition(id);
  }

  // ─── Working Schedules ──────────────────────────────────────────
  async listWorkingSchedules(query: ListQueryInput) {
    return await organizationRepository.findWorkingSchedules(query);
  }

  async getWorkingScheduleById(id: string) {
    const sched = await organizationRepository.findWorkingScheduleById(id);
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
    const codeExists = await organizationRepository.findWorkingScheduleByCode(data.code.toUpperCase());
    if (codeExists) {
      throw new ApiError({
        statuscode: httpStatus.CONFLICT,
        message: `Schedule code '${data.code}' already exists.`,
        errorcode: 'SCHEDULE_CODE_EXISTS',
      });
    }

    const created = await organizationRepository.createWorkingSchedule({
      name: data.name,
      code: data.code.toUpperCase(),
      scheduleType: data.scheduleType ?? 'STANDARD',
      totalWeeklyHours: String(data.totalWeeklyHours ?? 40),
      isActive: data.isActive ?? true,
    });

    if (data.lines?.length) {
      await organizationRepository.createScheduleLines(
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
    const existing = await organizationRepository.findWorkingScheduleById(id);
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

    await organizationRepository.updateWorkingSchedule(id, updateData);

    if (data.lines !== undefined) {
      await organizationRepository.deleteScheduleLines(id);
      if (data.lines.length > 0) {
        await organizationRepository.createScheduleLines(
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
    const existing = await organizationRepository.findWorkingScheduleById(id);
    if (!existing) {
      throw new ApiError({
        statuscode: httpStatus.NOT_FOUND,
        message: 'Working schedule not found.',
        errorcode: 'SCHEDULE_NOT_FOUND',
      });
    }

    return await organizationRepository.deleteWorkingSchedule(id);
  }
}

export const organizationService = new OrganizationService();
