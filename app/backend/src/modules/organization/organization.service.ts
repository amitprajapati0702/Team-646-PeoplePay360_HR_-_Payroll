import { organizationRepository } from './organization.repository.js';
import ApiError from '../../utils/Apierror.js';
import httpStatus from '../../utils/http-status.js';
import { redis } from '../../infrastructure/redis/client.js';
import logger from '../../config/logger.js';
import type {
  CreateDepartmentInput,
  UpdateDepartmentInput,
  CreateJobPositionInput,
  UpdateJobPositionInput,
  CreateWorkingScheduleInput,
  UpdateWorkingScheduleInput,
  ListQueryInput,
} from './organization.schema.js';

const CACHE_TTL = 60;

async function getCached<T>(key: string): Promise<T | null> {
  try {
    if (redis.isOpen) {
      const data = await redis.get(key);
      if (data) return JSON.parse(data) as T;
    }
  } catch (err) {
    logger.warn(err, `Redis cache get failed for ${key}`);
  }
  return null;
}

async function setCached(key: string, value: any, ttl = CACHE_TTL): Promise<void> {
  try {
    if (redis.isOpen) {
      await redis.setEx(key, ttl, JSON.stringify(value));
    }
  } catch (err) {
    logger.warn(err, `Redis cache set failed for ${key}`);
  }
}

async function invalidateCache(pattern: string): Promise<void> {
  try {
    if (redis.isOpen) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    }
  } catch (err) {
    logger.warn(err, `Redis cache invalidation failed for ${pattern}`);
  }
}

export class OrganizationService {
  // ─── Departments ────────────────────────────────────────────────
  async listDepartments(query: ListQueryInput) {
    const cacheKey = `cache:org:departments:${JSON.stringify(query)}`;
    const cached = await getCached<any>(cacheKey);
    if (cached) return cached;

    const result = await organizationRepository.findDepartments(query);
    await setCached(cacheKey, result);
    return result;
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

    const created = await organizationRepository.createDepartment(data);
    await invalidateCache('cache:org:departments:*');
    return created;
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

    const updated = await organizationRepository.updateDepartment(id, data);
    await invalidateCache('cache:org:departments:*');
    return updated;
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

    const deleted = await organizationRepository.deleteDepartment(id);
    await invalidateCache('cache:org:departments:*');
    return deleted;
  }

  // ─── Job Positions ──────────────────────────────────────────────
  async listJobPositions(query: ListQueryInput & { departmentId?: string }) {
    const cacheKey = `cache:org:jobs:${JSON.stringify(query)}`;
    const cached = await getCached<any>(cacheKey);
    if (cached) return cached;

    const result = await organizationRepository.findJobPositions(query);
    await setCached(cacheKey, result);
    return result;
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

    const created = await organizationRepository.createJobPosition(data);
    await invalidateCache('cache:org:jobs:*');
    return created;
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

    const updated = await organizationRepository.updateJobPosition(id, data);
    await invalidateCache('cache:org:jobs:*');
    return updated;
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

    const deleted = await organizationRepository.deleteJobPosition(id);
    await invalidateCache('cache:org:jobs:*');
    return deleted;
  }

  // ─── Working Schedules ──────────────────────────────────────────
  async listWorkingSchedules(query: ListQueryInput) {
    const cacheKey = `cache:org:schedules:${JSON.stringify(query)}`;
    const cached = await getCached<any>(cacheKey);
    if (cached) return cached;

    const result = await organizationRepository.findWorkingSchedules(query);
    await setCached(cacheKey, result);
    return result;
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
    const rawCode = (data.code || data.name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 30) || 'SCHED').toUpperCase();
    let finalCode = rawCode;
    const codeExists = await organizationRepository.findWorkingScheduleByCode(finalCode);
    if (codeExists) {
      finalCode = `${rawCode}_${Math.floor(Math.random() * 1000)}`;
    }

    const weeklyHours = data.totalWeeklyHours ?? data.hoursPerWeek ?? 40;

    const created = await organizationRepository.createWorkingSchedule({
      name: data.name,
      code: finalCode,
      scheduleType: data.scheduleType ?? 'STANDARD',
      totalWeeklyHours: String(weeklyHours),
      isActive: data.isActive ?? true,
    });

    const lines = data.lines?.length
      ? data.lines
      : (data.workingDays?.length
          ? data.workingDays.map((day) => ({
              dayOfWeek: day as any,
              workFrom: '09:00',
              workTo: '18:00',
              breakDurationMinutes: 60,
              dailyWorkingHours: data.hoursPerDay ?? 8,
            }))
          : []);

    if (lines.length) {
      await organizationRepository.createScheduleLines(
        lines.map((l) => ({
          workingScheduleId: created.id,
          dayOfWeek: l.dayOfWeek,
          workFrom: l.workFrom,
          workTo: l.workTo,
          breakDurationMinutes: l.breakDurationMinutes ?? 60,
          dailyWorkingHours: l.dailyWorkingHours ? String(l.dailyWorkingHours) : null,
        }))
      );
    }

    await invalidateCache('cache:org:schedules:*');
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

    await invalidateCache('cache:org:schedules:*');
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

    const deleted = await organizationRepository.deleteWorkingSchedule(id);
    await invalidateCache('cache:org:schedules:*');
    return deleted;
  }
}

export const organizationService = new OrganizationService();
