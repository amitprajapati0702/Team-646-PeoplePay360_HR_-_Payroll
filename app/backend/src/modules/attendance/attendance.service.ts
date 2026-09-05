import { db } from '../../infrastructure/database/client.js';
import { attendances } from '../../infrastructure/database/schema/index.js';
import { eq, and, gte, lte, between } from 'drizzle-orm';
import ApiError from '../../utils/Apierror.js';
import httpStatus from '../../utils/http-status.js';
import type { CreateAttendanceInput, UpdateAttendanceInput, AttendanceQueryInput } from './attendance.schema.js';

function computeWorkedHours(checkIn: string, checkOut?: string | null): number {
  if (!checkOut) return 0;
  const inTime = new Date(checkIn).getTime();
  const outTime = new Date(checkOut).getTime();
  const diffMs = outTime - inTime;
  if (diffMs <= 0) return 0;
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // hours, 2 decimals
}

export class AttendanceService {
  async listAttendance(query: AttendanceQueryInput) {
    const conditions = [];
    if (query.employeeId) conditions.push(eq(attendances.employeeId, query.employeeId));
    if (query.status) conditions.push(eq(attendances.status, query.status));
    if (query.dateFrom) conditions.push(gte(attendances.attendanceDate, query.dateFrom));
    if (query.dateTo) conditions.push(lte(attendances.attendanceDate, query.dateTo));

    return await db.query.attendances.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: {
        employee: { columns: { id: true, firstName: true, lastName: true, employeeCode: true, avatarUrl: true } },
        editedByUser: { columns: { id: true, email: true } },
      },
      orderBy: (a, { desc }) => [desc(a.attendanceDate)],
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    });
  }

  async getAttendanceById(id: string) {
    const att = await db.query.attendances.findFirst({
      where: eq(attendances.id, id),
      with: {
        employee: { columns: { id: true, firstName: true, lastName: true, employeeCode: true } },
        editedByUser: { columns: { id: true, email: true } },
      },
    });

    if (!att) {
      throw new ApiError({
        statuscode: httpStatus.NOT_FOUND,
        message: 'Attendance record not found.',
        errorcode: 'ATTENDANCE_NOT_FOUND',
      });
    }
    return att;
  }

  async createAttendance(data: CreateAttendanceInput, actingUserId?: string) {
    // Check for duplicate entry on same day for same employee
    const existing = await db.query.attendances.findFirst({
      where: and(
        eq(attendances.employeeId, data.employeeId),
        eq(attendances.attendanceDate, data.attendanceDate)
      ),
    });

    if (existing) {
      throw new ApiError({
        statuscode: httpStatus.CONFLICT,
        message: 'An attendance record already exists for this employee on this date.',
        errorcode: 'ATTENDANCE_DUPLICATE',
      });
    }

    const workedHours = computeWorkedHours(data.checkIn, data.checkOut);

    const [created] = await db
      .insert(attendances)
      .values({
        employeeId: data.employeeId,
        attendanceDate: data.attendanceDate,
        checkIn: new Date(data.checkIn),
        checkOut: data.checkOut ? new Date(data.checkOut) : null,
        workedHours: String(workedHours),
        overtimeHours: workedHours > 8 ? String(workedHours - 8) : '0.00',
        status: data.status ?? 'PRESENT',
        isManuallyEdited: !!actingUserId,
        editedByUserId: actingUserId ?? null,
        editReason: data.editReason ?? null,
      })
      .returning();

    return created;
  }

  async updateAttendance(id: string, data: UpdateAttendanceInput, actingUserId?: string) {
    const existing = await db.query.attendances.findFirst({ where: eq(attendances.id, id) });
    if (!existing) {
      throw new ApiError({
        statuscode: httpStatus.NOT_FOUND,
        message: 'Attendance record not found.',
        errorcode: 'ATTENDANCE_NOT_FOUND',
      });
    }

    const newCheckIn = data.checkIn ?? existing.checkIn?.toISOString() ?? '';
    const newCheckOut = data.checkOut !== undefined ? data.checkOut : existing.checkOut?.toISOString();
    const workedHours = computeWorkedHours(newCheckIn, newCheckOut);

    const updatePayload: Record<string, unknown> = {
      updatedAt: new Date(),
      isManuallyEdited: true,
      editedByUserId: actingUserId ?? null,
      editReason: data.editReason ?? 'Manual HR correction',
      workedHours: String(workedHours),
      overtimeHours: workedHours > 8 ? String(workedHours - 8) : '0.00',
    };

    if (data.attendanceDate !== undefined) updatePayload.attendanceDate = data.attendanceDate;
    if (data.checkIn !== undefined) updatePayload.checkIn = new Date(data.checkIn);
    if (data.checkOut !== undefined) updatePayload.checkOut = data.checkOut ? new Date(data.checkOut) : null;
    if (data.status !== undefined) updatePayload.status = data.status;

    const [updated] = await db
      .update(attendances)
      .set(updatePayload)
      .where(eq(attendances.id, id))
      .returning();

    return updated;
  }

  async deleteAttendance(id: string) {
    const existing = await db.query.attendances.findFirst({ where: eq(attendances.id, id) });
    if (!existing) {
      throw new ApiError({
        statuscode: httpStatus.NOT_FOUND,
        message: 'Attendance record not found.',
        errorcode: 'ATTENDANCE_NOT_FOUND',
      });
    }
    const [deleted] = await db.delete(attendances).where(eq(attendances.id, id)).returning();
    return deleted;
  }

  /**
   * Get summary stats for an employee in a date range — used by payrun engine.
   */
  async getSummaryForEmployee(
    employeeId: string,
    dateFrom: string,
    dateTo: string
  ): Promise<{ presentDays: number; totalWorkedHours: number; overtimeHours: number }> {
    const records = await db.query.attendances.findMany({
      where: and(
        eq(attendances.employeeId, employeeId),
        gte(attendances.attendanceDate, dateFrom),
        lte(attendances.attendanceDate, dateTo)
      ),
      columns: { status: true, workedHours: true, overtimeHours: true },
    });

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
