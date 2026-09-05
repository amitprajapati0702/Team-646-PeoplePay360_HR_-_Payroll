import { db } from '../../infrastructure/database/client.js';
import {
  salaryRuleCategories,
  salaryStructures,
  salaryRules,
  salaryStructureRules,
} from '../../infrastructure/database/schema/index.js';
import { eq, and, ilike, or } from 'drizzle-orm';
import ApiError from '../../utils/Apierror.js';
import httpStatus from '../../utils/http-status.js';
import type {
  CreateCategoryInput,
  CreateSalaryStructureInput,
  UpdateSalaryStructureInput,
  CreateSalaryRuleInput,
  UpdateSalaryRuleInput,
  AssignRuleInput,
} from './salary-structures.schema.js';

export class SalaryStructuresService {
  // ─── Categories ─────────────────────────────────────────────────
  async listCategories() {
    return await db.query.salaryRuleCategories.findMany({
      orderBy: (c, { asc }) => [asc(c.sequence)],
    });
  }

  async createCategory(data: CreateCategoryInput) {
    const exists = await db.query.salaryRuleCategories.findFirst({
      where: eq(salaryRuleCategories.code, data.code.toUpperCase()),
    });
    if (exists) {
      throw new ApiError({ statuscode: httpStatus.CONFLICT, message: `Category code '${data.code}' already exists.`, errorcode: 'CATEGORY_CODE_EXISTS' });
    }
    const [created] = await db.insert(salaryRuleCategories).values({ ...data, code: data.code.toUpperCase() }).returning();
    return created;
  }

  // ─── Salary Structures ──────────────────────────────────────────
  async listStructures(query: { search?: string; isActive?: boolean; page?: number; limit?: number }) {
    const conditions = [];
    if (query.search) conditions.push(or(ilike(salaryStructures.name, `%${query.search}%`), ilike(salaryStructures.code, `%${query.search}%`)));
    if (query.isActive !== undefined) conditions.push(eq(salaryStructures.isActive, query.isActive));

    return await db.query.salaryStructures.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: {
        structureRules: {
          with: { salaryRule: { with: { category: true } } },
          orderBy: (sr, { asc }) => [asc(sr.sequenceOverride)],
        },
      },
      orderBy: (s, { asc }) => [asc(s.name)],
      limit: query.limit ?? 50,
      offset: ((query.page ?? 1) - 1) * (query.limit ?? 50),
    });
  }

  async getStructureById(id: string) {
    const structure = await db.query.salaryStructures.findFirst({
      where: eq(salaryStructures.id, id),
      with: {
        structureRules: {
          with: { salaryRule: { with: { category: true } } },
          orderBy: (sr, { asc }) => [asc(sr.sequenceOverride)],
        },
      },
    });
    if (!structure) {
      throw new ApiError({ statuscode: httpStatus.NOT_FOUND, message: 'Salary structure not found.', errorcode: 'STRUCTURE_NOT_FOUND' });
    }
    return structure;
  }

  async createStructure(data: CreateSalaryStructureInput) {
    const exists = await db.query.salaryStructures.findFirst({
      where: eq(salaryStructures.code, data.code.toUpperCase()),
    });
    if (exists) {
      throw new ApiError({ statuscode: httpStatus.CONFLICT, message: `Structure code '${data.code}' already exists.`, errorcode: 'STRUCTURE_CODE_EXISTS' });
    }
    const [created] = await db.insert(salaryStructures).values({ ...data, code: data.code.toUpperCase() }).returning();
    return created;
  }

  async updateStructure(id: string, data: UpdateSalaryStructureInput) {
    const existing = await db.query.salaryStructures.findFirst({ where: eq(salaryStructures.id, id) });
    if (!existing) throw new ApiError({ statuscode: httpStatus.NOT_FOUND, message: 'Salary structure not found.', errorcode: 'STRUCTURE_NOT_FOUND' });
    const [updated] = await db.update(salaryStructures).set({ ...data, updatedAt: new Date() }).where(eq(salaryStructures.id, id)).returning();
    return updated;
  }

  async deleteStructure(id: string) {
    const existing = await db.query.salaryStructures.findFirst({ where: eq(salaryStructures.id, id) });
    if (!existing) throw new ApiError({ statuscode: httpStatus.NOT_FOUND, message: 'Salary structure not found.', errorcode: 'STRUCTURE_NOT_FOUND' });
    const [deleted] = await db.delete(salaryStructures).where(eq(salaryStructures.id, id)).returning();
    return deleted;
  }

  // ─── Assign/Remove Rules from Structure ─────────────────────────
  async assignRuleToStructure(structureId: string, data: AssignRuleInput) {
    // Check if already assigned
    const existing = await db.query.salaryStructureRules.findFirst({
      where: and(
        eq(salaryStructureRules.salaryStructureId, structureId),
        eq(salaryStructureRules.salaryRuleId, data.salaryRuleId)
      ),
    });
    if (existing) {
      throw new ApiError({ statuscode: httpStatus.CONFLICT, message: 'Rule is already assigned to this structure.', errorcode: 'RULE_ALREADY_ASSIGNED' });
    }
    const [created] = await db.insert(salaryStructureRules).values({
      salaryStructureId: structureId,
      salaryRuleId: data.salaryRuleId,
      sequenceOverride: data.sequenceOverride ?? null,
    }).returning();
    return created;
  }

  async removeRuleFromStructure(structureId: string, ruleId: string) {
    const existing = await db.query.salaryStructureRules.findFirst({
      where: and(
        eq(salaryStructureRules.salaryStructureId, structureId),
        eq(salaryStructureRules.salaryRuleId, ruleId)
      ),
    });
    if (!existing) throw new ApiError({ statuscode: httpStatus.NOT_FOUND, message: 'Rule assignment not found.', errorcode: 'RULE_NOT_ASSIGNED' });
    const [deleted] = await db.delete(salaryStructureRules)
      .where(and(eq(salaryStructureRules.salaryStructureId, structureId), eq(salaryStructureRules.salaryRuleId, ruleId)))
      .returning();
    return deleted;
  }

  // ─── Salary Rules ───────────────────────────────────────────────
  async listRules(query: { search?: string; isActive?: boolean; categoryId?: string; page?: number; limit?: number }) {
    const conditions = [];
    if (query.search) conditions.push(or(ilike(salaryRules.name, `%${query.search}%`), ilike(salaryRules.code, `%${query.search}%`)));
    if (query.isActive !== undefined) conditions.push(eq(salaryRules.isActive, query.isActive));
    if (query.categoryId) conditions.push(eq(salaryRules.categoryId, query.categoryId));

    return await db.query.salaryRules.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: { category: true },
      orderBy: (r, { asc }) => [asc(r.sequence)],
      limit: query.limit ?? 50,
      offset: ((query.page ?? 1) - 1) * (query.limit ?? 50),
    });
  }

  async getRuleById(id: string) {
    const rule = await db.query.salaryRules.findFirst({
      where: eq(salaryRules.id, id),
      with: { category: true },
    });
    if (!rule) throw new ApiError({ statuscode: httpStatus.NOT_FOUND, message: 'Salary rule not found.', errorcode: 'RULE_NOT_FOUND' });
    return rule;
  }

  async createRule(data: CreateSalaryRuleInput) {
    const exists = await db.query.salaryRules.findFirst({
      where: eq(salaryRules.code, data.code.toUpperCase()),
    });
    if (exists) throw new ApiError({ statuscode: httpStatus.CONFLICT, message: `Rule code '${data.code}' already exists.`, errorcode: 'RULE_CODE_EXISTS' });

    const [created] = await db.insert(salaryRules).values({
      categoryId: data.categoryId,
      name: data.name,
      code: data.code.toUpperCase(),
      sequence: data.sequence ?? 10,
      appearsOnPayslip: data.appearsOnPayslip ?? true,
      computationType: data.computationType ?? 'FIXED',
      fixedAmount: data.fixedAmount != null ? String(data.fixedAmount) : '0.00',
      percentage: data.percentage != null ? String(data.percentage) : '0.000',
      percentageBaseRuleCode: data.percentageBaseRuleCode ?? null,
      formulaExpression: data.formulaExpression ?? null,
      conditionExpression: data.conditionExpression ?? null,
      isActive: data.isActive ?? true,
    }).returning();
    return created;
  }

  async updateRule(id: string, data: UpdateSalaryRuleInput) {
    const existing = await db.query.salaryRules.findFirst({ where: eq(salaryRules.id, id) });
    if (!existing) throw new ApiError({ statuscode: httpStatus.NOT_FOUND, message: 'Salary rule not found.', errorcode: 'RULE_NOT_FOUND' });

    const updatePayload: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.code !== undefined) updatePayload.code = data.code.toUpperCase();
    if (data.sequence !== undefined) updatePayload.sequence = data.sequence;
    if (data.appearsOnPayslip !== undefined) updatePayload.appearsOnPayslip = data.appearsOnPayslip;
    if (data.computationType !== undefined) updatePayload.computationType = data.computationType;
    if (data.fixedAmount !== undefined) updatePayload.fixedAmount = data.fixedAmount != null ? String(data.fixedAmount) : '0.00';
    if (data.percentage !== undefined) updatePayload.percentage = data.percentage != null ? String(data.percentage) : '0.000';
    if (data.percentageBaseRuleCode !== undefined) updatePayload.percentageBaseRuleCode = data.percentageBaseRuleCode;
    if (data.formulaExpression !== undefined) updatePayload.formulaExpression = data.formulaExpression;
    if (data.conditionExpression !== undefined) updatePayload.conditionExpression = data.conditionExpression;
    if (data.isActive !== undefined) updatePayload.isActive = data.isActive;

    const [updated] = await db.update(salaryRules).set(updatePayload).where(eq(salaryRules.id, id)).returning();
    return updated;
  }

  async deleteRule(id: string) {
    const existing = await db.query.salaryRules.findFirst({ where: eq(salaryRules.id, id) });
    if (!existing) throw new ApiError({ statuscode: httpStatus.NOT_FOUND, message: 'Salary rule not found.', errorcode: 'RULE_NOT_FOUND' });
    const [deleted] = await db.delete(salaryRules).where(eq(salaryRules.id, id)).returning();
    return deleted;
  }
}

export const salaryStructuresService = new SalaryStructuresService();
