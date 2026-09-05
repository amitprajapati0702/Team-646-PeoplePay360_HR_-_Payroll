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
  employmentType: string;
  status: string;
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
  createdAt: Date;
  updatedAt: Date;
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
    status: string;
    employmentType: string;
  }>;
}
