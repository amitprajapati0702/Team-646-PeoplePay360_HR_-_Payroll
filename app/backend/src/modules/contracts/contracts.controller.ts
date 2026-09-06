import type { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import { contractsService } from './contracts.service.js';
import { ContractQueryInput } from './contracts.schema.js';
import httpStatus from '../../utils/http-status.js';

export const listContracts = asyncHandler(async (req: Request, res: Response) => {
  const query: ContractQueryInput = { ...(req.query as unknown as ContractQueryInput) };
  if (req.user?.role === 'EMPLOYEE' && req.user.employeeId) {
    query.employeeId = req.user.employeeId;
  }
  const data = await contractsService.listContracts(query);
  res.json({ success: true, message: 'Contracts fetched successfully', data });
});

export const getContractById = asyncHandler(async (req: Request, res: Response) => {
  const data = await contractsService.getContractById(req.params.id);
  res.json({ success: true, message: 'Contract retrieved', data });
});

export const createContract = asyncHandler(async (req: Request, res: Response) => {
  const data = await contractsService.createContract(req.body);
  res.status(httpStatus.CREATED).json({ success: true, message: 'Contract created successfully', data });
});

export const updateContract = asyncHandler(async (req: Request, res: Response) => {
  const data = await contractsService.updateContract(req.params.id, req.body);
  res.json({ success: true, message: 'Contract updated successfully', data });
});

export const deleteContract = asyncHandler(async (req: Request, res: Response) => {
  const data = await contractsService.deleteContract(req.params.id);
  res.json({ success: true, message: 'Contract deleted successfully', data });
});
