import type { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import { authService } from './auth.service.js';
import httpStatus from '../../utils/http-status.js';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Login successful.',
    data: result,
  });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  // JWT is stateless — client discards the token
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Logged out successfully.',
  });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const user = await authService.getMe(userId);
  res.status(httpStatus.OK).json({
    success: true,
    data: user,
  });
});
