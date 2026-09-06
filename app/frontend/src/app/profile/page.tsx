'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/providers/AuthProvider';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient, ApiResponse } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  User,
  KeyRound,
  Briefcase,
  FileText,
  CalendarCheck,
  Receipt,
  Eye,
  EyeOff,
  Mail,
  Lock,
} from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface EmployeeProfileDetails {
  id?: string;
  firstName?: string;
  lastName?: string;
  employeeCode?: string;
  employeeNumber?: string | null;
  avatarUrl?: string | null;
  department?: { id: string; name: string };
  jobPosition?: { id: string; title: string };
  workingSchedule?: { id: string; name: string };
  manager?: { id: string; firstName: string; lastName: string };
}

interface UserProfileData {
  id: string;
  email: string;
  role: string;
  lastLoginAt?: string | null;
  employee?: EmployeeProfileDetails;
}

interface LeaveRequestItem {
  id: string;
  leaveType?: { id: string; name: string };
  dateFrom: string;
  dateTo: string;
  days: number;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REFUSED' | 'CANCELLED';
}

interface LeaveRequestsResponse {
  items?: LeaveRequestItem[];
  requests?: LeaveRequestItem[];
}

interface ContractItem {
  id: string;
  contractCode: string;
  contractType: string;
  startDate: string;
  endDate?: string | null;
  wage: number;
  status: string;
}

interface ContractsResponse {
  contracts?: ContractItem[];
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Fetch full user profile & employee details
  const { data: profileData } = useQuery({
    queryKey: ['auth-me'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<UserProfileData>>('/auth/me');
      return res.data;
    },
  });

  // Fetch employee's own leave requests
  const { data: leaveRequestsData } = useQuery({
    queryKey: ['my-leave-requests'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<LeaveRequestsResponse>>('/time-off/requests');
      return res.data;
    },
  });

  // Fetch employee's own contracts
  const { data: contractsData } = useQuery({
    queryKey: ['my-contracts'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<ContractsResponse>>('/contracts');
      return res.data;
    },
  });

  // Fetch employee's own payslips
  const { data: myPayslips = [] } = useQuery({
    queryKey: ['my-payslips'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<any[]>>('/payslips/my');
      return res.data || [];
    },
  });

  // Change Password Mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiClient.patch('/auth/change-password', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to update password';
      toast.error(message);
    },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  const userEmail = profileData?.email || user?.email || '';
  const userRole = profileData?.role || user?.role || 'EMPLOYEE';
  const lastLogin = profileData?.lastLoginAt;
  const emp = profileData?.employee || (user?.employee as EmployeeProfileDetails | undefined);
  const leaveRequests: LeaveRequestItem[] =
    leaveRequestsData?.items || leaveRequestsData?.requests || [];
  const contracts: ContractItem[] = contractsData?.contracts || [];

  return (
    <AppShell
      title="My User Profile & Security"
      subtitle="Manage your personal identity, login credentials, work assignments, and employment records"
    >
      <div className="max-w-5xl mx-auto space-y-6 text-white">
        {/* Profile Card Header */}
        <div className="rounded-2xl border border-zinc-800 bg-[#121215] p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-700 text-white font-black text-2xl shadow-inner">
                {emp?.firstName?.[0] || userEmail[0]?.toUpperCase() || 'U'}
                {emp?.lastName?.[0] || ''}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    {emp?.firstName ? `${emp.firstName} ${emp.lastName}` : userEmail}
                  </h1>
                  <span className="rounded-full bg-zinc-900 border border-zinc-700 px-3 py-0.5 text-xs font-bold text-zinc-200">
                    {userRole}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 flex items-center gap-2">
                  <span>{emp?.jobPosition?.title || 'Team Member'}</span>
                  <span>•</span>
                  <span>{emp?.department?.name || 'Operations'}</span>
                  <span>•</span>
                  <span className="font-mono text-zinc-300">
                    {emp?.employeeCode || emp?.employeeNumber || userEmail}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-mono text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Session Active
              </span>
            </div>
          </div>
        </div>

        {/* Tabbed View */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid grid-cols-5 bg-zinc-900 border border-zinc-800 p-1 rounded-xl mb-6">
            <TabsTrigger
              value="details"
              className="text-xs font-bold data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400"
            >
              <User className="h-3.5 w-3.5 mr-1.5" />
              <span>Details</span>
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="text-xs font-bold data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400"
            >
              <KeyRound className="h-3.5 w-3.5 mr-1.5" />
              <span>Password</span>
            </TabsTrigger>
            <TabsTrigger
              value="leaves"
              className="text-xs font-bold data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400"
            >
              <CalendarCheck className="h-3.5 w-3.5 mr-1.5" />
              <span>My Leaves</span>
            </TabsTrigger>
            <TabsTrigger
              value="contracts"
              className="text-xs font-bold data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400"
            >
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              <span>Contracts</span>
            </TabsTrigger>
            <TabsTrigger
              value="payslips"
              className="text-xs font-bold data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400"
            >
              <Receipt className="h-3.5 w-3.5 mr-1.5" />
              <span>My Payslips</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Profile & Employment Details */}
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Account Identity */}
              <div className="rounded-xl border border-zinc-800 bg-[#121215] p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-zinc-400" />
                  Account Identity
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-zinc-800/60">
                    <span className="text-zinc-400">Login Email:</span>
                    <span className="font-bold text-white font-mono">{userEmail}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-zinc-800/60">
                    <span className="text-zinc-400">Security Role:</span>
                    <span className="font-bold text-white">{userRole}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-zinc-800/60">
                    <span className="text-zinc-400">Account Status:</span>
                    <span className="font-bold text-emerald-400">Active</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-zinc-400">Last Login:</span>
                    <span className="font-mono text-zinc-300">
                      {lastLogin ? new Date(lastLogin).toLocaleString() : 'Current Session'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Organization & Work Assignment */}
              <div className="rounded-xl border border-zinc-800 bg-[#121215] p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-zinc-400" />
                  Work & Organization Assignment
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-zinc-800/60">
                    <span className="text-zinc-400">Department:</span>
                    <span className="font-bold text-white">{emp?.department?.name || 'Operations'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-zinc-800/60">
                    <span className="text-zinc-400">Designation:</span>
                    <span className="font-bold text-white">{emp?.jobPosition?.title || 'Staff'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-zinc-800/60">
                    <span className="text-zinc-400">Schedule:</span>
                    <span className="font-bold text-white">{emp?.workingSchedule?.name || 'Standard 40h/week'}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-zinc-400">Direct Manager:</span>
                    <span className="font-bold text-white">
                      {emp?.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : 'Direct Executive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: Security & Password Update */}
          <TabsContent value="security" className="space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-[#121215] p-6 shadow-md max-w-xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                <Lock className="h-4 w-4 text-zinc-300" />
                Change Account Password
              </h3>
              <p className="text-xs text-zinc-400 mb-5">
                Update your login credentials. Must be at least 6 characters.
              </p>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Current Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      required
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer"
                    >
                      {showCurrentPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    New Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Min 6 characters"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer"
                    >
                      {showNewPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Confirm New Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      required
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Repeat new password"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer"
                    >
                      {showConfirmPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={changePasswordMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-zinc-800 hover:border-zinc-500 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </TabsContent>

          {/* TAB 3: My Leaves & Time Off Requests */}
          <TabsContent value="leaves" className="space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-[#121215] p-5 shadow-md">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                My Leave Requests & Balance History
              </h3>

              <div className="overflow-x-auto rounded-lg border border-zinc-800">
                <table className="min-w-full divide-y divide-zinc-800 text-xs">
                  <thead className="bg-zinc-900/80 text-[11px] font-bold uppercase text-zinc-400">
                    <tr>
                      <th className="px-4 py-2.5 text-left">Leave Type</th>
                      <th className="px-4 py-2.5 text-left">Dates</th>
                      <th className="px-4 py-2.5 text-center">Days</th>
                      <th className="px-4 py-2.5 text-left">Reason</th>
                      <th className="px-4 py-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 bg-[#121215]">
                    {leaveRequests.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-zinc-400">
                          No leave requests recorded. Click &quot;Time Off &amp; Leaves&quot; to apply.
                        </td>
                      </tr>
                    ) : (
                      leaveRequests.map((req: LeaveRequestItem) => (
                        <tr key={req.id} className="hover:bg-zinc-900/60">
                          <td className="px-4 py-3 font-bold text-white">
                            {req.leaveType?.name || 'Paid Time Off'}
                          </td>
                          <td className="px-4 py-3 font-mono text-zinc-300">
                            {req.dateFrom} → {req.dateTo}
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-white">
                            {req.days}
                          </td>
                          <td className="px-4 py-3 text-zinc-400 max-w-xs truncate">
                            {req.reason || 'Personal'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={cn(
                                'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border',
                                req.status === 'APPROVED'
                                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                  : req.status === 'REFUSED'
                                  ? 'bg-rose-950 text-rose-300 border-rose-800'
                                  : 'bg-zinc-900 text-zinc-300 border-zinc-700'
                              )}
                            >
                              {req.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: My Contracts & Wage */}
          <TabsContent value="contracts" className="space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-[#121215] p-5 shadow-md">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                Employment Contracts & Wage Commitments
              </h3>

              <div className="overflow-x-auto rounded-lg border border-zinc-800">
                <table className="min-w-full divide-y divide-zinc-800 text-xs">
                  <thead className="bg-zinc-900/80 text-[11px] font-bold uppercase text-zinc-400">
                    <tr>
                      <th className="px-4 py-2.5 text-left">Contract Code</th>
                      <th className="px-4 py-2.5 text-left">Type</th>
                      <th className="px-4 py-2.5 text-left">Duration</th>
                      <th className="px-4 py-2.5 text-right">Monthly Gross Wage</th>
                      <th className="px-4 py-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 bg-[#121215]">
                    {contracts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-zinc-400">
                          No contracts assigned.
                        </td>
                      </tr>
                    ) : (
                      contracts.map((con: ContractItem) => (
                        <tr key={con.id} className="hover:bg-zinc-900/60">
                          <td className="px-4 py-3 font-mono font-bold text-white">
                            {con.contractCode}
                          </td>
                          <td className="px-4 py-3 font-bold text-zinc-300">
                            {con.contractType}
                          </td>
                          <td className="px-4 py-3 font-mono text-zinc-400 text-[11px]">
                            {con.startDate} → {con.endDate || 'Indefinite'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                            ₹{Number(con.wage || 0).toLocaleString('en-IN')}/mo
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center rounded-full bg-emerald-950 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-800">
                              {con.status || 'ACTIVE'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* TAB 5: My Payslips */}
          <TabsContent value="payslips" className="space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-[#121215] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-indigo-400" />
                    My Salary Statements & Payslips
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Official payslips generated and disbursed for your employment
                  </p>
                </div>
                <Link
                  href="/payslips"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors"
                >
                  <Eye className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Full Payslip Portal</span>
                </Link>
              </div>

              <div className="overflow-x-auto rounded-lg border border-zinc-800">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-zinc-800 bg-zinc-900/80 font-bold uppercase tracking-wider text-[10px] text-zinc-400">
                    <tr>
                      <th className="px-4 py-3">Pay Period</th>
                      <th className="px-4 py-3">Slip #</th>
                      <th className="px-4 py-3 text-right">Gross (₹)</th>
                      <th className="px-4 py-3 text-right">Deductions (₹)</th>
                      <th className="px-4 py-3 text-right">Net Pay (₹)</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 bg-[#121215]">
                    {myPayslips.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs text-zinc-400">
                          No payslips generated yet.
                        </td>
                      </tr>
                    ) : (
                      myPayslips.map((slip: any) => (
                        <tr key={slip.id} className="hover:bg-zinc-900/60">
                          <td className="px-4 py-3 font-semibold text-white">
                            {slip.payrun?.name || `${slip.periodStart} - ${slip.periodEnd}`}
                          </td>
                          <td className="px-4 py-3 font-mono text-zinc-400 text-[11px]">
                            {slip.payslipNumber || slip.id.slice(0, 8).toUpperCase()}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-emerald-400">
                            ₹{Number(slip.grossAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-rose-400">
                            -₹{Number(slip.deductionAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-white">
                            ₹{Number(slip.netAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center rounded-full bg-emerald-950 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-800">
                              {slip.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href="/payslips"
                              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
                            >
                              View Slip →
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
