import type { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import { salaryStructuresService } from './salary-structures.service.js';
import httpStatus from '../../utils/http-status.js';

// Categories
export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: await salaryStructuresService.listCategories() });
});
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  res.status(httpStatus.CREATED).json({ success: true, data: await salaryStructuresService.createCategory(req.body) });
});

// Structures
export const listStructures = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await salaryStructuresService.listStructures(req.query as any) });
});
export const getStructureById = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await salaryStructuresService.getStructureById(req.params.id) });
});
export const createStructure = asyncHandler(async (req: Request, res: Response) => {
  res.status(httpStatus.CREATED).json({ success: true, data: await salaryStructuresService.createStructure(req.body) });
});
export const updateStructure = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await salaryStructuresService.updateStructure(req.params.id, req.body) });
});
export const deleteStructure = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await salaryStructuresService.deleteStructure(req.params.id) });
});
export const assignRule = asyncHandler(async (req: Request, res: Response) => {
  res.status(httpStatus.CREATED).json({ success: true, data: await salaryStructuresService.assignRuleToStructure(req.params.id, req.body) });
});
export const removeRule = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await salaryStructuresService.removeRuleFromStructure(req.params.id, req.params.ruleId) });
});

// Rules
export const listRules = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await salaryStructuresService.listRules(req.query as any) });
});
export const getRuleById = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await salaryStructuresService.getRuleById(req.params.id) });
});
export const createRule = asyncHandler(async (req: Request, res: Response) => {
  res.status(httpStatus.CREATED).json({ success: true, data: await salaryStructuresService.createRule(req.body) });
});
export const updateRule = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await salaryStructuresService.updateRule(req.params.id, req.body) });
});
export const deleteRule = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await salaryStructuresService.deleteRule(req.params.id) });
});
