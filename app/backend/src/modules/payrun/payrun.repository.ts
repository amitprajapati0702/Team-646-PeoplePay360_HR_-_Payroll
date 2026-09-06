import { db } from '../../infrastructure/database/client.js';
import { payruns, payslips, payslipLines, employees } from '../../infrastructure/database/schema/index.js';
import { eq, and, desc, asc } from 'drizzle-orm';
import type { CreatePayrunInput, PayrunQueryInput } from './payrun.schema.js';

export class PayrunRepository {
  async findMany(query: PayrunQueryInput) {
    const conditions = [];
    if (query.status) conditions.push(eq(payruns.status, query.status));

    return await db.query.payruns.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: {
        defaultSalaryStructure: { columns: { id: true, name: true, code: true } },
        createdByUser: { columns: { id: true, email: true } },
        validatedByUser: { columns: { id: true, email: true } },
        payslips: { columns: { id: true, status: true, netAmount: true } },
      },
      orderBy: [desc(payruns.createdAt)],
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    });
  }

  async findById(id: string) {
    return await db.query.payruns.findFirst({
      where: eq(payruns.id, id),
      with: {
        defaultSalaryStructure: true,
        createdByUser: { columns: { id: true, email: true } },
        validatedByUser: { columns: { id: true, email: true } },
        payslips: {
          with: {
            employee: { columns: { id: true, firstName: true, lastName: true, employeeCode: true, avatarUrl: true } },
            salaryStructure: { columns: { id: true, name: true } },
          },
          orderBy: [asc(payslips.payslipNumber)],
        },
      },
    });
  }

  async findByBatchCode(batchCode: string) {
    return await db.query.payruns.findFirst({ where: eq(payruns.batchCode, batchCode) });
  }

  async create(data: typeof payruns.$inferInsert) {
    const [created] = await db.insert(payruns).values(data).returning();
    return created;
  }

  async update(id: string, data: Partial<typeof payruns.$inferInsert>) {
    const [updated] = await db.update(payruns).set(data).where(eq(payruns.id, id)).returning();
    return updated;
  }

  async delete(id: string) {
    const [deleted] = await db.delete(payruns).where(eq(payruns.id, id)).returning();
    return deleted;
  }

  async findPayslipByPayrunAndEmployee(payrunId: string, employeeId: string) {
    return await db.query.payslips.findFirst({
      where: and(eq(payslips.payrunId, payrunId), eq(payslips.employeeId, employeeId)),
    });
  }

  async findPayslipsForPayrun(payrunId: string) {
    return await db.query.payslips.findMany({
      where: eq(payslips.payrunId, payrunId),
      columns: { grossAmount: true, deductionAmount: true, netAmount: true },
    });
  }

  async createPayslip(data: typeof payslips.$inferInsert) {
    const [created] = await db.insert(payslips).values(data).returning();
    return created;
  }

  async createPayslipLines(lines: (typeof payslipLines.$inferInsert)[]) {
    if (lines.length === 0) return [];
    return await db.insert(payslipLines).values(lines).returning();
  }

  async updatePayslipsStatusByPayrun(payrunId: string, status: any) {
    return await db.update(payslips).set({ status, updatedAt: new Date() }).where(eq(payslips.payrunId, payrunId)).returning();
  }

  async findEmployeeBankDetails(employeeId: string) {
    return await db.query.employees.findFirst({
      where: eq(employees.id, employeeId),
      columns: { bankName: true, bankAccountNumber: true, bankRoutingOrIfsc: true, bankAccountHolderName: true },
    });
  }
}

export const payrunRepository = new PayrunRepository();
