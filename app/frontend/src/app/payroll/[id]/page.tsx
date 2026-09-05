'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  Receipt,
  ArrowLeft,
  Play,
  Check,
  CheckCircle2,
  Mail,
  Printer,
  Download,
  DollarSign,
  Calendar,
  Clock,
  Building2,
  User,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  X,
  FileSpreadsheet,
  Send,
  Loader2,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function PayrunDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const payrunId = params.id as string;

  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);

  // Fetch Payrun Detail with Payslips
  const { data: payrun, isLoading: isPayrunLoading } = useQuery({
    queryKey: ['payrun', payrunId],
    queryFn: async () => {
      const res = await apiClient.get<any>(`/payruns/${payrunId}`);
      return res.data;
    },
  });

  // Action Mutation (COMPUTE, VALIDATE, CONFIRM)
  const actionMutation = useMutation({
    mutationFn: async (action: string) => {
      const res = await apiClient.patch(`/payruns/${payrunId}/action`, { action });
      return res.data;
    },
    onSuccess: (_data, action) => {
      toast.success(`Payrun ${action.toLowerCase()} executed successfully`);
      queryClient.invalidateQueries({ queryKey: ['payrun', payrunId] });
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
    },
    onError: (err: any) => toast.error(err?.message || 'Execution failed'),
  });

  // Bulk Email Mutation
  const bulkEmailMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/payslips/bulk-email/${payrunId}`, {});
      return res.data;
    },
    onSuccess: (data: any) => {
      toast.success(`Emails dispatched! Sent: ${data.sent}, Failed: ${data.failed}`);
      queryClient.invalidateQueries({ queryKey: ['payrun', payrunId] });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to dispatch bulk emails'),
  });

  // Single Email Mutation
  const singleEmailMutation = useMutation({
    mutationFn: async (payslipId: string) => {
      const res = await apiClient.post(`/payslips/${payslipId}/email`, {});
      return res.data;
    },
    onSuccess: () => {
      toast.success('Payslip emailed successfully');
      queryClient.invalidateQueries({ queryKey: ['payrun', payrunId] });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to send email'),
  });

  if (isPayrunLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-2 text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin text-white" />
          <span>Loading payrun cycle details...</span>
        </div>
      </div>
    );
  }

  if (!payrun) {
    return (
      <div className="py-12 text-center text-zinc-400">
        <p>Payrun cycle not found.</p>
        <Link href="/payroll" className="mt-2 text-white font-bold hover:underline">
          Back to Payruns
        </Link>
      </div>
    );
  }

  const payslips = payrun.payslips || [];
  const status = payrun.status || 'DRAFT';

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-white">
      {/* Top Back Navigation & Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/payroll"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">{payrun.name}</h1>
              <span className="rounded bg-zinc-900 border border-zinc-700 px-2 py-0.5 font-mono text-xs font-bold text-zinc-300">
                {payrun.payrunCode || payrun.id.slice(0, 8)}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Period: {payrun.startDate} → {payrun.endDate} | Disbursement Date:{' '}
              {payrun.paymentDate || 'End of Cycle'}
            </p>
          </div>
        </div>

        {/* State Pipeline Actions - All buttons with white text */}
        <div className="flex flex-wrap items-center gap-2">
          {status === 'DRAFT' && (
            <button
              onClick={() => actionMutation.mutate('COMPUTE')}
              disabled={actionMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-700 bg-blue-900/80 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {actionMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              <span>Compute All Salaries</span>
            </button>
          )}

          {status === 'COMPUTED' && (
            <>
              <button
                onClick={() => actionMutation.mutate('COMPUTE')}
                disabled={actionMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
              >
                <Play className="h-3.5 w-3.5" />
                <span>Recompute</span>
              </button>
              <button
                onClick={() => actionMutation.mutate('VALIDATE')}
                disabled={actionMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-700 bg-amber-900/80 px-4 py-2 text-xs font-bold text-white hover:bg-amber-800 disabled:opacity-50 cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Validate Payrun</span>
              </button>
            </>
          )}

          {status === 'VALIDATED' && (
            <button
              onClick={() => actionMutation.mutate('CONFIRM')}
              disabled={actionMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700 bg-emerald-900/80 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Confirm & Settle Payrun</span>
            </button>
          )}

          {(status === 'PAID' || status === 'CONFIRMED' || status === 'DONE') && (
            <button
              onClick={() => bulkEmailMutation.mutate()}
              disabled={bulkEmailMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
            >
              {bulkEmailMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5 text-zinc-300" />
              )}
              <span>Bulk Email Payslips</span>
            </button>
          )}
        </div>
      </div>

      {/* Lifecycle Workflow Bar */}
      <div className="rounded-xl border border-zinc-800 bg-[#121215] p-4 shadow-md">
        <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
          <div className={cn('flex items-center gap-2', status !== 'CANCELLED' ? 'text-white' : '')}>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-black text-[10px] font-bold">
              1
            </div>
            <span>1. Draft Scope</span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
          <div
            className={cn(
              'flex items-center gap-2',
              ['COMPUTED', 'VALIDATED', 'CONFIRMED', 'PAID', 'DONE'].includes(status)
                ? 'text-white'
                : 'text-zinc-500'
            )}
          >
            <div
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                ['COMPUTED', 'VALIDATED', 'CONFIRMED', 'PAID', 'DONE'].includes(status)
                  ? 'bg-white text-black'
                  : 'bg-zinc-800 text-zinc-400'
              )}
            >
              2
            </div>
            <span>2. Computed ({payslips.length} Slips)</span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
          <div
            className={cn(
              'flex items-center gap-2',
              ['VALIDATED', 'CONFIRMED', 'PAID', 'DONE'].includes(status)
                ? 'text-white'
                : 'text-zinc-500'
            )}
          >
            <div
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                ['VALIDATED', 'CONFIRMED', 'PAID', 'DONE'].includes(status)
                  ? 'bg-white text-black'
                  : 'bg-zinc-800 text-zinc-400'
              )}
            >
              3
            </div>
            <span>3. HR Validation</span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
          <div
            className={cn(
              'flex items-center gap-2',
              ['CONFIRMED', 'PAID', 'DONE'].includes(status) ? 'text-white' : 'text-zinc-500'
            )}
          >
            <div
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                ['CONFIRMED', 'PAID', 'DONE'].includes(status)
                  ? 'bg-white text-black'
                  : 'bg-zinc-800 text-zinc-400'
              )}
            >
              4
            </div>
            <span>4. Settle & Deliver</span>
          </div>
        </div>
      </div>

      {/* Payrun Financial Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-[#121215] p-5 shadow-md">
          <div className="text-xs font-semibold uppercase text-zinc-400">Total Gross Pay</div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">
            ₹{Number(payrun.totalGross || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-zinc-400 mt-1">Earnings + Allowances</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#121215] p-5 shadow-md">
          <div className="text-xs font-semibold uppercase text-zinc-400">Statutory Deductions</div>
          <div className="mt-2 text-2xl font-bold text-zinc-300 font-mono">
            -₹{Number(payrun.totalDeduction || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-zinc-400 mt-1">PF + Tax Withholdings</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#121215] p-5 shadow-md">
          <div className="text-xs font-semibold uppercase text-zinc-400">Net Take-Home Pay</div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">
            ₹{Number(payrun.totalNet || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-zinc-400 mt-1">Total Payout</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#121215] p-5 shadow-md">
          <div className="text-xs font-semibold uppercase text-zinc-400">Payslips Status</div>
          <div className="mt-2 text-2xl font-bold text-white">{payslips.length} Generated</div>
          <p className="text-xs text-zinc-400 mt-1">
            {payslips.filter((p: any) => p.emailSent).length} emailed to staff
          </p>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-[#121215] shadow-md">
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Employee Payslip Breakdown</h3>
            <p className="text-xs text-zinc-400">
              Click "View Slip" to inspect detailed line items, formula breakdown, or print official payslip.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-900/80">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Employee
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Basic Wage
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Gross Pay
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Deductions
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Net Salary
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Email
                </th>
                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 bg-[#121215]">
              {payslips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    <Receipt className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
                    No payslips computed yet. Click "Compute All Salaries" above to process this pay cycle.
                  </td>
                </tr>
              ) : (
                payslips.map((slip: any) => (
                  <tr key={slip.id} className="hover:bg-zinc-900/60 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-700 text-white font-bold text-xs">
                          {slip.employee?.firstName?.[0]}
                          {slip.employee?.lastName?.[0]}
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs">
                            {slip.employee?.firstName} {slip.employee?.lastName}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono">
                            {slip.employee?.employeeNumber || slip.employee?.employeeCode}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap text-xs text-zinc-300 font-mono">
                      ₹{Number(slip.basicSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap text-xs font-semibold text-zinc-200 font-mono">
                      ₹{Number(slip.grossSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap text-xs font-semibold text-zinc-400 font-mono">
                      -₹{Number(slip.totalDeductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap text-xs font-bold text-white font-mono">
                      ₹{Number(slip.netSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {slip.emailSent ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-800">
                          <CheckCircle2 className="h-3 w-3" />
                          Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold text-zinc-400 border border-zinc-800">
                          <Clock className="h-3 w-3" />
                          Pending
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap text-right text-xs">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedPayslip(slip);
                            setIsPayslipModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors"
                        >
                          <Printer className="h-3 w-3 text-zinc-300" />
                          <span>View Slip</span>
                        </button>

                        <button
                          onClick={() => singleEmailMutation.mutate(slip.id)}
                          disabled={singleEmailMutation.isPending}
                          title="Send payslip via email"
                          className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors"
                        >
                          <Mail className="h-3 w-3 text-zinc-300" />
                          <span>Email</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Payslip Modal */}
      {isPayslipModalOpen && selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-[#121215] p-8 shadow-2xl border border-zinc-800 my-8 text-white">
            {/* Modal Actions */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6 print:hidden">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  onClick={() => singleEmailMutation.mutate(selectedPayslip.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Email to Employee</span>
                </button>
              </div>

              <button
                onClick={() => setIsPayslipModalOpen(false)}
                className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Official Payslip Layout */}
            <div className="space-y-6">
              {/* Slip Header */}
              <div className="flex items-start justify-between border-b-2 border-zinc-700 pb-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white">PeoplePay360 Inc.</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Enterprise HR & Payroll Platform</p>
                  <p className="text-xs text-zinc-500">support@peoplepay360.com</p>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold uppercase tracking-wider text-white">Official Payslip</div>
                  <div className="text-xs font-mono text-zinc-400 mt-0.5">
                    Slip #: {selectedPayslip.payslipNumber || selectedPayslip.id.slice(0, 10).toUpperCase()}
                  </div>
                  <div className="text-xs text-zinc-400">Pay Period: {payrun.name}</div>
                </div>
              </div>

              {/* Employee Summary Card */}
              <div className="grid grid-cols-2 gap-4 rounded-xl bg-zinc-900/80 p-4 border border-zinc-800 text-xs">
                <div>
                  <div className="text-zinc-400 uppercase font-semibold text-[10px]">Employee Name</div>
                  <div className="font-bold text-white text-sm mt-0.5">
                    {selectedPayslip.employee?.firstName} {selectedPayslip.employee?.lastName}
                  </div>
                  <div className="text-zinc-400 uppercase font-semibold text-[10px] mt-2">Employee ID</div>
                  <div className="font-semibold text-zinc-200 font-mono">
                    {selectedPayslip.employee?.employeeNumber || selectedPayslip.employee?.employeeCode}
                  </div>
                </div>

                <div>
                  <div className="text-zinc-400 uppercase font-semibold text-[10px]">Email Address</div>
                  <div className="font-semibold text-zinc-200 mt-0.5">
                    {selectedPayslip.employee?.email || selectedPayslip.employee?.workEmail}
                  </div>
                  <div className="text-zinc-400 uppercase font-semibold text-[10px] mt-2">Disbursement Date</div>
                  <div className="font-semibold text-zinc-200">
                    {payrun.paymentDate || 'End of Month'}
                  </div>
                </div>
              </div>

              {/* Earnings vs Deductions Breakdown */}
              <div className="grid grid-cols-2 gap-4">
                {/* Earnings */}
                <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900/40">
                  <div className="bg-zinc-900 px-4 py-2 border-b border-zinc-800 font-bold text-xs text-white uppercase">
                    Earnings & Allowances
                  </div>
                  <div className="p-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Basic Base Wage:</span>
                      <span className="font-mono font-semibold text-white">
                        ₹{Number(selectedPayslip.basicSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {selectedPayslip.lineItems
                      ?.filter((item: any) => item.category === 'ALW' || item.category === 'BASIC')
                      .map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between">
                          <span className="text-zinc-400">{item.name}:</span>
                          <span className="font-mono font-semibold text-white">
                            +₹{Number(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}

                    <div className="flex justify-between border-t border-zinc-800 pt-2 font-bold text-white">
                      <span>Gross Earnings:</span>
                      <span className="font-mono text-white">
                        ₹{Number(selectedPayslip.grossSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900/40">
                  <div className="bg-zinc-900 px-4 py-2 border-b border-zinc-800 font-bold text-xs text-white uppercase">
                    Statutory Deductions
                  </div>
                  <div className="p-4 space-y-2 text-xs">
                    {selectedPayslip.lineItems
                      ?.filter((item: any) => item.category === 'DED')
                      .map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between">
                          <span className="text-zinc-400">{item.name}:</span>
                          <span className="font-mono font-semibold text-zinc-300">
                            -₹{Number(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}

                    {(!selectedPayslip.lineItems || selectedPayslip.lineItems.length === 0) && (
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Statutory Tax / PF:</span>
                        <span className="font-mono font-semibold text-zinc-300">
                          -₹{Number(selectedPayslip.totalDeductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between border-t border-zinc-800 pt-2 font-bold text-white">
                      <span>Total Deductions:</span>
                      <span className="font-mono text-zinc-300">
                        -₹{Number(selectedPayslip.totalDeductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Payable Banner */}
              <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5 text-white flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Net Payout Amount</div>
                  <div className="text-xs text-zinc-400 mt-0.5">Direct credit to employee account</div>
                </div>
                <div className="text-3xl font-extrabold font-mono text-white">
                  ₹{Number(selectedPayslip.netSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center text-[10px] text-zinc-500 border-t border-zinc-800/80 pt-4">
                Computer-generated payroll document by PeoplePay360 HR Platform. No physical signature required.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
