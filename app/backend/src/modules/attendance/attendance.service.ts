import { attendanceRepository } from './attendance.repository.js';
import ApiError from '../../utils/Apierror.js';
import httpStatus from '../../utils/http-status.js';
import type { CreateAttendanceInput, UpdateAttendanceInput, AttendanceQueryInput } from './attendance.schema.js';

function computeWorkedHours(checkIn: string | Date, checkOut?: string | Date | null): number {
  if (!checkOut) return 0;
  const inTime = new Date(checkIn).getTime();
  const outTime = new Date(checkOut).getTime();
  const diffMs = outTime - inTime;
  if (diffMs <= 0) return 0;
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // hours, 2 decimals
}

export class AttendanceService {
  async listAttendance(query: AttendanceQueryInput) {
    return await attendanceRepository.findMany(query);
  }

  async getAttendanceById(id: string) {
    const att = await attendanceRepository.findById(id);
    if (!att) {
      throw new ApiError({
        statuscode: httpStatus.NOT_FOUND,
        message: 'Attendance record not found.',
        errorcode: 'ATTENDANCE_NOT_FOUND',
      });
    }
    return att;
  }

  /**
   * Check In Algorithm:
   * Current Time -> Check existing attendance -> Create record -> Mark Present
   */
  async checkIn(employeeId: string, customTime?: string) {
    const now = customTime ? new Date(customTime) : new Date();
    const today = now.toISOString().split('T')[0];

    const existing = await attendanceRepository.findByEmployeeAndDate(employeeId, today);
    if (existing) {
      throw new ApiError({
        statuscode: httpStatus.CONFLICT,
        message: 'You have already checked in for today.',
        errorcode: 'ATTENDANCE_ALREADY_CHECKED_IN',
      });
    }

    return await attendanceRepository.create({
      employeeId,
      attendanceDate: today,
      checkIn: now,
      status: 'PRESENT',
      workedHours: '0.00',
      overtimeHours: '0.00',
      isManuallyEdited: false,
    });
  }

  /**
   * Check Out Algorithm:
   * Find today's attendance -> Update Check Out Time -> Calculate Hours -> Save
   */
  async checkOut(employeeId: string, customTime?: string) {
    const now = customTime ? new Date(customTime) : new Date();
    const today = now.toISOString().split('T')[0];

    const existing = await attendanceRepository.findByEmployeeAndDate(employeeId, today);
    if (!existing) {
      throw new ApiError({
        statuscode: httpStatus.NOT_FOUND,
        message: 'No check-in record found for today. Please check in first.',
        errorcode: 'ATTENDANCE_NOT_CHECKED_IN',
      });
    }

    if (existing.checkOut) {
      throw new ApiError({
        statuscode: httpStatus.CONFLICT,
        message: 'You have already checked out for today.',
        errorcode: 'ATTENDANCE_ALREADY_CHECKED_OUT',
      });
    }

    const workedHours = computeWorkedHours(existing.checkIn, now);
    const overtimeHours = workedHours > 8 ? workedHours - 8 : 0;

    return await attendanceRepository.update(existing.id, {
      checkOut: now,
      workedHours: String(workedHours),
      overtimeHours: String(Math.round(overtimeHours * 100) / 100),
      updatedAt: new Date(),
    });
  }

  async createAttendance(data: CreateAttendanceInput, actingUserId?: string) {
    const attDate = data.attendanceDate || data.date || new Date().toISOString().split('T')[0];
    const existing = await attendanceRepository.findByEmployeeAndDate(data.employeeId, attDate);

    if (existing) {
      throw new ApiError({
        statuscode: httpStatus.CONFLICT,
        message: 'An attendance record already exists for this employee on this date.',
        errorcode: 'ATTENDANCE_DUPLICATE',
      });
    }

    let checkInDate: Date;
    if (data.checkIn) {
      checkInDate = new Date(data.checkIn.includes('T') ? data.checkIn : `${attDate}T${data.checkIn}:00.000Z`);
    } else if (data.checkInTime) {
      checkInDate = new Date(`${attDate}T${data.checkInTime}:00.000Z`);
    } else {
      checkInDate = new Date(`${attDate}T09:00:00.000Z`);
    }

    let checkOutDate: Date | null = null;
    if (data.checkOut) {
      checkOutDate = new Date(data.checkOut.includes('T') ? data.checkOut : `${attDate}T${data.checkOut}:00.000Z`);
    } else if (data.checkOutTime) {
      checkOutDate = new Date(`${attDate}T${data.checkOutTime}:00.000Z`);
    }

    const computed = computeWorkedHours(checkInDate, checkOutDate);
    const workedHours = data.workedHours !== undefined ? data.workedHours : computed;
    const overtimeHours = data.overtimeHours !== undefined ? data.overtimeHours : (workedHours > 8 ? workedHours - 8 : 0);

    let status: 'PRESENT' | 'LATE' | 'HALF_DAY' | 'ABSENT' | 'OVERTIME' | 'EXCEPTION' = 'PRESENT';
    if (data.status === 'ON_LEAVE') {
      status = 'EXCEPTION';
    } else if (data.status) {
      status = data.status;
    }

    return await attendanceRepository.create({
      employeeId: data.employeeId,
      attendanceDate: attDate,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      workedHours: String(workedHours),
      overtimeHours: String(Math.round(overtimeHours * 100) / 100),
      status,
      isManuallyEdited: !!actingUserId,
      editedByUserId: actingUserId ?? null,
      editReason: data.editReason ?? data.notes ?? null,
    });
  }

  async updateAttendance(id: string, data: UpdateAttendanceInput, actingUserId?: string) {
    const existing = await attendanceRepository.findById(id);
    if (!existing) {
      throw new ApiError({
        statuscode: httpStatus.NOT_FOUND,
        message: 'Attendance record not found.',
        errorcode: 'ATTENDANCE_NOT_FOUND',
      });
    }

    const attDate = data.attendanceDate || data.date || existing.attendanceDate;
    let checkInDate = existing.checkIn;
    if (data.checkIn) {
      checkInDate = new Date(data.checkIn.includes('T') ? data.checkIn : `${attDate}T${data.checkIn}:00.000Z`);
    } else if (data.checkInTime) {
      checkInDate = new Date(`${attDate}T${data.checkInTime}:00.000Z`);
    }

    let checkOutDate = existing.checkOut;
    if (data.checkOut !== undefined) {
      checkOutDate = data.checkOut
        ? new Date(data.checkOut.includes('T') ? data.checkOut : `${attDate}T${data.checkOut}:00.000Z`)
        : null;
    } else if (data.checkOutTime !== undefined) {
      checkOutDate = data.checkOutTime ? new Date(`${attDate}T${data.checkOutTime}:00.000Z`) : null;
    }

    const computed = computeWorkedHours(checkInDate, checkOutDate);
    const workedHours = data.workedHours !== undefined ? data.workedHours : computed;
    const overtimeHours = data.overtimeHours !== undefined ? data.overtimeHours : (workedHours > 8 ? workedHours - 8 : 0);

    let status: 'PRESENT' | 'LATE' | 'HALF_DAY' | 'ABSENT' | 'OVERTIME' | 'EXCEPTION' = existing.status;
    if (data.status === 'ON_LEAVE') {
      status = 'EXCEPTION';
    } else if (data.status) {
      status = data.status;
    }

    const updatePayload: Record<string, unknown> = {
      updatedAt: new Date(),
      isManuallyEdited: true,
      editedByUserId: actingUserId ?? null,
      editReason: data.editReason ?? data.notes ?? 'Manual HR correction',
      attendanceDate: attDate,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      workedHours: String(workedHours),
      overtimeHours: String(Math.round(overtimeHours * 100) / 100),
      status,
    };

    return await attendanceRepository.update(id, updatePayload);
  }

  async deleteAttendance(id: string) {
    const existing = await attendanceRepository.findById(id);
    if (!existing) {
      throw new ApiError({
        statuscode: httpStatus.NOT_FOUND,
        message: 'Attendance record not found.',
        errorcode: 'ATTENDANCE_NOT_FOUND',
      });
    }
    return await attendanceRepository.delete(id);
  }

  /**
   * Get summary stats for an employee in a date range — used by payrun engine.
   */
  async getSummaryForEmployee(
    employeeId: string,
    dateFrom: string,
    dateTo: string
  ): Promise<{ presentDays: number; totalWorkedHours: number; overtimeHours: number }> {
    const records = await attendanceRepository.findRangeByEmployee(employeeId, dateFrom, dateTo);

    const presentDays = records.filter((r) =>
      ['PRESENT', 'LATE', 'OVERTIME', 'HALF_DAY'].includes(r.status)
    ).length;

    const totalWorkedHours = records.reduce((sum, r) => sum + parseFloat(r.workedHours ?? '0'), 0);
    const overtimeHours = records.reduce((sum, r) => sum + parseFloat(r.overtimeHours ?? '0'), 0);

    return {
      presentDays,
      totalWorkedHours: Math.round(totalWorkedHours * 100) / 100,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
    };
  }
}

export const attendanceService = new AttendanceService();
