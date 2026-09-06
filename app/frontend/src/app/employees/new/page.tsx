'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient, ApiResponse } from '@/lib/api-client';
import { toast } from 'sonner';
import { AppShell } from '@/components/layout/AppShell';
import {
  UserPlus,
  ArrowLeft,
  Building2,
  Briefcase,
  Calendar,
  Phone,
  Mail,
  Lock,
  UserCheck,
  CreditCard,
  Clock,
  Shield,
} from 'lucide-react';
import Link from 'next/link';

interface Department {
  id: string;
  name: string;
  code: string;
}

interface JobPosition {
  id: string;
  title: string;
  code: string;
  departmentId: string;
}

interface Schedule {
  id: string;
  name: string;
  weeklyHours?: number;
}

interface Manager {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode?: string;
}

interface MetadataResponse {
  departments: Department[];
  jobPositions: JobPosition[];
  workingSchedules: Schedule[];
  managers: Manager[];
}

export default function NewEmployeePage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    employeeCode: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
    firstName: '',
    lastName: '',
    workEmail: '',
    personalEmail: '',
    phone: '',
    gender: 'MALE',
    dateOfBirth: '1995-05-15',
    joiningDate: new Date().toISOString().split('T')[0],
    departmentId: '',
    jobPositionId: '',
    managerId: '',
    workingScheduleId: '',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    createUserAccount: true,
    userRole: 'EMPLOYEE',
    userPassword: 'Password@123',
    bankName: '',
    bankAccountNumber: '',
    bankRoutingOrIfsc: '',
    bankAccountHolderName: '',
  });

  // Fetch departments, positions, schedules, and managers
  const { data: metaData, isLoading: isMetaLoading } = useQuery({
    queryKey: ['employee-creation-metadata'],
    queryFn: async () => {
      const [deptRes, jobRes, schedRes, empRes] = await Promise.all([
        apiClient.get<ApiResponse<{ departments: Department[] }>>('/organization/departments'),
        apiClient.get<ApiResponse<{ jobPositions: JobPosition[] }>>('/organization/job-positions'),
        apiClient.get<ApiResponse<{ schedules: Schedule[]; workingSchedules: Schedule[] }>>('/organization/working-schedules'),
        apiClient.get<ApiResponse<{ employees: Manager[]; items: Manager[] }>>('/employees?limit=100'),
      ]);

      const schedules = schedRes.data?.workingSchedules || schedRes.data?.schedules || [];
      const managers = empRes.data?.employees || empRes.data?.items || [];

      return {
        departments: deptRes.data?.departments || [],
        jobPositions: jobRes.data?.jobPositions || [],
        workingSchedules: schedules,
        managers: managers,
      } as MetadataResponse;
    },
  });

  // Automatically select first working schedule when loaded
  React.useEffect(() => {
    if (metaData?.workingSchedules?.length && !formData.workingScheduleId) {
      setFormData((prev) => ({
        ...prev,
        workingScheduleId: metaData.workingSchedules[0].id,
      }));
    }
  }, [metaData, formData.workingScheduleId]);

  // Create Employee Mutation
  const createEmployeeMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const body = {
        ...payload,
        managerId: payload.managerId ? payload.managerId : undefined,
        personalEmail: payload.personalEmail || undefined,
        phone: payload.phone || undefined,
        dateOfBirth: payload.dateOfBirth || undefined,
        bankName: payload.bankName || undefined,
        bankAccountNumber: payload.bankAccountNumber || undefined,
        bankRoutingOrIfsc: payload.bankRoutingOrIfsc || undefined,
        bankAccountHolderName: payload.bankAccountHolderName || undefined,
      };
      const res = await apiClient.post('/employees', body);
      return res.data;
    },
    onSuccess: (data: any) => {
      toast.success('Employee created and onboarded successfully');
      const newId = data?.employee?.id || data?.id;
      if (newId) {
        router.push(`/employees/${newId}`);
      } else {
        router.push('/employees');
      }
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to create employee';
      toast.error(msg);
    },
  });

  const departments = metaData?.departments || [];
  const positions = metaData?.jobPositions || [];
  const schedules = metaData?.workingSchedules || [];
  const managers = metaData?.managers || [];

  // Filter positions by selected department
  const availablePositions = formData.departmentId
    ? positions.filter((p) => p.departmentId === formData.departmentId)
    : positions;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.workEmail) {
      toast.error('First Name, Last Name and Work Email are required');
      return;
    }
    if (!formData.departmentId || !formData.jobPositionId) {
      toast.error('Please assign a Department and Job Position');
      return;
    }
    if (!formData.workingScheduleId && schedules.length > 0) {
      setFormData({ ...formData, workingScheduleId: schedules[0].id });
    }

    createEmployeeMutation.mutate(formData);
  };

  return (
    <AppShell
      title="Create New Employee"
      subtitle="Register employee profile, job designations, work schedule, and initial login access"
    >
      <div className="max-w-4xl mx-auto space-y-6 text-white pb-12">
        {/* Top bar back button */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <Link
            href="/employees"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Employee Directory</span>
          </Link>

          <span className="text-xs font-mono text-zinc-400">
            Assigned Code: <strong className="text-white">{formData.employeeCode}</strong>
          </span>
        </div>

        {isMetaLoading ? (
          <div className="py-20 text-center text-zinc-400">Loading form dependencies...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Personal & Contact Details */}
            <div className="rounded-2xl border border-zinc-800 bg-[#121215] p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
                <UserPlus className="h-4 w-4 text-zinc-400" />
                1. Personal Information & Identity
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Employee Code <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.employeeCode}
                    onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-mono text-white focus:border-zinc-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    First Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="e.g. Rahul"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Last Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="e.g. Sharma"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Work Email <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.workEmail}
                    onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })}
                    placeholder="rahul.sharma@company.com"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-mono text-white focus:border-zinc-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                  >
                    <option value="MALE" className="bg-zinc-900 text-white">Male</option>
                    <option value="FEMALE" className="bg-zinc-900 text-white">Female</option>
                    <option value="OTHER" className="bg-zinc-900 text-white">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Date of Birth (DOB)
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Joining Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 2. Organization, Role & Manager */}
            <div className="rounded-2xl border border-zinc-800 bg-[#121215] p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
                <Briefcase className="h-4 w-4 text-zinc-400" />
                2. Department, Job Position & Reporting Manager
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Department <span className="text-rose-400">*</span>
                  </label>
                  <select
                    required
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                  >
                    <option value="" disabled className="bg-zinc-900 text-zinc-400">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id} className="bg-zinc-900 text-white">
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Job Position / Role <span className="text-rose-400">*</span>
                  </label>
                  <select
                    required
                    value={formData.jobPositionId}
                    onChange={(e) => setFormData({ ...formData, jobPositionId: e.target.value })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                  >
                    <option value="" disabled className="bg-zinc-900 text-zinc-400">Select Job Position</option>
                    {availablePositions.map((p) => (
                      <option key={p.id} value={p.id} className="bg-zinc-900 text-white">
                        {p.title} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Direct Manager
                  </label>
                  <select
                    value={formData.managerId}
                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                  >
                    <option value="" className="bg-zinc-900 text-zinc-400">None / Direct Executive</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id} className="bg-zinc-900 text-white">
                        {m.firstName} {m.lastName} {m.employeeCode ? `(${m.employeeCode})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Work Schedule <span className="text-rose-400">*</span>
                  </label>
                  <select
                    required
                    value={formData.workingScheduleId}
                    onChange={(e) => setFormData({ ...formData, workingScheduleId: e.target.value })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                  >
                    {schedules.map((s) => (
                      <option key={s.id} value={s.id} className="bg-zinc-900 text-white">
                        {s.name} ({s.weeklyHours || 40}h/wk)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Employment Type
                  </label>
                  <select
                    value={formData.employmentType}
                    onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                  >
                    <option value="FULL_TIME" className="bg-zinc-900 text-white">Full-Time</option>
                    <option value="PART_TIME" className="bg-zinc-900 text-white">Part-Time</option>
                    <option value="CONTRACT" className="bg-zinc-900 text-white">Contractor</option>
                    <option value="INTERN" className="bg-zinc-900 text-white">Intern</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Employee Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                  >
                    <option value="ACTIVE" className="bg-zinc-900 text-white">Active</option>
                    <option value="PROBATION" className="bg-zinc-900 text-white">Probation</option>
                    <option value="ON_LEAVE" className="bg-zinc-900 text-white">On Leave</option>
                    <option value="SUSPENDED" className="bg-zinc-900 text-white">Suspended</option>
                    <option value="TERMINATED" className="bg-zinc-900 text-white">Terminated</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 3. User Login & Access Security */}
            <div className="rounded-2xl border border-zinc-800 bg-[#121215] p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Shield className="h-4 w-4 text-zinc-400" />
                  3. System Access & RBAC Role
                </h3>
                <label className="inline-flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.createUserAccount}
                    onChange={(e) => setFormData({ ...formData, createUserAccount: e.target.checked })}
                    className="rounded border-zinc-700 bg-zinc-900 text-white"
                  />
                  <span>Provision Portal Account</span>
                </label>
              </div>

              {formData.createUserAccount && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Security Role (RBAC) <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={formData.userRole}
                      onChange={(e) => setFormData({ ...formData, userRole: e.target.value })}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                    >
                      <option value="EMPLOYEE" className="bg-zinc-900 text-white">EMPLOYEE (Self-Service View)</option>
                      <option value="HR_MANAGER" className="bg-zinc-900 text-white">HR_MANAGER (Manage Staff & Leaves)</option>
                      <option value="HR_PAYROLL_USER" className="bg-zinc-900 text-white">HR_PAYROLL_USER (Process Payroll)</option>
                      <option value="HR_PAYROLL_MANAGER" className="bg-zinc-900 text-white">HR_PAYROLL_MANAGER (Approve Payroll)</option>
                      <option value="ADMIN" className="bg-zinc-900 text-white">ADMIN (Superuser Full Access)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Initial Password <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required={formData.createUserAccount}
                      value={formData.userPassword}
                      onChange={(e) => setFormData({ ...formData, userPassword: e.target.value })}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-mono text-white focus:border-zinc-400 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <Link
                href="/employees"
                className="rounded-lg border border-zinc-800 px-5 py-2.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={createEmployeeMutation.isPending}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-6 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-zinc-800 hover:border-zinc-500 transition-all disabled:opacity-50 cursor-pointer"
              >
                {createEmployeeMutation.isPending ? 'Creating Employee...' : 'Create Employee Profile'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
