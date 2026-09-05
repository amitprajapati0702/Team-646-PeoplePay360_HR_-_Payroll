export interface SmartBadges {
  contractsCount: number;
  activeContract: {
    id: string;
    contractReference: string;
    wage: string;
    startDate: string;
    endDate: string | null;
    status: string;
  } | null;
  attendancesCountThisMonth: number;
  timeOffAllocatedDays: number;
  timeOffRemainingDays: number;
  pendingTimeOffRequestsCount: number;
  payslipsGeneratedCount: number;
}

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
export type EmployeeStatus = 'PROBATION' | 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED';
export type UserRole = 'EMPLOYEE' | 'HR_MANAGER' | 'HR_PAYROLL_USER' | 'HR_PAYROLL_MANAGER' | 'ADMIN';

export interface EmployeeListItem {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  workEmail: string;
  personalEmail: string | null;
  phone: string | null;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  joiningDate: string;
  avatarUrl: string | null;
  createdAt: string;
  department: {
    id: string;
    name: string;
    code: string;
  } | null;
  jobPosition: {
    id: string;
    title: string;
    code: string;
  } | null;
  workingSchedule: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export interface EmployeeSmartView {
  id: string;
  userId: string | null;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  workEmail: string;
  personalEmail: string | null;
  phone: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  joiningDate: string;
  exitDate: string | null;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  avatarUrl: string | null;

  department: {
    id: string;
    name: string;
    code: string;
  } | null;

  jobPosition: {
    id: string;
    title: string;
    code: string;
  } | null;

  manager: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    workEmail: string;
  } | null;

  workingSchedule: {
    id: string;
    name: string;
    code: string;
    totalWeeklyHours: string;
  } | null;

  bankDetails: {
    bankName: string | null;
    bankAccountNumber: string | null;
    bankRoutingOrIfsc: string | null;
    bankAccountHolderName: string | null;
    hasCompleteBankDetails: boolean;
  };

  smartBadges: SmartBadges;
  createdAt: string;
  updatedAt: string;
}

export interface KanbanGroupItem {
  key: string;
  title: string;
  count: number;
  employees: Array<{
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    fullName: string;
    workEmail: string;
    avatarUrl: string | null;
    jobTitle: string;
    departmentName: string;
    status: EmployeeStatus;
    employmentType: EmploymentType;
  }>;
}

export interface DirectReport {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  status: EmployeeStatus;
  avatarUrl: string | null;
  jobPosition?: { title: string } | null;
  department?: { name: string } | null;
}

export interface ReportingTreeResponse {
  employeeId: string;
  manager: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    workEmail: string;
    avatarUrl: string | null;
  } | null;
  directReportsCount: number;
  directReports: DirectReport[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data: T;
  meta?: PaginationMeta;
}

export interface QueryEmployeesInput {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  jobPositionId?: string;
  status?: EmployeeStatus;
  employmentType?: EmploymentType;
  managerId?: string;
  sortBy?: 'createdAt' | 'firstName' | 'lastName' | 'employeeCode' | 'joiningDate';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateEmployeePayload {
  employeeCode: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  personalEmail?: string | null;
  phone?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  joiningDate: string;
  exitDate?: string | null;
  departmentId: string;
  jobPositionId: string;
  managerId?: string | null;
  workingScheduleId: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankRoutingOrIfsc?: string | null;
  bankAccountHolderName?: string | null;
  avatarUrl?: string | null;
  createUserAccount?: boolean;
  userPassword?: string;
  userRole?: UserRole;
}

export type UpdateEmployeePayload = Partial<
  Omit<CreateEmployeePayload, 'createUserAccount' | 'userPassword' | 'userRole'>
>;

export interface UpdateEmployeeStatusPayload {
  status: EmployeeStatus;
  exitDate?: string | null;
  reason?: string;
}

export interface HealthResponse {
  status: string;
  services?: {
    database: string;
    redis: string;
  };
}

export interface FormOptionsResponse {
  departments: Array<{ id: string; name: string; code: string }>;
  jobPositions: Array<{
    id: string;
    title: string;
    code: string;
    departmentId: string;
  }>;
  workingSchedules: Array<{
    id: string;
    name: string;
    code: string;
    totalWeeklyHours: string;
  }>;
  managers: Array<{
    id: string;
    fullName: string;
    employeeCode: string;
    workEmail: string;
  }>;
}

