'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Receipt,
  Plus,
  Search,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  Send,
  Download,
  AlertCircle,
  Play,
  Check,
  X,
  FileSpreadsheet,
  ChevronRight,
  TrendingUp,
  MailCheck,
  Building2,
  Users,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';

const STATE_BADGES: Record<string, { bg: string; text: string; icon: any }> = {
  DRAFT: { bg: 'bg-zinc-900 text-zinc-300 border-zinc-700', text: 'Draft Setup', icon: Clock },
  COMPUTED: { bg: 'bg-blue-950 text-blue-300 border-blue-800', text: 'Computed', icon: Play },
  VALIDATED: { bg: 'bg-amber-950 text-amber-300 border-amber-800', text: 'Validated', icon: AlertCircle },
  CONFIRMED: { bg: 'bg-white text-black border-white', text: 'Confirmed', icon: Check },
  PAID: { bg: 'bg-emerald-950 text-emerald-300 border-emerald-800', text: 'Paid & Closed', icon: CheckCircle2 },
  DONE: { bg: 'bg-emerald-950 text-emerald-300 border-emerald-800', text: 'Completed', icon: CheckCircle2 },
  CANCELLED: { bg: 'bg-rose-950 text-rose-300 border-rose-800', text: 'Cancelled', icon: X },
};

export default function PayrollPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);

  // Payrun Wizard Form state
  const [formData, setFormData] = useState({
    name: `Payrun - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
    paymentDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5).toISOString().split('T')[0],
    departmentId: 'ALL',
    selectedEmployeeIds: [] as string[],
  });

  // Fetch all payruns
  const { data: payrunsData, isLoading: isPayrunsLoading } = useQuery({
    queryKey: ['payruns', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      const res = await apiClient.get<any>(`/payruns?${params.toString()}`);
      return res.data;
    },
  });

  // Fetch Employees for Step 2 Selection
  const { data: employeesData } = useQuery({
    queryKey: ['employees-for-payroll', formData.departmentId],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '100', status: 'ACTIVE' });
      if (formData.departmentId !== 'ALL') params.append('departmentId', formData.departmentId);
      const res = await apiClient.get<any>(`/employees?${params.toString()}`);
      return res.data;
    },
    enabled: isWizardOpen,
  });

  // Fetch Departments for Scope filter
  const { data: deptData } = useQuery({
    queryKey: ['departments-lookup'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/organization/departments');
      return res.data;
    },
    enabled: isWizardOpen,
  });

  // Create Payrun Mutation
  const createPayrunMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post<any>('/payruns', data);
      return res.data;
    },
    onSuccess: (res: any) => {
      toast.success('Payrun initialized successfully');
      setIsWizardOpen(false);
      setWizardStep(1);
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
      router.push(`/payroll/${res.id}`);
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to create payrun'),
  });

  // Perform State Transition Action
  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      const res = await apiClient.patch(`/payruns/${id}/action`, { action });
      return res.data;
    },
    onSuccess: (_data, variables) => {
      toast.success(`Payrun ${variables.action.toLowerCase()} executed successfully`);
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
    },
    onError: (err: any) => toast.error(err?.message || 'Action failed'),
  });

  const payruns = payrunsData?.payruns || [];
  const employees = employeesData?.employees || [];
  const departments = deptData?.departments || [];

  const filteredPayruns = payruns.filter((p: any) =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.payrunCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDisbursed = payruns.reduce(
    (acc: number, p: any) =>
      acc + (p.status === 'PAID' || p.status === 'DONE' || p.status === 'CONFIRMED' ? Number(p.totalNet || 0) : 0),
    0
  );

  const toggleSelectAllEmployees = () => {
    if (formData.selectedEmployeeIds.length === employees.length) {
      setFormData({ ...formData, selectedEmployeeIds: [] });
    } else {
      setFormData({ ...formData, selectedEmployeeIds: employees.map((e: any) => e.id) });
    }
  };

  const toggleSelectEmployee = (id: string) => {
    if (formData.selectedEmployeeIds.includes(id)) {
      setFormData({
        ...formData,
        selectedEmployeeIds: formData.selectedEmployeeIds.filter((empId) => empId !== id),
      });
    } else {
      setFormData({ ...formData, selectedEmployeeIds: [...formData.selectedEmployeeIds, id] });
    }
  };

  return (
    <AppShell
      title="Payrun & Batch Payroll Processing"
      subtitle="Two-step batch payroll execution, dynamic rule computation, statutory deductions, and payslip generation."
    >
      <div className="space-y-6 max-w-7xl mx-auto text-white">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Payrun & Batch Payroll Processing
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Two-step batch payroll execution, dynamic rule computation, statutory deductions, and payslip generation.
          </p>
        </div>

        <button
          onClick={() => {
            setWizardStep(1);
            setIsWizardOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-zinc-800 hover:border-zinc-500 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4 text-white" />
          <span>Initialize Payrun Batch</span>
        </button>
      </div>

      {/* KPI Stats Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-[#121215] p-5 shadow-lg">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Payrun Batches</span>
            <Receipt className="h-4 w-4 text-white" />
          </div>
          <div className="mt-2 text-2xl font-black text-white">{payruns.length}</div>
          <p className="text-xs text-zinc-400 mt-0.5">Historical and active cycles</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#121215] p-5 shadow-lg">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Net Disbursed</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white font-mono">
            ₹{totalDisbursed.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">Confirmed & paid payout batches</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#121215] p-5 shadow-lg">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Pipeline</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white">
            {payruns.filter((p: any) => p.status !== 'PAID' && p.status !== 'DONE' && p.status !== 'CANCELLED').length}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">Draft / Computed / Validated cycles</p>
        </div>
      </div>

      {/* Search & Status Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-[#121215] p-3.5 rounded-xl border border-zinc-800 shadow-md">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search payrun cycle or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-zinc-500 focus:border-white focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:border-zinc-700 focus:outline-none"
        >
          <option value="ALL">All Cycle Statuses</option>
          <option value="DRAFT">Draft Setup</option>
          <option value="COMPUTED">Computed</option>
          <option value="VALIDATED">Validated</option>
          <option value="CONFIRMED">Confirmed / Paid</option>
        </select>
      </div>

      {/* Payruns List Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-[#121215] shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-900/80">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Payrun Batch
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Pay Period
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Total Gross
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Deductions
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Total Net Pay
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Cycle State
                </th>
                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 bg-[#121215]">
              {isPayrunsLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Loading payrun batches...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPayruns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    <Receipt className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
                    No payrun cycles found. Click "Initialize Payrun Batch" to start.
                  </td>
                </tr>
              ) : (
                filteredPayruns.map((payrun: any) => {
                  const statusInfo = STATE_BADGES[payrun.status] || STATE_BADGES.DRAFT;
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr key={payrun.id} className="hover:bg-zinc-900/60 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <Link
                          href={`/payroll/${payrun.id}`}
                          className="group flex items-center gap-2 font-bold text-white hover:text-zinc-300 text-xs"
                        >
                          <Receipt className="h-3.5 w-3.5 text-zinc-400 group-hover:text-white" />
                          <span>{payrun.name}</span>
                        </Link>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          Code: {payrun.payrunCode || payrun.id.slice(0, 8)}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-xs text-zinc-300">
                        <div className="flex items-center gap-1 font-mono">
                          <span>{payrun.startDate}</span>
                          <span className="text-zinc-500">→</span>
                          <span>{payrun.endDate}</span>
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          Disbursement: {payrun.paymentDate || 'End of Month'}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-xs font-semibold text-zinc-200 font-mono">
                        ₹{Number(payrun.totalGross || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-xs font-semibold text-zinc-400 font-mono">
                        -₹{Number(payrun.totalDeduction || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-xs font-bold text-white font-mono">
                        ₹{Number(payrun.totalNet || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold',
                            statusInfo.bg
                          )}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.text}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-right text-xs">
                        <div className="flex items-center justify-end gap-1.5">
                          {payrun.status === 'DRAFT' && (
                            <button
                              onClick={() => actionMutation.mutate({ id: payrun.id, action: 'COMPUTE' })}
                              disabled={actionMutation.isPending}
                              className="inline-flex items-center gap-1 rounded-md border border-blue-700 bg-blue-900/80 px-2.5 py-1 text-xs font-bold text-white hover:bg-blue-800 transition-colors cursor-pointer shadow-xs"
                            >
                              <Play className="h-3 w-3 text-white" />
                              Compute
                            </button>
                          )}

                          {payrun.status === 'COMPUTED' && (
                            <button
                              onClick={() => actionMutation.mutate({ id: payrun.id, action: 'VALIDATE' })}
                              disabled={actionMutation.isPending}
                              className="inline-flex items-center gap-1 rounded-md border border-amber-700 bg-amber-900/80 px-2.5 py-1 text-xs font-bold text-white hover:bg-amber-800 transition-colors cursor-pointer shadow-xs"
                            >
                              <Check className="h-3 w-3 text-white" />
                              Validate
                            </button>
                          )}

                          {payrun.status === 'VALIDATED' && (
                            <button
                              onClick={() => actionMutation.mutate({ id: payrun.id, action: 'CONFIRM' })}
                              disabled={actionMutation.isPending}
                              className="inline-flex items-center gap-1 rounded-md border border-emerald-700 bg-emerald-900/80 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-800 transition-colors cursor-pointer shadow-xs"
                            >
                              <CheckCircle2 className="h-3 w-3 text-white" />
                              Confirm
                            </button>
                          )}

                          <Link
                            href={`/payroll/${payrun.id}`}
                            className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                          >
                            <span>Inspect</span>
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2-Step Payrun Creation Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-[#121215] p-6 shadow-2xl border border-zinc-800 text-white animate-in fade-in duration-150">
            {/* Modal Header & Progress */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Payrun Initialization Wizard</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Step {wizardStep} of 2: {wizardStep === 1 ? 'Period & Department Scope' : 'Employee Eligibility Selection'}
                </p>
              </div>
              <button
                onClick={() => setIsWizardOpen(false)}
                className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center justify-between mb-5 px-2">
              <div
                className={cn(
                  'flex items-center gap-2 text-xs font-bold',
                  wizardStep === 1 ? 'text-white' : 'text-zinc-500'
                )}
              >
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                    wizardStep === 1 ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400'
                  )}
                >
                  1
                </div>
                <span>1. Pay Period & Scope</span>
              </div>
              <div className="h-0.5 w-16 bg-zinc-800" />
              <div
                className={cn(
                  'flex items-center gap-2 text-xs font-bold',
                  wizardStep === 2 ? 'text-white' : 'text-zinc-500'
                )}
              >
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                    wizardStep === 2 ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400'
                  )}
                >
                  2
                </div>
                <span>2. Select Employees ({formData.selectedEmployeeIds.length})</span>
              </div>
            </div>

            {/* STEP 1: Period & Scope */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Payrun Batch Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-white focus:border-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Period Start Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-white focus:border-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Period End Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-white focus:border-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Disbursement Date</label>
                    <input
                      type="date"
                      value={formData.paymentDate}
                      onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-white focus:border-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Department Scope</label>
                    <select
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-white focus:outline-none"
                    >
                      <option value="ALL">All Departments (Company-wide)</option>
                      {departments.map((d: any) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsWizardOpen(false)}
                    className="rounded-lg border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.selectedEmployeeIds.length === 0 && employees.length > 0) {
                        setFormData({ ...formData, selectedEmployeeIds: employees.map((e: any) => e.id) });
                      }
                      setWizardStep(2);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 hover:border-zinc-500 transition-all cursor-pointer"
                  >
                    <span>Next: Select Employees</span>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-300" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Employee Selection Table */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-300">
                    Eligible Employees ({employees.length} available)
                  </span>
                  <button
                    type="button"
                    onClick={toggleSelectAllEmployees}
                    className="font-bold text-white hover:underline cursor-pointer"
                  >
                    {formData.selectedEmployeeIds.length === employees.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto rounded-lg border border-zinc-800 divide-y divide-zinc-800 bg-zinc-900/60">
                  {employees.map((emp: any) => {
                    const isSelected = formData.selectedEmployeeIds.includes(emp.id);
                    return (
                      <div
                        key={emp.id}
                        onClick={() => toggleSelectEmployee(emp.id)}
                        className={cn(
                          'flex items-center justify-between p-3 cursor-pointer transition-colors',
                          isSelected ? 'bg-zinc-800/80' : 'hover:bg-zinc-800/40'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-white focus:ring-white"
                          />
                          <div>
                            <div className="text-xs font-bold text-white">
                              {emp.firstName} {emp.lastName}
                            </div>
                            <div className="text-[10px] text-zinc-400 font-mono">
                              {emp.employeeNumber || emp.employeeCode} • {emp.department?.name || 'Staff'}
                            </div>
                          </div>
                        </div>

                        <span className="rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-800">
                          Active Contract
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 px-3.5 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-white"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    disabled={formData.selectedEmployeeIds.length === 0 || createPayrunMutation.isPending}
                    onClick={() => createPayrunMutation.mutate(formData)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-zinc-800 hover:border-zinc-500 disabled:opacity-50 cursor-pointer"
                  >
                    {createPayrunMutation.isPending ? 'Generating Cycle...' : `Create Payrun (${formData.selectedEmployeeIds.length} Staff)`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </AppShell>
  );
}
