import { z } from 'zod';

const emptyToNull = (val: unknown) =>
  typeof val === 'string' && val.trim() === '' ? null : val;

// ─── Salary Rule Categories ─────────────────────────────────────
export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  code: z.string().trim().min(1).max(50),
  sequence: z.number().int().min(1).default(10),
  parentCategoryId: z.preprocess(emptyToNull, z.string().uuid().optional().nullable()),
});

export const updateCategorySchema = createCategorySchema.partial();

// ─── Salary Structures ──────────────────────────────────────────
export const createSalaryStructureSchema = z.object({
  code: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(150),
  description: z.preprocess(emptyToNull, z.string().max(500).optional().nullable()),
  parentStructureId: z.preprocess(emptyToNull, z.string().uuid().optional().nullable()),
  isActive: z.boolean().default(true),
});

export const updateSalaryStructureSchema = createSalaryStructureSchema.partial();

// ─── Salary Rules ───────────────────────────────────────────────
export const createSalaryRuleSchema = z.object({
  categoryId: z.string().trim().optional(),
  category: z.string().trim().optional(),
  name: z.string().trim().min(1).max(150),
  code: z.string().trim().min(1).max(50),
  sequence: z.coerce.number().int().min(1).default(10),
  appearsOnPayslip: z.boolean().default(true),
  computationType: z.enum(['FIXED', 'PERCENTAGE', 'FORMULA']).default('FIXED'),
  calculationType: z.preprocess(emptyToNull, z.string().optional().nullable()),
  fixedAmount: z.preprocess(emptyToNull, z.coerce.number().min(0).optional().nullable()),
  amount: z.preprocess(emptyToNull, z.coerce.number().min(0).optional().nullable()),
  percentage: z.preprocess(emptyToNull, z.coerce.number().min(0).max(100).optional().nullable()),
  percentageBaseRuleCode: z.preprocess(emptyToNull, z.string().max(50).optional().nullable()),
  baseRuleCode: z.preprocess(emptyToNull, z.string().max(50).optional().nullable()),
  formulaExpression: z.preprocess(emptyToNull, z.string().max(2000).optional().nullable()),
  conditionExpression: z.preprocess(emptyToNull, z.string().max(2000).optional().nullable()),
  condition: z.preprocess(emptyToNull, z.string().max(2000).optional().nullable()),
  isActive: z.boolean().default(true),
});

export const updateSalaryRuleSchema = createSalaryRuleSchema.partial().omit({ categoryId: true });

// ─── Structure ↔ Rule Association ──────────────────────────────
export const assignRuleToStructureSchema = z.object({
  salaryRuleId: z.preprocess(emptyToNull, z.string().uuid().optional().nullable()),
  ruleId: z.preprocess(emptyToNull, z.string().uuid().optional().nullable()),
  sequenceOverride: z.preprocess(emptyToNull, z.coerce.number().int().min(1).optional().nullable()),
  sequence: z.preprocess(emptyToNull, z.coerce.number().int().min(1).optional().nullable()),
});

// ─── Shared ─────────────────────────────────────────────────────
export const idParamSchema = z.object({ id: z.string().uuid() });

export const listQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z.preprocess((v) => v === 'true' ? true : v === 'false' ? false : undefined, z.boolean().optional()),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateSalaryStructureInput = z.infer<typeof createSalaryStructureSchema>;
export type UpdateSalaryStructureInput = z.infer<typeof updateSalaryStructureSchema>;
export type CreateSalaryRuleInput = z.infer<typeof createSalaryRuleSchema>;
export type UpdateSalaryRuleInput = z.infer<typeof updateSalaryRuleSchema>;
export type AssignRuleInput = z.infer<typeof assignRuleToStructureSchema>;
