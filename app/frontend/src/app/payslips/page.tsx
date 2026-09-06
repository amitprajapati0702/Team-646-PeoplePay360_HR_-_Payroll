'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiResponse } from '@/lib/api-client';
import { useAuth } from '@/providers/AuthProvider';
import {
  Receipt,
  Download,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  FileCheck,
  Building2,
  Briefcase,
  CreditCard,
  X,
  Eye,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PayslipLine {
  id?: string;
  name: string;
  code: string;
  categoryCode: string;
  sequence: number;
  totalAmount: string | number;
}

interface PayslipItem {
  id: string;
  payslipNumber: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  baseWage: string | number;
  grossAmount: string | number;
  deductionAmount: string | number;
  netAmount: string | number;
  plannedWorkingDays?: string | number;
  actualWorkedDays?: string | number;
  isEmailSent?: boolean;
  createdAt: string;
  payrun?: {
    id: string;
    name: string;
    batchCode: string;
    periodStart: string;
    periodEnd: string;
    status: string;
  };
  salaryStructure?: {
    id: string;
    name: string;
  };
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    workEmail: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankRoutingOrIfsc?: string;
    department?: { name: string; code: string };
    jobPosition?: { title: string };
  };
  lines?: PayslipLine[];
}

export default function MyPayslipsPage() {
  const { user } = useAuth();
  const [selectedSlip, setSelectedSlip] = useState<PayslipItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch current employee's payslips
  const { data: payslips = [], isLoading, refetch } = useQuery({
    queryKey: ['my-payslips'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<PayslipItem[]>>('/payslips/my');
      return res.data || [];
    },
  });

  const latestSlip = payslips[0];

  const totalGrossYtd = payslips.reduce((acc, p) => acc + Number(p.grossAmount || 0), 0);
  const totalDeductionsYtd = payslips.reduce((acc, p) => acc + Number(p.deductionAmount || 0), 0);
  const totalNetYtd = payslips.reduce((acc, p) => acc + Number(p.netAmount || 0), 0);

  const handleOpenSlip = (slip: PayslipItem) => {
    setSelectedSlip(slip);
    setIsModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppShell
      title="My Payslips & Compensation"
      subtitle="Access your personal salary statements, itemized earnings, statutory tax/PF deductions, and printable slips."
    >
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-[#121215] p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
              <span>Latest Net Take-Home</span>
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-white font-mono">
              ₹{Number(latestSlip?.netAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              {latestSlip ? `Period: ${latestSlip.payrun?.name || latestSlip.periodStart}` : 'No payslips generated'}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-[#121215] p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
              <span>Gross Earnings (YTD)</span>
              <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-white font-mono">
              ₹{totalGrossYtd.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-1 text-xs text-zinc-500">Across {payslips.length} pay cycles</div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-[#121215] p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
              <span>Total Statutory Deductions</span>
              <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-white font-mono">
              ₹{totalDeductionsYtd.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-1 text-xs text-zinc-500">Provident Fund (12%) + PT + TDS</div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-[#121215] p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
              <span>Payslips on File</span>
              <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
                <FileCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-white font-mono">
              {payslips.length} Records
            </div>
            <div className="mt-1 text-xs text-zinc-500">Official digital payroll statements</div>
          </div>
        </div>

        {/* Payslips History Table */}
        <div className="rounded-2xl border border-zinc-800 bg-[#121215] overflow-hidden shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-zinc-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt className="h-4 w-4 text-indigo-400" />
                Salary Statements & Payslip History
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                All itemized payroll statements computed and disbursed in Indian Rupees (₹)
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="self-start sm:self-auto rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
            >
              Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-zinc-400 text-sm">
              <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3" />
              Loading your salary statements...
            </div>
          ) : payslips.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 text-sm">
              <Receipt className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
              <div className="font-semibold text-zinc-300">No payslips found</div>
              <p className="text-xs text-zinc-500 mt-1">
                Your monthly payslips will appear here as soon as HR/Payroll validates and computes your pay cycle.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-900/60 text-[11px] uppercase tracking-wider text-zinc-400 font-semibold border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">Pay Period / Batch</th>
                    <th className="py-3 px-4">Payslip #</th>
                    <th className="py-3 px-4">Base CTC</th>
                    <th className="py-3 px-4">Gross Earnings</th>
                    <th className="py-3 px-4">Deductions</th>
                    <th className="py-3 px-4">Net Payout</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {payslips.map((slip) => {
                    const isPaid = slip.status === 'PAID';
                    return (
                      <tr key={slip.id} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">
                            {slip.payrun?.name || 'Monthly Cycle'}
                          </div>
                          <div className="text-[11px] text-zinc-500 font-mono">
                            {slip.periodStart} to {slip.periodEnd}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-400">
                          {slip.payslipNumber || slip.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          ₹{Number(slip.baseWage || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 font-mono text-emerald-400 font-semibold">
                          ₹{Number(slip.grossAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 font-mono text-rose-400">
                          -₹{Number(slip.deductionAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-white text-sm">
                          ₹{Number(slip.netAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                              isPaid
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            )}
                          >
                            {isPaid ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                            {slip.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenSlip(slip)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 hover:border-zinc-600 transition-colors cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5 text-indigo-400" />
                            <span>View Slip</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Printable Official Payslip Modal */}
      {isModalOpen && selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-[#121215] p-6 sm:p-8 shadow-2xl border border-zinc-800 my-8 text-white">
            {/* Modal Actions (Hidden on Print) */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6 print:hidden">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print / Save PDF</span>
                </button>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Official Payslip Template */}
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
                    Slip #: {selectedSlip.payslipNumber || selectedSlip.id.slice(0, 10).toUpperCase()}
                  </div>
                  <div className="text-xs text-zinc-400">
                    Pay Period: {selectedSlip.payrun?.name || `${selectedSlip.periodStart} to ${selectedSlip.periodEnd}`}
                  </div>
                </div>
              </div>

              {/* Employee Summary Card */}
              <div className="grid grid-cols-2 gap-4 rounded-xl bg-zinc-900/80 p-4 border border-zinc-800 text-xs">
                <div>
                  <div className="text-zinc-400 uppercase font-semibold text-[10px]">Employee Name</div>
                  <div className="font-bold text-white text-sm mt-0.5">
                    {selectedSlip.employee?.firstName} {selectedSlip.employee?.lastName}
                  </div>
                  <div className="text-zinc-400 uppercase font-semibold text-[10px] mt-2">Employee ID & Code</div>
                  <div className="font-semibold text-zinc-200 font-mono">
                    {selectedSlip.employee?.employeeCode}
                  </div>
                  <div className="text-zinc-400 uppercase font-semibold text-[10px] mt-2">Department & Role</div>
                  <div className="font-semibold text-zinc-300">
                    {selectedSlip.employee?.department?.name || 'Operations'} • {selectedSlip.employee?.jobPosition?.title || 'Staff'}
                  </div>
                </div>

                <div>
                  <div className="text-zinc-400 uppercase font-semibold text-[10px]">Email Address</div>
                  <div className="font-semibold text-zinc-200 mt-0.5">
                    {selectedSlip.employee?.workEmail || user?.email}
                  </div>
                  <div className="text-zinc-400 uppercase font-semibold text-[10px] mt-2">Bank Account & IFSC</div>
                  <div className="font-semibold text-zinc-200 font-mono">
                    {selectedSlip.employee?.bankName || 'HDFC Bank'} • {selectedSlip.employee?.bankAccountNumber || '••••••••1234'}
                    <div className="text-[10px] text-zinc-400 font-mono">
                      IFSC: {selectedSlip.employee?.bankRoutingOrIfsc || 'HDFC0001234'}
                    </div>
                  </div>
                  <div className="text-zinc-400 uppercase font-semibold text-[10px] mt-2">Disbursement Status</div>
                  <div className="font-bold text-emerald-400">
                    {selectedSlip.status}
                  </div>
                </div>
              </div>

              {/* Earnings vs Deductions Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Earnings */}
                <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900/40">
                  <div className="bg-zinc-900 px-4 py-2 border-b border-zinc-800 font-bold text-xs text-white uppercase">
                    Earnings & Allowances
                  </div>
                  <div className="p-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Basic Salary:</span>
                      <span className="font-mono font-semibold text-white">
                        ₹{Number(selectedSlip.baseWage || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {selectedSlip.lines
                      ?.filter((item) => item.categoryCode === 'ALW' || item.categoryCode === 'BASIC')
                      .map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span className="text-zinc-400">{item.name}:</span>
                          <span className="font-mono font-semibold text-white">
                            +₹{Number(item.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}

                    <div className="flex justify-between border-t border-zinc-800 pt-2 font-bold text-white">
                      <span>Gross Earnings:</span>
                      <span className="font-mono text-emerald-400">
                        ₹{Number(selectedSlip.grossAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
                    {selectedSlip.lines
                      ?.filter((item) => item.categoryCode === 'DED')
                      .map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span className="text-zinc-400">{item.name}:</span>
                          <span className="font-mono font-semibold text-rose-400">
                            -₹{Number(item.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}

                    {(!selectedSlip.lines || selectedSlip.lines.length === 0) && (
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Statutory Deductions (PF/Tax):</span>
                        <span className="font-mono font-semibold text-rose-400">
                          -₹{Number(selectedSlip.deductionAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between border-t border-zinc-800 pt-2 font-bold text-white">
                      <span>Total Deductions:</span>
                      <span className="font-mono text-rose-400">
                        -₹{Number(selectedSlip.deductionAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400">
                  ₹{Number(selectedSlip.netAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* Verification Footer */}
              <div className="border-t border-zinc-800 pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-500 gap-2">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>Digitally certified payroll record generated by PeoplePay360.</span>
                </div>
                <div>Questions? Contact payroll@peoplepay360.com</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
