import { db } from '../../infrastructure/database/client.js';
import { contracts } from '../../infrastructure/database/schema/index.js';
import { eq, and, desc } from 'drizzle-orm';
import type { ContractQueryInput } from './contracts.schema.js';

export class ContractsRepository {
  async findMany(query: ContractQueryInput) {
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
      orderBy: [desc(contracts.startDate)],
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    });
  }

  async findById(id: string) {
    return await db.query.contracts.findFirst({
      where: eq(contracts.id, id),
      with: {
        employee: { columns: { id: true, firstName: true, lastName: true, employeeCode: true, avatarUrl: true } },
        department: true,
        jobPosition: true,
        salaryStructure: { with: { structureRules: { with: { salaryRule: { with: { category: true } } } } } },
        workingSchedule: { with: { lines: true } },
      },
    });
  }

  async findByReference(reference: string) {
    return await db.query.contracts.findFirst({
      where: eq(contracts.contractReference, reference),
    });
  }

  async create(data: typeof contracts.$inferInsert) {
    const [created] = await db.insert(contracts).values(data).returning();
    return created;
  }

  async update(id: string, data: Partial<typeof contracts.$inferInsert>) {
    const [updated] = await db.update(contracts).set(data).where(eq(contracts.id, id)).returning();
    return updated;
  }

  async delete(id: string) {
    const [deleted] = await db.delete(contracts).where(eq(contracts.id, id)).returning();
    return deleted;
  }

  async findActiveByEmployee(employeeId: string) {
    return await db.query.contracts.findMany({
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
      orderBy: [desc(contracts.startDate)],
    });
  }
}

export const contractsRepository = new ContractsRepository();
