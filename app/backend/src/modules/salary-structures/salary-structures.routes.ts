import { Router } from 'express';
import validateRequest from '../../middleware/validate.middleware.js';
import { authenticate, requireMinRole } from '../../middleware/auth.middleware.js';
import {
  createCategorySchema, createSalaryStructureSchema, updateSalaryStructureSchema,
  createSalaryRuleSchema, updateSalaryRuleSchema, assignRuleToStructureSchema,
  idParamSchema, listQuerySchema,
} from './salary-structures.schema.js';
import {
  listCategories, createCategory,
  listStructures, getStructureById, createStructure, updateStructure, deleteStructure, assignRule, removeRule,
  listRules, getRuleById, createRule, updateRule, deleteRule,
} from './salary-structures.controller.js';

const router: Router = Router();
router.use(authenticate);

// Categories
router.get('/categories', listCategories);
router.post('/categories', requireMinRole('HR_PAYROLL_MANAGER'), validateRequest({ body: createCategorySchema }), createCategory);

// Structures
router.get('/', validateRequest({ query: listQuerySchema }), listStructures);
router.get('/:id', validateRequest({ params: idParamSchema }), getStructureById);
router.post('/', requireMinRole('HR_PAYROLL_MANAGER'), validateRequest({ body: createSalaryStructureSchema }), createStructure);
router.patch('/:id', requireMinRole('HR_PAYROLL_MANAGER'), validateRequest({ params: idParamSchema, body: updateSalaryStructureSchema }), updateStructure);
router.delete('/:id', requireMinRole('ADMIN'), validateRequest({ params: idParamSchema }), deleteStructure);

// Structure ↔ Rule associations
router.post('/:id/rules', requireMinRole('HR_PAYROLL_MANAGER'), validateRequest({ params: idParamSchema, body: assignRuleToStructureSchema }), assignRule);
router.delete('/:id/rules/:ruleId', requireMinRole('HR_PAYROLL_MANAGER'), validateRequest({ params: idParamSchema }), removeRule);

// Rules
router.get('/rules/all', validateRequest({ query: listQuerySchema }), listRules);
router.get('/rules/:id', validateRequest({ params: idParamSchema }), getRuleById);
router.post('/rules', requireMinRole('HR_PAYROLL_MANAGER'), validateRequest({ body: createSalaryRuleSchema }), createRule);
router.patch('/rules/:id', requireMinRole('HR_PAYROLL_MANAGER'), validateRequest({ params: idParamSchema, body: updateSalaryRuleSchema }), updateRule);
router.delete('/rules/:id', requireMinRole('ADMIN'), validateRequest({ params: idParamSchema }), deleteRule);

export default router;
