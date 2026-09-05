'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import {
  CalendarCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  User,
  Check,
  X,
  AlertCircle,
  FileText,
  ChevronRight,
  TrendingDown,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const LEAVE_TYPES = [
  { id: 'PAID', label: 'Paid Leave', color: 'bg-zinc-900 text-white border-zinc-700' },
  { id: 'UNPAID', label: 'Unpaid Leave', color: 'bg-zinc-900 text-zinc-400 border-zinc-800' },
  { id: 'SICK', label: 'Sick Leave', color: 'bg-blue-950 text-blue-300 border-blue-800' },
  { id: 'CASUAL', label: 'Casual Leave', color: 'bg-zinc-900 text-zinc-300 border-zinc-700' },
  { id: 'MATERNITY', label: 'Maternity Leave', color: 'bg-purple-950 text-purple-300 border-purple-800' },
  { id: 'PATERNITY', label: 'Paternity Leave', color: 'bg-indigo-950 text-indigo-300 border-indigo-800' },
];

const STATUS_BADGES: Record<string, { bg: string; text: string; icon: any }> = {
  SUBMITTED: { bg: 'bg-amber-950 border-amber-800 text-amber-300', text: 'Pending Approval', icon: Clock },
  APPROVED: { bg: 'bg-emerald-950 border-emerald-800 text-emerald-300', text: 'Approved', icon: CheckCircle2 },
  REJECTED: { bg: 'bg-rose-950 border-rose-800 text-rose-300', text: 'Rejected', icon: XCircle },
  CANCELLED: { bg: 'bg-zinc-900 border-zinc-800 text-zinc-400', text: 'Cancelled', icon: X },
};

export default function TimeOffPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    employeeId: user?.employee?.id || '',
    leaveType: 'PAID',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const isHR = ['HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'].includes(user?.role || '');

  // Fetch Leave Requests
  const { data: leavesData, isLoading: isLeavesLoading } = useQuery({
    queryKey: ['leaves', statusFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (typeFilter !== 'ALL') params.append('leaveType', typeFilter);
      if (!isHR && user?.employee?.id) params.append('employeeId', user.employee.id);
      
      const res = await apiClient.get<any>(`/leaves?${params.toString()}`);
      return res.data;
    },
  });

  // Fetch Employees for dropdown
  const { data: employeesData } = useQuery({
    queryKey: ['employees-lookup'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/employees?limit=100');
      return res.data;
    },
    enabled: isHR,
  });

  // Apply Leave Mutation
  const applyMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/leaves', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Leave request submitted successfully');
      setIsApplyModalOpen(false);
      setFormData({
        employeeId: user?.employee?.id || '',
        leaveType: 'PAID',
        startDate: '',
        endDate: '',
        reason: '',
      });
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to submit leave request');
    },
  });

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch(`/leaves/${id}/approve`, {});
      return res.data;
    },
    onSuccess: () => {
      toast.success('Leave request approved');
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to approve leave');
    },
  });

  // Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await apiClient.patch(`/leaves/${id}/reject`, { rejectionReason: reason });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Leave request rejected');
      setIsRejectModalOpen(false);
      setSelectedLeaveId(null);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to reject leave');
    },
  });

  const leaves = leavesData?.leaves || [];

  const filteredLeaves = leaves.filter((leave: any) => {
    const employeeName = `${leave.employee?.firstName} ${leave.employee?.lastName}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return employeeName.includes(search) || leave.reason?.toLowerCase().includes(search);
  });

  const pendingCount = leaves.filter((l: any) => l.status === 'SUBMITTED').length;
  const approvedCount = leaves.filter((l: any) => l.status === 'APPROVED').length;
  const rejectedCount = leaves.filter((l: any) => l.status === 'REJECTED').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-white">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Time Off & Leave Management
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Request, track, and approve employee leaves with automated balance calculations and attendance sync.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              employeeId: user?.employee?.id || (employeesData?.employees?.[0]?.id ?? ''),
              leaveType: 'PAID',
              startDate: '',
              endDate: '',
              reason: '',
            });
            setIsApplyModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-zinc-800 hover:border-zinc-500 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4 text-white" />
          <span>Request Time Off</span>
        </button>
      </div>

      {/* KPI Stats Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-[#121215] p-5 shadow-md">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Requests</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">{pendingCount} Requests</div>
          <p className="text-xs text-zinc-400 mt-0.5">Awaiting manager review</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#121215] p-5 shadow-md">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Approved This Month</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">{approvedCount} Leaves</div>
          <p className="text-xs text-zinc-400 mt-0.5">Deducted from balance</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#121215] p-5 shadow-md">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Applications</span>
            <CalendarCheck className="h-4 w-4 text-white" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">{leaves.length} Total</div>
          <p className="text-xs text-zinc-400 mt-0.5">{rejectedCount} rejected requests</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 shadow-md">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search employee or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white focus:outline-none"
          >
            <option value="ALL">All Leave Types</option>
            {LEAVE_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leaves Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-[#121215] shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-900/80">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Employee
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Type
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Duration
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Days
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Reason
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Status
                </th>
                {isHR && (
                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Decision
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 bg-[#121215]">
              {isLeavesLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Loading leave requests...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    <CalendarCheck className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
                    No leave requests found matching filters.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave: any) => {
                  const statusInfo = STATUS_BADGES[leave.status] || STATUS_BADGES.SUBMITTED;
                  const StatusIcon = statusInfo.icon;
                  const leaveTypeObj = LEAVE_TYPES.find((t) => t.id === leave.leaveType);

                  return (
                    <tr key={leave.id} className="hover:bg-zinc-900/60 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-700 text-white font-bold text-xs">
                            {leave.employee?.firstName?.[0]}
                            {leave.employee?.lastName?.[0]}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs">
                              {leave.employee?.firstName} {leave.employee?.lastName}
                            </div>
                            <div className="text-[10px] text-zinc-400 font-mono">
                              {leave.employee?.employeeNumber || leave.employee?.employeeCode}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold',
                            leaveTypeObj?.color || 'bg-zinc-900 text-zinc-300 border-zinc-700'
                          )}
                        >
                          {leaveTypeObj?.label || leave.leaveType}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-xs text-zinc-300 font-mono">
                        {leave.startDate} → {leave.endDate}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-xs font-bold text-white">
                        {leave.daysCount} {leave.daysCount === 1 ? 'day' : 'days'}
                      </td>

                      <td className="px-5 py-3.5 text-xs text-zinc-300 max-w-xs truncate">
                        {leave.reason || <span className="text-zinc-500 italic">None provided</span>}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                            statusInfo.bg
                          )}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.text}
                        </span>
                      </td>

                      {isHR && (
                        <td className="px-5 py-3.5 whitespace-nowrap text-right text-xs">
                          {leave.status === 'SUBMITTED' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => approveMutation.mutate(leave.id)}
                                disabled={approveMutation.isPending}
                                className="inline-flex items-center gap-1 rounded-md border border-emerald-700 bg-emerald-900/80 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-800 transition-colors shadow-xs"
                              >
                                <Check className="h-3 w-3 text-white" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedLeaveId(leave.id);
                                  setIsRejectModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 rounded-md border border-rose-700 bg-rose-900/80 px-2.5 py-1 text-xs font-bold text-white hover:bg-rose-800 transition-colors shadow-xs"
                              >
                                <X className="h-3 w-3 text-white" />
                                <span>Refuse</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-500 italic">Decided</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-[#121215] p-6 shadow-2xl border border-zinc-800 text-white">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white">Request Time Off</h3>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                applyMutation.mutate(formData);
              }}
              className="mt-4 space-y-4"
            >
              {isHR && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Employee *</label>
                  <select
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                  >
                    <option value="" disabled>Select Employee</option>
                    {employeesData?.employees?.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeNumber || emp.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Leave Type *</label>
                <select
                  required
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                >
                  {LEAVE_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Reason / Notes</label>
                <textarea
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Context for this leave..."
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="rounded-lg border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applyMutation.isPending}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-zinc-800 hover:border-zinc-500 disabled:opacity-50"
                >
                  {applyMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Note Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-[#121215] p-6 shadow-2xl border border-zinc-800 text-white">
            <h3 className="text-base font-bold text-white">Refuse Leave Request</h3>
            <p className="text-xs text-zinc-400 mt-1">Specify reason for refusal.</p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Refusal Reason *</label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Conflict with payrun cycle coverage..."
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800 mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setSelectedLeaveId(null);
                  setRejectionReason('');
                }}
                className="rounded-lg border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rejectionReason.trim() || rejectMutation.isPending}
                onClick={() => {
                  if (selectedLeaveId) {
                    rejectMutation.mutate({ id: selectedLeaveId, reason: rejectionReason });
                  }
                }}
                className="rounded-lg border border-rose-700 bg-rose-900 px-4 py-2 text-xs font-bold text-white hover:bg-rose-800 disabled:opacity-50"
              >
                {rejectMutation.isPending ? 'Refusing...' : 'Confirm Refusal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
