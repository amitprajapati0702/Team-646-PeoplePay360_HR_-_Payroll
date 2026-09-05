import type { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import { contractsService } from './contracts.service.js';
import httpStatus from '../../utils/http-status.js';

export const listContracts = asyncHandler(async (req: Request, res: Response) => {
  const data = await contractsService.listContracts(req.query as any);
  res.json({ success: true, data });
});

export const getContractById = asyncHandler(async (req: Request, res: Response) => {
  const data = await contractsService.getContractById(req.params.id);
  res.json({ success: true, data });
});

export const createContract = asyncHandler(async (req: Request, res: Response) => {
  const data = await contractsService.createContract(req.body);
  res.status(httpStatus.CREATED).json({ success: true, data });
});

export const updateContract = asyncHandler(async (req: Request, res: Response) => {
  const data = await contractsService.updateContract(req.params.id, req.body);
  res.json({ success: true, data });
});

export const deleteContract = asyncHandler(async (req: Request, res: Response) => {
  const data = await contractsService.deleteContract(req.params.id);
  res.json({ success: true, data });
});
