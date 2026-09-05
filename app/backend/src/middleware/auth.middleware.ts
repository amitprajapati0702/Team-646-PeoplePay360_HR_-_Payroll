import type { Request, Response, NextFunction } from 'express';
import { authService } from '../modules/auth/auth.service.js';
import ApiError from '../utils/Apierror.js';
import httpStatus from '../utils/http-status.js';

// Extend Express Request to carry authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        employeeId?: string | null;
      };
    }
  }
}

type UserRole = 'EMPLOYEE' | 'HR_MANAGER' | 'HR_PAYROLL_USER' | 'HR_PAYROLL_MANAGER' | 'ADMIN';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  EMPLOYEE: 1,
  HR_MANAGER: 2,
  HR_PAYROLL_USER: 3,
  HR_PAYROLL_MANAGER: 4,
  ADMIN: 5,
};

/**
 * Middleware: Authenticate request via Bearer JWT token.
 * Attaches decoded user to req.user.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError({
      statuscode: httpStatus.UNAUTHORIZED,
      message: 'Authentication required. Please provide a valid token.',
      errorcode: 'MISSING_TOKEN',
    });
  }

  const token = authHeader.split(' ')[1];
  const payload = authService.verifyToken(token);

  req.user = {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    employeeId: payload.employeeId,
  };

  next();
}

/**
 * Middleware factory: Requires the authenticated user to have one of the specified roles.
 * Supports minimum-role check (any role >= minimum level passes).
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
 * Middleware: Requires minimum role level (ADMIN > HR_PAYROLL_MANAGER > HR_PAYROLL_USER > HR_MANAGER > EMPLOYEE)
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
