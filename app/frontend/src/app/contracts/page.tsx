'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  DollarSign,
  Calendar,
  Building2,
  User,
  ShieldCheck,
  X,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/providers/AuthProvider';

const STATUS_BADGES: Record<string, { bg: string; text: string; icon: any }> = {
  ACTIVE: { bg: 'bg-emerald-950 text-emerald-300 border-emerald-800', text: 'Active Duty', icon: CheckCircle2 },
  DRAFT: { bg: 'bg-zinc-900 text-zinc-300 border-zinc-700', text: 'Draft Terms', icon: Clock },
  EXPIRED: { bg: 'bg-zinc-900 text-zinc-400 border-zinc-800', text: 'Expired', icon: Clock },
  CANCELLED: { bg: 'bg-rose-950 text-rose-300 border-rose-800', text: 'Terminated', icon: X },
};

function ContractsContent() {
  const { user } = useAuth();
  const isEmployee = user?.role === 'EMPLOYEE';
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const employeeIdParam = searchParams.get('employeeId') || '';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState(employeeIdParam);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (employeeIdParam) {
      setSelectedEmployeeFilter(employeeIdParam);
    }
  }, [employeeIdParam]);

  // Form State
  const [formData, setFormData] = useState({
    employeeId: employeeIdParam || '',
    structureId: '',
    scheduleId: '',
    contractType: 'FULL_TIME',
    wage: 5000,
    wageType: 'MONTHLY_FIXED',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'ACTIVE',
    terms: '',
  });

  // Fetch Contracts
  const { data: contractsData, isLoading: isContractsLoading } = useQuery({
    queryKey: ['contracts', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      const res = await apiClient.get<any>(`/contracts?${params.toString()}`);
      return res.data;
    },
  });

  // Fetch Lookups
  const { data: employeesData } = useQuery({
    queryKey: ['employees-lookup'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/employees?limit=100');
      return res.data;
    },
  });

  const { data: structuresData } = useQuery({
    queryKey: ['structures-lookup'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/salary-structures');
      return res.data;
    },
  });

  const { data: schedulesData } = useQuery({
    queryKey: ['schedules-lookup'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/organization/working-schedules');
      return res.data;
    },
  });

  // Create Contract Mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/contracts', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Employment contract created successfully');
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to create contract'),
  });

  const contracts = Array.isArray(contractsData) ? contractsData : (contractsData?.contracts || contractsData?.data || []);
  const employees = Array.isArray(employeesData) ? employeesData : (employeesData?.employees || employeesData?.data || []);
  const structures = Array.isArray(structuresData) ? structuresData : (structuresData?.structures || structuresData?.data || []);
  const schedules = Array.isArray(schedulesData) ? schedulesData : (schedulesData?.workingSchedules || schedulesData?.data || []);

  const filteredContracts = contracts.filter((c: any) => {
    if (selectedEmployeeFilter && c.employeeId !== selectedEmployeeFilter) {
      return false;
    }
    const name = `${c.employee?.firstName || ''} ${c.employee?.lastName || ''}`.toLowerCase();
    const code = (c.contractReference || c.contractCode || c.contractNumber || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return name.includes(search) || code.includes(search);
  });

  const activeContractsCount = contracts.filter((c: any) => c.status === 'ACTIVE').length;
  const totalMonthlyWage = contracts
    .filter((c: any) => c.status === 'ACTIVE')
    .reduce((acc: number, c: any) => acc + Number(c.wage || 0), 0);

  return (
    <AppShell
      title="Contract Management"
      subtitle="Maintain employee contract history, wage agreements in INR (₹), working schedule bindings, and salary structures."
    >
      <div className="space-y-6 max-w-7xl mx-auto text-white">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Contract Management
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Maintain employee contract history, wage agreements, working schedule bindings, and salary structures.
          </p>
        </div>

        {!isEmployee && (
          <button
            onClick={() => {
              setFormData({
                employeeId: selectedEmployeeFilter || employees[0]?.id || '',
                structureId: structures[0]?.id || '',
                scheduleId: schedules[0]?.id || '',
                contractType: 'FULL_TIME',
                wage: 5000,
                wageType: 'MONTHLY_FIXED',
                startDate: new Date().toISOString().split('T')[0],
                endDate: '',
                status: 'ACTIVE',
                terms: '',
              });
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-zinc-800 hover:border-zinc-500 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4 text-white" />
            <span>Create New Contract</span>
          </button>
        )}
      </div>

      {/* KPI Stats Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-[#121215] p-5 shadow-md">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Contracts</span>
            <FileText className="h-4 w-4 text-white" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">{activeContractsCount}</div>
          <p className="text-xs text-zinc-400 mt-0.5">Binding payroll policies</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#121215] p-5 shadow-md">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Contractual Wage</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">
            ₹{totalMonthlyWage.toLocaleString('en-IN', { minimumFractionDigits: 2 })}/mo
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">Base salary commitment</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#121215] p-5 shadow-md">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Records</span>
            <Clock className="h-4 w-4 text-white" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">{contracts.length}</div>
          <p className="text-xs text-zinc-400 mt-0.5">Historical & draft terms</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 shadow-md">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search employee or contract code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none"
            />
          </div>

          {selectedEmployeeFilter && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-800 text-xs text-emerald-300">
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
                className="p-0.5 hover:bg-emerald-800/50 rounded text-zinc-400 hover:text-white transition-colors"
                title="Clear employee filter"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

      {/* Contracts Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-[#121215] shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-900/80">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Employee
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Type & Wage
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Salary Structure
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Working Schedule
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Duration
                </th>
                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 bg-[#121215]">
              {isContractsLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Loading contracts...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    <FileText className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
                    No contracts found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredContracts.map((c: any) => {
                  const statusInfo = STATUS_BADGES[c.status] || STATUS_BADGES.ACTIVE;
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr key={c.id} className="hover:bg-zinc-900/60 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-700 text-white font-bold text-xs">
                            {c.employee?.firstName?.[0]}
                            {c.employee?.lastName?.[0]}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs">
                              {c.employee?.firstName} {c.employee?.lastName}
                            </div>
                            <div className="text-[10px] text-zinc-400 font-mono">
                              {c.contractCode || c.contractNumber || c.id.slice(0, 8)}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-white text-xs font-mono">
                          ₹{Number(c.wage || 0).toLocaleString('en-IN')}/mo
                        </div>
                        <div className="text-[10px] text-zinc-400 uppercase font-semibold">
                          {c.contractType}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-xs text-zinc-300">
                        <span className="font-semibold text-white">
                          {c.salaryStructure?.name || 'Standard Monthly Structure'}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-xs text-zinc-400">
                        <span className="font-mono text-[11px] text-zinc-300">
                          {c.workingSchedule?.name || 'Standard 40h/week'}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-xs text-zinc-400">
                        <div className="flex items-center gap-1 font-mono text-zinc-300">
                          <span>{c.startDate}</span>
                          <span>→</span>
                          <span>{c.endDate || 'Permanent'}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
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
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Contract Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-[#121215] p-6 shadow-2xl border border-zinc-800 text-white">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white">Create Employment Contract</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const selEmp = employees.find((emp: any) => emp.id === formData.employeeId);
                createMutation.mutate({
                  employeeId: formData.employeeId,
                  departmentId: selEmp?.departmentId || undefined,
                  jobPositionId: selEmp?.jobPositionId || undefined,
                  salaryStructureId: formData.structureId,
                  workingScheduleId: formData.scheduleId || selEmp?.workingScheduleId || undefined,
                  wage: Number(formData.wage),
                  contractType: formData.contractType,
                  startDate: formData.startDate,
                  endDate: formData.endDate || null,
                  status: formData.status || 'ACTIVE',
                  notes: formData.terms || null,
                });
              }}
              className="mt-4 space-y-4"
            >
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Monthly Wage (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.wage}
                    onChange={(e) => setFormData({ ...formData, wage: Number(e.target.value) })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-mono text-white focus:border-zinc-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Contract Type</label>
                  <select
                    value={formData.contractType}
                    onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contractor / Fixed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Salary Structure *</label>
                  <select
                    required
                    value={formData.structureId}
                    onChange={(e) => setFormData({ ...formData, structureId: e.target.value })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                  >
                    <option value="" disabled>Select Structure</option>
                    {structures.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Working Schedule *</label>
                  <select
                    required
                    value={formData.scheduleId}
                    onChange={(e) => setFormData({ ...formData, scheduleId: e.target.value })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                  >
                    <option value="" disabled>Select Schedule</option>
                    {schedules.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.hoursPerWeek}h/wk)
                      </option>
                    ))}
                  </select>
                </div>
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
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">End Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-zinc-800 hover:border-zinc-500 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Saving...' : 'Save Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </AppShell>
  );
}

export default function ContractsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-zinc-500 text-sm">Loading contracts...</div>}>
      <ContractsContent />
    </Suspense>
  );
}
