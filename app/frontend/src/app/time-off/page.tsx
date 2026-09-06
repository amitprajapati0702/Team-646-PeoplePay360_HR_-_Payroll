'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import {
  CalendarCheck,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  User,
  Check,
  X,
  AlertCircle,
  Layers,
  ChevronRight,
  TrendingDown,
  ShieldCheck,
  Loader2,
  CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppShell } from '@/components/layout/AppShell';

export interface TimeOffType {
  id: string;
  name: string;
  code: string;
  unit: string;
  isPaid: boolean;
  colorCode: string;
  isActive: boolean;
}

export interface TimeOffAllocation {
  id: string;
  employeeId: string;
  timeOffTypeId: string;
  allocatedUnits: string | number;
  takenUnits: string | number;
  validityStart: string;
  validityEnd: string;
  status: string;
  timeOffType?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface TimeOffRequest {
  id: string;
  employeeId: string;
  timeOffTypeId: string;
  startDate: string;
  endDate: string;
  requestedUnits: string | number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REFUSED' | 'CANCELLED';
  reason?: string | null;
  refusalReason?: string | null;
  createdAt: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    employeeNumber?: string;
  };
  timeOffType?: {
    id: string;
    name: string;
    code: string;
    colorCode: string;
  };
}

const STATUS_BADGES: Record<string, { bg: string; text: string; icon: any }> = {
  SUBMITTED: { bg: 'bg-amber-950 border-amber-800 text-amber-300', text: 'Pending Approval', icon: Clock },
  APPROVED: { bg: 'bg-emerald-950 border-emerald-800 text-emerald-300', text: 'Approved', icon: CheckCircle2 },
  REFUSED: { bg: 'bg-rose-950 border-rose-800 text-rose-300', text: 'Rejected', icon: XCircle },
  CANCELLED: { bg: 'bg-zinc-900 border-zinc-800 text-zinc-400', text: 'Cancelled', icon: X },
};

function TimeOffContent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const employeeIdParam = searchParams.get('employeeId') || '';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState(employeeIdParam);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const isHR = ['HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'].includes(user?.role || '');

  useEffect(() => {
    if (employeeIdParam) {
      setSelectedEmployeeFilter(employeeIdParam);
    }
  }, [employeeIdParam]);

  // Form state
  const [formData, setFormData] = useState({
    employeeId: employeeIdParam || user?.employee?.id || '',
    timeOffTypeId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
  });

  // Calculate requested days
  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 1;
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diff);
  };

  // 1. Fetch Leave Types from DB
  const { data: typesResponse } = useQuery({
    queryKey: ['time-off-types'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/time-off/types');
      return res;
    },
  });
  const leaveTypes: TimeOffType[] = (typesResponse?.data || typesResponse?.timeOffTypes || typesResponse || []) as TimeOffType[];

  // 2. Fetch Leave Allocations (Balances)
  const { data: allocationsResponse } = useQuery({
    queryKey: ['time-off-allocations', user?.employee?.id, selectedEmployeeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      const targetEmpId = selectedEmployeeFilter || (!isHR ? user?.employee?.id : undefined);
      if (targetEmpId) {
        params.append('employeeId', targetEmpId);
      }
      const res = await apiClient.get<any>(`/time-off/allocations?${params.toString()}`);
      return res;
    },
  });
  const allocations: TimeOffAllocation[] = (allocationsResponse?.data || allocationsResponse?.allocations || allocationsResponse || []) as TimeOffAllocation[];

  // 3. Fetch Leave Requests
  const { data: requestsResponse, isLoading: isRequestsLoading } = useQuery({
    queryKey: ['time-off-requests', statusFilter, typeFilter, selectedEmployeeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (typeFilter !== 'ALL') params.append('timeOffTypeId', typeFilter);
      const targetEmpId = selectedEmployeeFilter || (!isHR ? user?.employee?.id : undefined);
      if (targetEmpId) params.append('employeeId', targetEmpId);

      const res = await apiClient.get<any>(`/time-off/requests?${params.toString()}`);
      return res;
    },
  });
  const requests: TimeOffRequest[] = (requestsResponse?.data || requestsResponse?.requests || requestsResponse || []) as TimeOffRequest[];

  // 4. Fetch Employees lookup
  const { data: employeesResponse } = useQuery({
    queryKey: ['employees-lookup'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/employees?limit=100');
      return res;
    },
    enabled: isHR,
  });
  const employees = employeesResponse?.data || employeesResponse?.employees || [];

  // 5. Apply Leave Mutation
  const applyMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const requestedUnits = calculateDays(data.startDate, data.endDate);
      const res = await apiClient.post('/time-off/requests', {
        employeeId: data.employeeId,
        timeOffTypeId: data.timeOffTypeId,
        startDate: data.startDate,
        endDate: data.endDate,
        requestedUnits,
        reason: data.reason || undefined,
      });
      return res;
    },
    onSuccess: () => {
      toast.success('Leave application submitted successfully');
      setIsApplyModalOpen(false);
      setFormData({
        employeeId: user?.employee?.id || (employees[0]?.id ?? ''),
        timeOffTypeId: leaveTypes[0]?.id || '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: '',
      });
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      queryClient.invalidateQueries({ queryKey: ['time-off-allocations'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-dashboard'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to submit leave request');
    },
  });

  // 6. Approve Mutation
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch(`/time-off/requests/${id}/action`, { action: 'APPROVE' });
      return res;
    },
    onSuccess: () => {
      toast.success('Leave request approved');
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      queryClient.invalidateQueries({ queryKey: ['time-off-allocations'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-dashboard'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to approve leave request');
    },
  });

  // 7. Refuse Mutation
  const refuseMutation = useMutation({
    mutationFn: async ({ id, refusalReason }: { id: string; refusalReason: string }) => {
      const res = await apiClient.patch(`/time-off/requests/${id}/action`, {
        action: 'REFUSE',
        refusalReason,
      });
      return res;
    },
    onSuccess: () => {
      toast.success('Leave request rejected');
      setIsRejectModalOpen(false);
      setSelectedLeaveId(null);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      queryClient.invalidateQueries({ queryKey: ['time-off-allocations'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-dashboard'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to refuse leave request');
    },
  });

  const filteredRequests = requests.filter((req: TimeOffRequest) => {
    if (selectedEmployeeFilter && req.employeeId !== selectedEmployeeFilter) {
      return false;
    }
    const name = `${req.employee?.firstName} ${req.employee?.lastName}`.toLowerCase();
    const code = (req.employee?.employeeCode || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return name.includes(search) || code.includes(search) || req.reason?.toLowerCase().includes(search);
  });

  const pendingCount = requests.filter((r: TimeOffRequest) => r.status === 'SUBMITTED').length;
  const approvedCount = requests.filter((r: TimeOffRequest) => r.status === 'APPROVED').length;
  const refusedCount = requests.filter((r: TimeOffRequest) => r.status === 'REFUSED').length;

  // Aggregate balance calculations
  const totalAllocated = allocations.reduce((sum: number, a: TimeOffAllocation) => sum + Number(a.allocatedUnits || 0), 0);
  const totalTaken = allocations.reduce((sum: number, a: TimeOffAllocation) => sum + Number(a.takenUnits || 0), 0);
  const totalRemaining = Math.max(0, totalAllocated - totalTaken);

  return (
    <AppShell
      title="Time Off & Leave Management"
      subtitle="Submit leave requests, manage casual/sick/paid allowances, track real balances, and execute manager approvals."
    >
      <div className="space-y-6 max-w-7xl mx-auto text-white pb-12">
        {/* Top Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Time Off & Leave Management</span>
            </h1>
            <span className="rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-emerald-400">
              Module 5
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Submit leave requests, manage casual/sick/paid allowances, track real balances, and execute manager approvals.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              employeeId: selectedEmployeeFilter || user?.employee?.id || (employees[0]?.id ?? ''),
              timeOffTypeId: leaveTypes[0]?.id || '',
              startDate: new Date().toISOString().split('T')[0],
              endDate: new Date().toISOString().split('T')[0],
              reason: '',
            });
            setIsApplyModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-zinc-800 hover:border-zinc-500 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4 text-white" />
          <span>Apply For Leave</span>
        </button>
      </div>

      {/* Leave Balance & Status Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-[#121215] p-5 shadow-md">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Leave Balance</span>
            <CalendarDays className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">
            {totalRemaining} <span className="text-xs font-normal text-zinc-400">Days Left</span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Total: {totalAllocated} | Used: {totalTaken}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#121215] p-5 shadow-md">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Approvals</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">{pendingCount} Requests</div>
          <p className="text-xs text-zinc-400 mt-0.5">Awaiting HR / Manager review</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#121215] p-5 shadow-md">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Approved Leaves</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">{approvedCount} Leaves</div>
          <p className="text-xs text-zinc-400 mt-0.5">Synced with attendance</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#121215] p-5 shadow-md">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total History</span>
            <CalendarCheck className="h-4 w-4 text-white" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">{requests.length} Records</div>
          <p className="text-xs text-zinc-400 mt-0.5">{refusedCount} rejected requests</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 shadow-md">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search employee, ID code, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none"
            />
          </div>

          {selectedEmployeeFilter && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/70 border border-amber-800 text-xs text-amber-300">
              <span>
                Employee:{' '}
                <strong className="text-white">
                  {(() => {
                    const emp = employees.find((e: any) => e.id === selectedEmployeeFilter);
                    return emp ? `${emp.firstName} ${emp.lastName}` : 'Selected';
                  })()}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedEmployeeFilter('')}
                className="p-0.5 hover:bg-amber-800/50 rounded text-zinc-400 hover:text-white transition-colors"
                title="Clear employee filter"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
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
            <option value="REFUSED">Rejected</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white focus:outline-none"
          >
            <option value="ALL">All Leave Types</option>
            {leaveTypes.map((t: TimeOffType) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leave History & Decision Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-[#121215] shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800 text-xs">
            <thead className="bg-zinc-900/80 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="px-5 py-3 text-left">Employee</th>
                <th className="px-5 py-3 text-left">Leave Type</th>
                <th className="px-5 py-3 text-left">Period</th>
                <th className="px-5 py-3 text-center">Days</th>
                <th className="px-5 py-3 text-left">Reason</th>
                <th className="px-5 py-3 text-center">Status</th>
                {isHR && <th className="px-5 py-3 text-right">Workflow Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 bg-[#121215] text-zinc-300">
              {isRequestsLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>Loading leave applications...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    <CalendarCheck className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
                    No leave requests found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req: TimeOffRequest) => {
                  const statusInfo = STATUS_BADGES[req.status] || STATUS_BADGES.SUBMITTED;
                  const StatusIcon = statusInfo.icon;
                  const emp = req.employee;

                  return (
                    <tr key={req.id} className="hover:bg-zinc-900/60 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-700 text-white font-bold text-xs">
                            {emp?.firstName?.[0]}
                            {emp?.lastName?.[0]}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs">
                              {emp?.firstName} {emp?.lastName}
                            </div>
                            <div className="text-[10px] text-zinc-400 font-mono">
                              {emp?.employeeCode || emp?.employeeNumber || 'Linked'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-xs font-semibold text-white">
                          {req.timeOffType?.name || 'Casual Leave'}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-xs text-zinc-300 font-mono">
                        {req.startDate} → {req.endDate}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-center font-bold text-white font-mono">
                        {req.requestedUnits} {Number(req.requestedUnits) === 1 ? 'day' : 'days'}
                      </td>

                      <td className="px-5 py-3.5 text-xs text-zinc-300 max-w-xs truncate">
                        {req.reason || <span className="text-zinc-500 italic">No notes</span>}
                        {req.refusalReason && (
                          <div className="text-[10px] text-rose-400 mt-0.5">Refusal: {req.refusalReason}</div>
                        )}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-center">
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
                          {req.status === 'SUBMITTED' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => approveMutation.mutate(req.id)}
                                disabled={approveMutation.isPending}
                                className="inline-flex items-center gap-1 rounded-md border border-emerald-700 bg-emerald-900/80 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-800 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                              >
                                <Check className="h-3 w-3 text-white" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedLeaveId(req.id);
                                  setIsRejectModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 rounded-md border border-rose-700 bg-rose-900/80 px-2.5 py-1 text-xs font-bold text-white hover:bg-rose-800 transition-colors shadow-xs cursor-pointer"
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
              <h3 className="text-base font-bold text-white">Submit Leave Request</h3>
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
                    {employees.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeNumber || emp.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Leave Category / Type *</label>
                <select
                  required
                  value={formData.timeOffTypeId}
                  onChange={(e) => setFormData({ ...formData, timeOffTypeId: e.target.value })}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                >
                  <option value="" disabled>Select Leave Type</option>
                  {leaveTypes.map((t: TimeOffType) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code})
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

              <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs flex items-center justify-between">
                <span className="text-zinc-400">Calculated Duration:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {calculateDays(formData.startDate, formData.endDate)} {calculateDays(formData.startDate, formData.endDate) === 1 ? 'Day' : 'Days'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Reason / Notes</label>
                <textarea
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="State the reason for this time-off request..."
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
                  disabled={applyMutation.isPending || !formData.timeOffTypeId}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-zinc-800 hover:border-zinc-500 disabled:opacity-50 cursor-pointer"
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
                placeholder="e.g., Staffing constraints during month-end payroll..."
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
                disabled={!rejectionReason.trim() || refuseMutation.isPending}
                onClick={() => {
                  if (selectedLeaveId) {
                    refuseMutation.mutate({ id: selectedLeaveId, refusalReason: rejectionReason });
                  }
                }}
                className="rounded-lg border border-rose-700 bg-rose-900 px-4 py-2 text-xs font-bold text-white hover:bg-rose-800 disabled:opacity-50 cursor-pointer"
              >
                {refuseMutation.isPending ? 'Refusing...' : 'Confirm Refusal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AppShell>
  );
}

export default function TimeOffPage() {
  return (
    <Suspense fallback={<div className="p-8 text-zinc-500 text-sm">Loading time-off records...</div>}>
      <TimeOffContent />
    </Suspense>
  );
}
