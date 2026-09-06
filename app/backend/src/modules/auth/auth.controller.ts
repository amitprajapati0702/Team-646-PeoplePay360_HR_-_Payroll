import type { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import { authService, type ClientMetadata } from './auth.service.js';
import httpStatus from '../../utils/http-status.js';
import ApiError from '../../utils/Apierror.js';
import { env } from '../../config/env.js';

const REFRESH_COOKIE_NAME = 'refreshToken';
const ACCESS_COOKIE_NAME = 'accessToken';

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

function getClientMetadata(req: Request): ClientMetadata {
  return {
    userAgent: req.headers['user-agent'],
    ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || req.socket.remoteAddress,
  };
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const clientMeta = getClientMetadata(req);
  const result = await authService.register(req.body, clientMeta);

  // Set cookies for secure web clients
  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  res.cookie(ACCESS_COOKIE_NAME, result.accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'User registered and authenticated successfully.',
    data: result,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const clientMeta = getClientMetadata(req);
  const result = await authService.login(req.body, clientMeta);

  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.cookie(ACCESS_COOKIE_NAME, result.accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Login successful.',
    data: result,
  });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const clientMeta = getClientMetadata(req);
  const token = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;

  if (!token) {
    throw new ApiError({
      statuscode: httpStatus.UNAUTHORIZED,
      message: 'Refresh token is required.',
      errorcode: 'MISSING_REFRESH_TOKEN',
    });
  }

  const result = await authService.refreshToken(token, clientMeta);

  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.cookie(ACCESS_COOKIE_NAME, result.accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Token refreshed successfully.',
    data: result,
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const sessionId = req.user?.sessionId;
  const refreshCookie = req.cookies?.[REFRESH_COOKIE_NAME];

  await authService.logout(sessionId, refreshCookie);

  res.clearCookie(REFRESH_COOKIE_NAME, cookieOptions);
  res.clearCookie(ACCESS_COOKIE_NAME, cookieOptions);

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

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const sessionId = req.user?.sessionId;
  const result = await authService.changePassword(userId, req.body, sessionId);
  res.status(httpStatus.OK).json({
    success: true,
    message: result.message,
  });
});

export const listSessions = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const sessionId = req.user?.sessionId;
  const sessionsList = await authService.listSessions(userId, sessionId);
  res.status(httpStatus.OK).json({
    success: true,
    data: sessionsList,
  });
});

export const revokeSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { sessionId } = req.params;
  const result = await authService.revokeSession(userId, sessionId);
  res.status(httpStatus.OK).json({
    success: true,
    message: result.message,
  });
});

export const revokeAllOtherSessions = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const sessionId = req.user?.sessionId;
  if (!sessionId) {
    throw new ApiError({
      statuscode: httpStatus.BAD_REQUEST,
      message: 'Active session identifier is required.',
      errorcode: 'MISSING_SESSION_ID',
    });
  }
  const result = await authService.revokeAllOtherSessions(userId, sessionId);
  res.status(httpStatus.OK).json({
    success: true,
    message: result.message,
  });
});
