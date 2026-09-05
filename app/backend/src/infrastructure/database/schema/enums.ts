import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role_enum', [
  'EMPLOYEE',
  'HR_MANAGER',
  'HR_PAYROLL_USER',
  'HR_PAYROLL_MANAGER',
  'ADMIN',
]);

export const employeeStatusEnum = pgEnum('employee_status_enum', [
  'PROBATION',
  'ACTIVE',
  'ON_LEAVE',
  'SUSPENDED',
  'TERMINATED',
]);

export const employmentTypeEnum = pgEnum('employment_type_enum', [
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'INTERN',
]);

export const contractStatusEnum = pgEnum('contract_status_enum', [
  'DRAFT',
  'ACTIVE',
  'EXPIRED',
  'TERMINATED',
  'CANCELLED',
]);

export const dayOfWeekEnum = pgEnum('day_of_week_enum', [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]);

export const timeOffUnitEnum = pgEnum('time_off_unit_enum', [
  'DAYS',
  'HOURS',
]);

export const workflowStatusEnum = pgEnum('workflow_status_enum', [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REFUSED',
  'CANCELLED',
]);

export const attendanceStatusEnum = pgEnum('attendance_status_enum', [
  'PRESENT',
  'LATE',
  'HALF_DAY',
  'ABSENT',
  'OVERTIME',
  'EXCEPTION',
]);

export const computationTypeEnum = pgEnum('computation_type_enum', [
  'FIXED',
  'PERCENTAGE',
  'FORMULA',
]);

export const payrunStatusEnum = pgEnum('payrun_status_enum', [
  'DRAFT',
  'COMPUTING',
  'COMPUTED',
  'VALIDATED',
  'PAID',
  'CANCELLED',
]);

export const payslipStatusEnum = pgEnum('payslip_status_enum', [
  'DRAFT',
  'COMPUTED',
  'VALIDATED',
  'PAID',
  'CANCELLED',
  'REJECTED',
]);
