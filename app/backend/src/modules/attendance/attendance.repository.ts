import { db } from '../../infrastructure/database/client.js';
import { attendances } from '../../infrastructure/database/schema/index.js';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import type { AttendanceQueryInput } from './attendance.schema.js';

export class AttendanceRepository {
  async findMany(query: AttendanceQueryInput) {
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
      orderBy: [desc(attendances.attendanceDate)],
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    });
  }

  async findById(id: string) {
    return await db.query.attendances.findFirst({
      where: eq(attendances.id, id),
      with: {
        employee: { columns: { id: true, firstName: true, lastName: true, employeeCode: true } },
        editedByUser: { columns: { id: true, email: true } },
      },
    });
  }

  async findByEmployeeAndDate(employeeId: string, attendanceDate: string) {
    return await db.query.attendances.findFirst({
      where: and(
        eq(attendances.employeeId, employeeId),
        eq(attendances.attendanceDate, attendanceDate)
      ),
    });
  }

  async create(data: typeof attendances.$inferInsert) {
    const [created] = await db.insert(attendances).values(data).returning();
    return created;
  }

  async update(id: string, data: Partial<typeof attendances.$inferInsert>) {
    const [updated] = await db.update(attendances).set(data).where(eq(attendances.id, id)).returning();
    return updated;
  }

  async delete(id: string) {
    const [deleted] = await db.delete(attendances).where(eq(attendances.id, id)).returning();
    return deleted;
  }

  async findRangeByEmployee(employeeId: string, dateFrom: string, dateTo: string) {
    return await db.query.attendances.findMany({
      where: and(
        eq(attendances.employeeId, employeeId),
        gte(attendances.attendanceDate, dateFrom),
        lte(attendances.attendanceDate, dateTo)
      ),
      columns: { status: true, workedHours: true, overtimeHours: true },
    });
  }
}

export const attendanceRepository = new AttendanceRepository();
