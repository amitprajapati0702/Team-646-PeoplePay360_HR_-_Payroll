import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq, and, gt, ne, count } from 'drizzle-orm';
import { db } from '../../infrastructure/database/client.js';
import { users, sessions, employees, departments, jobPositions, workingSchedules } from '../../infrastructure/database/schema/index.js';
import { env } from '../../config/env.js';
import ApiError from '../../utils/Apierror.js';
import httpStatus from '../../utils/http-status.js';
import { getRolePermissions, type UserRole } from './rbac.js';
import type { LoginInput, RegisterInput, ChangePasswordInput } from './auth.schema.js';

export interface JwtAccessTokenPayload {
  sub: string; // user id
  email: string;
  role: string;
  sessionId: string;
  employeeId?: string | null;
}

export interface JwtRefreshTokenPayload {
  sub: string; // user id
  sessionId: string;
  jti: string; // unique token ID for replay prevention
}

export interface ClientMetadata {
  userAgent?: string;
  ipAddress?: string;
}

export class AuthService {
  private hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private parseDurationToMs(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7 days
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 7 * 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Generates paired access token and refresh token for a session.
   */
  private generateTokens(user: { id: string; email: string; role: string }, sessionId: string, employeeId?: string | null) {
    const accessPayload: JwtAccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId,
      employeeId: employeeId ?? null,
    };

    const accessToken = jwt.sign(accessPayload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as jwt.SignOptions);

    const refreshPayload: JwtRefreshTokenPayload = {
      sub: user.id,
      sessionId,
      jti: crypto.randomUUID(),
    };

    const refreshToken = jwt.sign(refreshPayload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    } as jwt.SignOptions);

    return { accessToken, refreshToken };
  }

  /**
   * User Registration Flow
   */
  async register(data: RegisterInput, clientMeta: ClientMetadata = {}) {
    // 1. Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, data.email.toLowerCase()),
    });

    if (existingUser) {
      throw new ApiError({
        statuscode: httpStatus.CONFLICT,
        message: 'A user with this email address already exists.',
        errorcode: 'USER_ALREADY_EXISTS',
      });
    }

    // 2. Determine role: first registered user becomes ADMIN, otherwise requested role or EMPLOYEE
    const userCountResult = await db.select({ count: count() }).from(users);
    const totalUsers = Number(userCountResult[0]?.count ?? 0);
    const assignedRole: UserRole = totalUsers === 0 ? 'ADMIN' : ((data.role as UserRole) || 'EMPLOYEE');

    // 3. Hash password
    const passwordHash = await this.hashPassword(data.password);

    // 4. Create user record
    const [newUser] = await db
      .insert(users)
      .values({
        email: data.email.toLowerCase(),
        passwordHash,
        role: assignedRole,
        isActive: true,
      })
      .returning();

    // 5. Link or auto-create Employee profile if matching email or defaults exist
    let employeeProfile = await db.query.employees.findFirst({
      where: eq(employees.workEmail, data.email.toLowerCase()),
    });

    if (employeeProfile && !employeeProfile.userId) {
      // Link orphan employee record to new user
      const [updatedEmployee] = await db
        .update(employees)
        .set({ userId: newUser.id, updatedAt: new Date() })
        .where(eq(employees.id, employeeProfile.id))
        .returning();
      employeeProfile = updatedEmployee;
    } else if (!employeeProfile) {
      // Find fallback org defaults if available
      const defaultDept = await db.query.departments.findFirst();
      const defaultJob = await db.query.jobPositions.findFirst();
      const defaultSchedule = await db.query.workingSchedules.findFirst();

      if (defaultDept && defaultJob && defaultSchedule) {
        const empCode = `EMP-${Math.floor(10000 + Math.random() * 90000)}`;
        const [createdEmployee] = await db
          .insert(employees)
          .values({
            userId: newUser.id,
            employeeCode: empCode,
            firstName: data.firstName,
            lastName: data.lastName,
            workEmail: data.email.toLowerCase(),
            departmentId: defaultDept.id,
            jobPositionId: defaultJob.id,
            workingScheduleId: defaultSchedule.id,
            joiningDate: new Date().toISOString().split('T')[0],
            status: 'ACTIVE',
            employmentType: 'FULL_TIME',
          })
          .returning();
        employeeProfile = createdEmployee;
      }
    }

    // 6. Create active session
    const sessionId = crypto.randomUUID();
    const { accessToken, refreshToken } = this.generateTokens(newUser, sessionId, employeeProfile?.id);
    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    const refreshExpiryMs = this.parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN);
    const expiresAt = new Date(Date.now() + refreshExpiryMs);

    await db.insert(sessions).values({
      id: sessionId,
      userId: newUser.id,
      refreshTokenHash,
      userAgent: clientMeta.userAgent?.slice(0, 500),
      ipAddress: clientMeta.ipAddress?.slice(0, 100),
      expiresAt,
      isRevoked: false,
    });

    return {
      token: accessToken,
      accessToken,
      refreshToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        permissions: getRolePermissions(newUser.role),
        employee: employeeProfile
          ? {
              id: employeeProfile.id,
              firstName: employeeProfile.firstName,
              lastName: employeeProfile.lastName,
              employeeCode: employeeProfile.employeeCode,
              avatarUrl: employeeProfile.avatarUrl,
            }
          : null,
      },
    };
  }

  /**
   * Login Flow: Authenticates credentials, creates session, and issues dual tokens.
   */
  async login(data: LoginInput, clientMeta: ClientMetadata = {}) {
    // 1. Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, data.email.toLowerCase()),
      with: {
        employee: {
          columns: { id: true, firstName: true, lastName: true, avatarUrl: true, employeeCode: true },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new ApiError({
        statuscode: httpStatus.UNAUTHORIZED,
        message: 'Invalid email or password.',
        errorcode: 'INVALID_CREDENTIALS',
      });
    }

    // 2. Verify password
    const passwordMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!passwordMatch) {
      throw new ApiError({
        statuscode: httpStatus.UNAUTHORIZED,
        message: 'Invalid email or password.',
        errorcode: 'INVALID_CREDENTIALS',
      });
    }

    // 3. Update lastLoginAt
    await db
      .update(users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, user.id));

    // 4. Create session & generate tokens
    const sessionId = crypto.randomUUID();
    const { accessToken, refreshToken } = this.generateTokens(user, sessionId, user.employee?.id);
    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    const refreshExpiryMs = this.parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN);
    const expiresAt = new Date(Date.now() + refreshExpiryMs);

    await db.insert(sessions).values({
      id: sessionId,
      userId: user.id,
      refreshTokenHash,
      userAgent: clientMeta.userAgent?.slice(0, 500),
      ipAddress: clientMeta.ipAddress?.slice(0, 100),
      expiresAt,
      isRevoked: false,
    });

    return {
      token: accessToken,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        permissions: getRolePermissions(user.role),
        employee: user.employee
          ? {
              id: user.employee.id,
              firstName: user.employee.firstName,
              lastName: user.employee.lastName,
              employeeCode: user.employee.employeeCode,
              avatarUrl: user.employee.avatarUrl,
            }
          : null,
      },
    };
  }

  /**
   * Refresh Token Strategy: Validates refresh token, checks session, and performs token rotation.
   */
  async refreshToken(token: string, clientMeta: ClientMetadata = {}) {
    let payload: JwtRefreshTokenPayload;
    try {
      payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtRefreshTokenPayload;
    } catch {
      throw new ApiError({
        statuscode: httpStatus.UNAUTHORIZED,
        message: 'Invalid or expired refresh token. Please sign in again.',
        errorcode: 'REFRESH_TOKEN_EXPIRED',
      });
    }

    const hashedToken = this.hashRefreshToken(token);

    // Find active session in DB
    const session = await db.query.sessions.findFirst({
      where: and(
        eq(sessions.id, payload.sessionId),
        eq(sessions.userId, payload.sub),
        eq(sessions.refreshTokenHash, hashedToken),
        eq(sessions.isRevoked, false),
        gt(sessions.expiresAt, new Date())
      ),
      with: {
        user: {
          with: {
            employee: {
              columns: { id: true, firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
      },
    });

    if (!session || !session.user || !session.user.isActive) {
      throw new ApiError({
        statuscode: httpStatus.UNAUTHORIZED,
        message: 'Session has been invalidated or expired. Please sign in again.',
        errorcode: 'SESSION_REVOKED',
      });
    }

    // Token rotation: Issue new token pair
    const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(
      session.user,
      session.id,
      session.user.employee?.id
    );
    const newHashedToken = this.hashRefreshToken(newRefreshToken);
    const refreshExpiryMs = this.parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN);
    const expiresAt = new Date(Date.now() + refreshExpiryMs);

    await db
      .update(sessions)
      .set({
        refreshTokenHash: newHashedToken,
        userAgent: clientMeta.userAgent?.slice(0, 500) || session.userAgent,
        ipAddress: clientMeta.ipAddress?.slice(0, 100) || session.ipAddress,
        expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, session.id));

    return {
      token: accessToken,
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        permissions: getRolePermissions(session.user.role),
        employee: session.user.employee,
      },
    };
  }

  /**
   * Verifies Access Token
   */
  verifyToken(token: string): JwtAccessTokenPayload {
    try {
      return jwt.verify(token, env.JWT_SECRET) as JwtAccessTokenPayload;
    } catch {
      throw new ApiError({
        statuscode: httpStatus.UNAUTHORIZED,
        message: 'Invalid or expired access token.',
        errorcode: 'TOKEN_INVALID',
      });
    }
  }

  /**
   * Verifies that the session ID is valid and active.
   */
  async validateSession(sessionId: string, userId: string): Promise<boolean> {
    const session = await db.query.sessions.findFirst({
      where: and(
        eq(sessions.id, sessionId),
        eq(sessions.userId, userId),
        eq(sessions.isRevoked, false),
        gt(sessions.expiresAt, new Date())
      ),
    });
    return !!session;
  }

  /**
   * Logout Flow: Revokes the active session.
   */
  async logout(sessionId?: string, refreshTokenString?: string) {
    if (sessionId) {
      await db
        .update(sessions)
        .set({ isRevoked: true, updatedAt: new Date() })
        .where(eq(sessions.id, sessionId));
    } else if (refreshTokenString) {
      const hashed = this.hashRefreshToken(refreshTokenString);
      await db
        .update(sessions)
        .set({ isRevoked: true, updatedAt: new Date() })
        .where(eq(sessions.refreshTokenHash, hashed));
    }
    return { message: 'Logged out successfully.' };
  }

  /**
   * List Active Sessions for current user
   */
  async listSessions(userId: string, currentSessionId?: string) {
    const userSessions = await db.query.sessions.findMany({
      where: and(
        eq(sessions.userId, userId),
        eq(sessions.isRevoked, false),
        gt(sessions.expiresAt, new Date())
      ),
      orderBy: (sessions, { desc }) => [desc(sessions.createdAt)],
    });

    return userSessions.map((s) => ({
      id: s.id,
      userAgent: s.userAgent || 'Unknown Device',
      ipAddress: s.ipAddress || 'Unknown IP',
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isCurrent: s.id === currentSessionId,
    }));
  }

  /**
   * Revoke a specific session (Remote Logout)
   */
  async revokeSession(userId: string, sessionId: string) {
    const session = await db.query.sessions.findFirst({
      where: and(eq(sessions.id, sessionId), eq(sessions.userId, userId)),
    });

    if (!session) {
      throw new ApiError({
        statuscode: httpStatus.NOT_FOUND,
        message: 'Session not found.',
        errorcode: 'SESSION_NOT_FOUND',
      });
    }

    await db
      .update(sessions)
      .set({ isRevoked: true, updatedAt: new Date() })
      .where(eq(sessions.id, sessionId));

    return { message: 'Session revoked successfully.' };
  }

  /**
   * Revoke all sessions for user except current session
   */
  async revokeAllOtherSessions(userId: string, currentSessionId: string) {
    await db
      .update(sessions)
      .set({ isRevoked: true, updatedAt: new Date() })
      .where(and(eq(sessions.userId, userId), ne(sessions.id, currentSessionId)));

    return { message: 'All other sessions revoked successfully.' };
  }

  /**
   * Password Hashing Utility
   */
  async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, 12);
  }

  /**
   * Change Password Flow: Validates current password, updates hash, and revokes other sessions
   */
  async changePassword(userId: string, data: ChangePasswordInput, currentSessionId?: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new ApiError({
        statuscode: httpStatus.NOT_FOUND,
        message: 'User not found.',
        errorcode: 'USER_NOT_FOUND',
      });
    }

    const passwordMatch = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!passwordMatch) {
      throw new ApiError({
        statuscode: httpStatus.BAD_REQUEST,
        message: 'Current password is incorrect.',
        errorcode: 'INVALID_CREDENTIALS',
      });
    }

    const newHash = await this.hashPassword(data.newPassword);
    await db
      .update(users)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(users.id, userId));

    // Security practice: Revoke all other sessions upon password change
    if (currentSessionId) {
      await db
        .update(sessions)
        .set({ isRevoked: true, updatedAt: new Date() })
        .where(and(eq(sessions.userId, userId), ne(sessions.id, currentSessionId)));
    }

    return { message: 'Password updated successfully. Other sessions have been revoked for your security.' };
  }

  /**
   * Get Current User Profile & Permissions
   */
  async getMe(userId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        employee: {
          with: {
            department: true,
            jobPosition: true,
            workingSchedule: true,
            manager: {
              columns: { id: true, firstName: true, lastName: true, employeeCode: true, workEmail: true },
            },
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
      permissions: getRolePermissions(user.role),
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      employee: user.employee ?? null,
    };
  }
}

export const authService = new AuthService();
