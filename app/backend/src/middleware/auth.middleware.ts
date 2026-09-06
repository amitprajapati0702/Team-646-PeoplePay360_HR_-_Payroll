import type { Request, Response, NextFunction } from 'express';
import { authService } from '../modules/auth/auth.service.js';
import { hasPermission, ROLE_HIERARCHY, type Permission, type UserRole } from '../modules/auth/rbac.js';
import ApiError from '../utils/Apierror.js';
import httpStatus from '../utils/http-status.js';
import '../types/express.d.js';

/**
 * Middleware: Authenticate request via Bearer JWT token or cookie.
 * Validates session active state and attaches user context to req.user.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new ApiError({
        statuscode: httpStatus.UNAUTHORIZED,
        message: 'Authentication required. Please provide a valid access token.',
        errorcode: 'MISSING_TOKEN',
      });
    }

    const payload = authService.verifyToken(token);

    // Validate that session has not been revoked
    if (payload.sessionId) {
      const isSessionActive = await authService.validateSession(payload.sessionId, payload.sub);
      if (!isSessionActive) {
        throw new ApiError({
          statuscode: httpStatus.UNAUTHORIZED,
          message: 'Your session has been terminated or expired. Please sign in again.',
          errorcode: 'SESSION_REVOKED',
        });
      }
    }

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      employeeId: payload.employeeId,
      sessionId: payload.sessionId,
    };

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware factory: Requires the authenticated user to have one of the specified roles.
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new ApiError({
        statuscode: httpStatus.UNAUTHORIZED,
        message: 'Authentication required.',
        errorcode: 'MISSING_TOKEN',
      });
    }

    const userRole = req.user.role as UserRole;
    if (!allowedRoles.includes(userRole)) {
      throw new ApiError({
        statuscode: httpStatus.FORBIDDEN,
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}.`,
        errorcode: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    next();
  };
}

/**
 * Middleware: Requires minimum role level in the hierarchy:
 * ADMIN (5) > HR_PAYROLL_MANAGER (4) > HR_PAYROLL_USER (3) > HR_MANAGER (2) > EMPLOYEE (1)
 */
export function requireMinRole(minimumRole: UserRole) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new ApiError({
        statuscode: httpStatus.UNAUTHORIZED,
        message: 'Authentication required.',
        errorcode: 'MISSING_TOKEN',
      });
    }

    const userLevel = ROLE_HIERARCHY[req.user.role as UserRole] ?? 0;
    const requiredLevel = ROLE_HIERARCHY[minimumRole];

    if (userLevel < requiredLevel) {
      throw new ApiError({
        statuscode: httpStatus.FORBIDDEN,
        message: `Access denied. Minimum required role: ${minimumRole}.`,
        errorcode: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    next();
  };
}

/**
 * Middleware: Fine-grained RBAC permission check.
 * Verifies that the user's role possesses all required permissions.
 */
export function requirePermission(...requiredPermissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new ApiError({
        statuscode: httpStatus.UNAUTHORIZED,
        message: 'Authentication required.',
        errorcode: 'MISSING_TOKEN',
      });
    }

    for (const permission of requiredPermissions) {
      if (!hasPermission(req.user.role, permission)) {
        throw new ApiError({
          statuscode: httpStatus.FORBIDDEN,
          message: `Access denied. You lack the required permission: ${permission}.`,
          errorcode: 'INSUFFICIENT_PERMISSIONS',
        });
      }
    }

    next();
  };
}
