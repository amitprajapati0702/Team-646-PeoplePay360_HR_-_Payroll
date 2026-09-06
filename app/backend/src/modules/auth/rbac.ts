export type UserRole = 'EMPLOYEE' | 'HR_MANAGER' | 'HR_PAYROLL_USER' | 'HR_PAYROLL_MANAGER' | 'ADMIN';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  EMPLOYEE: 1,
  HR_MANAGER: 2,
  HR_PAYROLL_USER: 3,
  HR_PAYROLL_MANAGER: 4,
  ADMIN: 5,
};

export const Permissions = {
  // Employee profile & self-service
  EMPLOYEES_VIEW_SELF: 'employees:view:self',
  EMPLOYEES_VIEW_ALL: 'employees:view:all',
  EMPLOYEES_CREATE: 'employees:create',
  EMPLOYEES_UPDATE: 'employees:update',
  EMPLOYEES_DELETE: 'employees:delete',

  // Organization
  ORGANIZATION_VIEW: 'organization:view',
  ORGANIZATION_MANAGE: 'organization:manage',

  // Contracts & Salary Structures
  CONTRACTS_VIEW: 'contracts:view',
  CONTRACTS_MANAGE: 'contracts:manage',
  SALARY_STRUCTURES_VIEW: 'salary_structures:view',
  SALARY_STRUCTURES_MANAGE: 'salary_structures:manage',

  // Attendance
  ATTENDANCE_CLOCK: 'attendance:clock',
  ATTENDANCE_VIEW_SELF: 'attendance:view:self',
  ATTENDANCE_VIEW_ALL: 'attendance:view:all',
  ATTENDANCE_MANAGE: 'attendance:manage',

  // Time-off
  TIME_OFF_REQUEST: 'time_off:request',
  TIME_OFF_VIEW_SELF: 'time_off:view:self',
  TIME_OFF_VIEW_ALL: 'time_off:view:all',
  TIME_OFF_APPROVE: 'time_off:approve',

  // Payroll
  PAYROLL_VIEW_SELF: 'payroll:view:self',
  PAYROLL_VIEW_ALL: 'payroll:view:all',
  PAYROLL_COMPUTE: 'payroll:compute',
  PAYROLL_VALIDATE: 'payroll:validate',
  PAYROLL_PAY: 'payroll:pay',

  // Dashboard & Metrics
  DASHBOARD_VIEW_SELF: 'dashboard:view:self',
  DASHBOARD_VIEW_ALL: 'dashboard:view:all',

  // User Administration & System
  USERS_MANAGE: 'users:manage',
  AUDIT_LOGS_VIEW: 'audit_logs:view',
  SYSTEM_SETTINGS_MANAGE: 'system:settings:manage',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

const EMPLOYEE_PERMISSIONS: Permission[] = [
  Permissions.EMPLOYEES_VIEW_SELF,
  Permissions.ATTENDANCE_CLOCK,
  Permissions.ATTENDANCE_VIEW_SELF,
  Permissions.TIME_OFF_REQUEST,
  Permissions.TIME_OFF_VIEW_SELF,
  Permissions.PAYROLL_VIEW_SELF,
  Permissions.DASHBOARD_VIEW_SELF,
  Permissions.ORGANIZATION_VIEW,
];

const HR_MANAGER_PERMISSIONS: Permission[] = [
  ...EMPLOYEE_PERMISSIONS,
  Permissions.EMPLOYEES_VIEW_ALL,
  Permissions.EMPLOYEES_CREATE,
  Permissions.EMPLOYEES_UPDATE,
  Permissions.ORGANIZATION_MANAGE,
  Permissions.ATTENDANCE_VIEW_ALL,
  Permissions.ATTENDANCE_MANAGE,
  Permissions.TIME_OFF_VIEW_ALL,
  Permissions.TIME_OFF_APPROVE,
  Permissions.DASHBOARD_VIEW_ALL,
  Permissions.CONTRACTS_VIEW,
];

const HR_PAYROLL_USER_PERMISSIONS: Permission[] = [
  ...EMPLOYEE_PERMISSIONS,
  Permissions.EMPLOYEES_VIEW_ALL,
  Permissions.CONTRACTS_VIEW,
  Permissions.SALARY_STRUCTURES_VIEW,
  Permissions.ATTENDANCE_VIEW_ALL,
  Permissions.PAYROLL_VIEW_ALL,
  Permissions.PAYROLL_COMPUTE,
  Permissions.DASHBOARD_VIEW_ALL,
];

const HR_PAYROLL_MANAGER_PERMISSIONS: Permission[] = [
  ...new Set([
    ...HR_MANAGER_PERMISSIONS,
    ...HR_PAYROLL_USER_PERMISSIONS,
    Permissions.CONTRACTS_MANAGE,
    Permissions.SALARY_STRUCTURES_MANAGE,
    Permissions.PAYROLL_VALIDATE,
    Permissions.PAYROLL_PAY,
    Permissions.AUDIT_LOGS_VIEW,
  ]),
];

const ALL_PERMISSIONS = Object.values(Permissions);

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  EMPLOYEE: EMPLOYEE_PERMISSIONS,
  HR_MANAGER: HR_MANAGER_PERMISSIONS,
  HR_PAYROLL_USER: HR_PAYROLL_USER_PERMISSIONS,
  HR_PAYROLL_MANAGER: HR_PAYROLL_MANAGER_PERMISSIONS,
  ADMIN: ALL_PERMISSIONS,
};

/**
 * Checks whether a given role has a specific permission.
 */
export function hasPermission(role: string, permission: Permission): boolean {
  if (role === 'ADMIN') return true;
  const permissions = ROLE_PERMISSIONS[role as UserRole];
  if (!permissions) return false;
  return permissions.includes(permission);
}

/**
 * Returns all permissions assigned to a given role.
 */
export function getRolePermissions(role: string): Permission[] {
  if (role === 'ADMIN') return ALL_PERMISSIONS;
  return ROLE_PERMISSIONS[role as UserRole] || [];
}
