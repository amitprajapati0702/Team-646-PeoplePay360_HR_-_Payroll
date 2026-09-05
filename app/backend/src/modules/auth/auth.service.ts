import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../infrastructure/database/client.js';
import { users } from '../../infrastructure/database/schema/index.js';
import { eq } from 'drizzle-orm';
import ApiError from '../../utils/Apierror.js';
import httpStatus from '../../utils/http-status.js';
import type { LoginInput } from './auth.schema.js';

const JWT_SECRET = process.env.JWT_SECRET || 'peoplepay360-super-secret-key-change-in-prod';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: string;
  employeeId?: string | null;
}

export class AuthService {
  async login(data: LoginInput) {
    // 1. Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, data.email.toLowerCase()),
      with: {
        employee: {
          columns: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new ApiError({
        statuscode: httpStatus.UNAUTHORIZED,
        message: 'Invalid credentials or account is inactive.',
        errorcode: 'INVALID_CREDENTIALS',
      });
    }

    // 2. Verify password
    const passwordMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!passwordMatch) {
      throw new ApiError({
        statuscode: httpStatus.UNAUTHORIZED,
        message: 'Invalid credentials.',
        errorcode: 'INVALID_CREDENTIALS',
      });
    }

    // 3. Update lastLoginAt
    await db
      .update(users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, user.id));

    // 4. Generate JWT
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employee?.id ?? null,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employee: user.employee
          ? {
              id: user.employee.id,
              firstName: user.employee.firstName,
              lastName: user.employee.lastName,
              avatarUrl: user.employee.avatarUrl,
            }
          : null,
      },
    };
  }

  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
      throw new ApiError({
        statuscode: httpStatus.UNAUTHORIZED,
        message: 'Invalid or expired token.',
        errorcode: 'TOKEN_INVALID',
      });
    }
  }

  async getMe(userId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        employee: {
          columns: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            departmentId: true,
            jobPositionId: true,
          },
        },
      },
    });

    if (!user) {
      throw new ApiError({
        statuscode: httpStatus.NOT_FOUND,
        message: 'User not found.',
        errorcode: 'USER_NOT_FOUND',
      });
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      employee: user.employee ?? null,
    };
  }

  async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, 12);
  }
}

export const authService = new AuthService();
