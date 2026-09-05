import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  numeric,
  integer,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { computationTypeEnum } from './enums.js';
import { contracts } from './contracts.js';
import { payruns, payslips, payslipLines } from './payroll.js';

export const salaryRuleCategories = pgTable('salary_rule_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(), // BASIC, ALW, GROSS, DED, COMP, NET
  parentCategoryId: uuid('parent_category_id'),
  sequence: integer('sequence').notNull().default(10),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const salaryRuleCategoriesRelations = relations(
  salaryRuleCategories,
  ({ one, many }) => ({
    parentCategory: one(salaryRuleCategories, {
      fields: [salaryRuleCategories.parentCategoryId],
      references: [salaryRuleCategories.id],
      relationName: 'parentCategoryChildren',
    }),
    childCategories: many(salaryRuleCategories, {
      relationName: 'parentCategoryChildren',
    }),
    rules: many(salaryRules),
    payslipLines: many(payslipLines),
  })
);

export const salaryStructures = pgTable('salary_structures', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 150 }).notNull(),
  description: text('description'),
  parentStructureId: uuid('parent_structure_id'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const salaryStructuresRelations = relations(salaryStructures, ({ one, many }) => ({
  parentStructure: one(salaryStructures, {
    fields: [salaryStructures.parentStructureId],
    references: [salaryStructures.id],
    relationName: 'parentStructureChildren',
  }),
  childStructures: many(salaryStructures, {
    relationName: 'parentStructureChildren',
  }),
  structureRules: many(salaryStructureRules),
  contracts: many(contracts),
  payruns: many(payruns),
  payslips: many(payslips),
}));

export const salaryRules = pgTable('salary_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => salaryRuleCategories.id, { onDelete: 'restrict' }),
  name: varchar('name', { length: 150 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(), // BASIC, HRA, PF, TDS, NET
  sequence: integer('sequence').notNull().default(10),
  appearsOnPayslip: boolean('appears_on_payslip').notNull().default(true),

  computationType: computationTypeEnum('computation_type').notNull().default('FIXED'),
  fixedAmount: numeric('fixed_amount', { precision: 15, scale: 2 }).default('0.00'),
  percentage: numeric('percentage', { precision: 6, scale: 3 }).default('0.000'),
  percentageBaseRuleCode: varchar('percentage_base_rule_code', { length: 50 }),
  formulaExpression: text('formula_expression'),
  conditionExpression: text('condition_expression'),

  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const salaryRulesRelations = relations(salaryRules, ({ one, many }) => ({
  category: one(salaryRuleCategories, {
    fields: [salaryRules.categoryId],
    references: [salaryRuleCategories.id],
  }),
  structureRules: many(salaryStructureRules),
  payslipLines: many(payslipLines),
}));

export const salaryStructureRules = pgTable(
  'salary_structure_rules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    salaryStructureId: uuid('salary_structure_id')
      .notNull()
      .references(() => salaryStructures.id, { onDelete: 'cascade' }),
    salaryRuleId: uuid('salary_rule_id')
      .notNull()
      .references(() => salaryRules.id, { onDelete: 'cascade' }),
    sequenceOverride: integer('sequence_override'),
  },
  (table) => [
    unique('uq_structure_rule').on(table.salaryStructureId, table.salaryRuleId),
  ]
);

export const salaryStructureRulesRelations = relations(
  salaryStructureRules,
  ({ one }) => ({
    salaryStructure: one(salaryStructures, {
      fields: [salaryStructureRules.salaryStructureId],
      references: [salaryStructures.id],
    }),
    salaryRule: one(salaryRules, {
      fields: [salaryStructureRules.salaryRuleId],
      references: [salaryRules.id],
    }),
  })
);
