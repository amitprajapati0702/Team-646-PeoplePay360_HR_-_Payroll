'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  Clock,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  Filter,
  X,
  Edit2,
  FileSpreadsheet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_BADGES: Record<string, { bg: string; text: string; icon: any }> = {
  PRESENT: { bg: 'bg-emerald-950 text-emerald-300 border-emerald-800', text: 'Present', icon: CheckCircle2 },
  ABSENT: { bg: 'bg-rose-950 text-rose-300 border-rose-800', text: 'Absent', icon: XCircle },
  HALF_DAY: { bg: 'bg-amber-950 text-amber-300 border-amber-800', text: 'Half Day', icon: Clock },
  ON_LEAVE: { bg: 'bg-zinc-900 text-zinc-300 border-zinc-700', text: 'Approved Leave', icon: Calendar },
  HOLIDAY: { bg: 'bg-zinc-900 text-zinc-400 border-zinc-800', text: 'Holiday', icon: CheckCircle2 },
};

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  // Form State for Log Attendance
  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    checkInTime: '09:00',
    checkOutTime: '18:00',
    workedHours: 8,
    overtimeHours: 0,
    status: 'PRESENT',
    notes: '',
  });

  // Correction Form State
  const [correctionData, setCorrectionData] = useState({
    checkInTime: '09:00',
    checkOutTime: '18:00',
    workedHours: 8,
    status: 'PRESENT',
    notes: '',
  });

  // Fetch Attendance Records
  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['attendance', statusFilter, dateFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '100' });
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (dateFilter) params.append('date', dateFilter);
      const res = await apiClient.get<any>(`/attendance?${params.toString()}`);
      return res.data;
    },
  });

  // Fetch Employees
  const { data: employeesData } = useQuery({
    queryKey: ['employees-lookup'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/employees?limit=100');
      return res.data;
    },
  });

  // Create / Record Attendance Mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/attendance', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Attendance recorded successfully');
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to record attendance'),
  });

  // Update / Correct Attendance Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiClient.patch(`/attendance/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Attendance correction saved');
      setIsCorrectionModalOpen(false);
      setSelectedRecord(null);
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update attendance'),
  });

  const records = attendanceData?.attendances || [];
  const employees = employeesData?.employees || [];

  const filteredRecords = records.filter((r: any) => {
    const name = `${r.employee?.firstName} ${r.employee?.lastName}`.toLowerCase();
    return name.includes(searchTerm.toLowerCase()) || r.date?.includes(searchTerm);
  });

  const presentCount = records.filter((r: any) => r.status === 'PRESENT').length;
  const leaveCount = records.filter((r: any) => r.status === 'ON_LEAVE').length;
  const absentCount = records.filter((r: any) => r.status === 'ABSENT').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-white">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Attendance & Work Schedules
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time punch records, worked hours calculation, overtime tracking, and manager attendance corrections.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              employeeId: employees[0]?.id || '',
              date: new Date().toISOString().split('T')[0],
              checkInTime: '09:00',
              checkOutTime: '18:00',
              workedHours: 8,
              overtimeHours: 0,
              status: 'PRESENT',
              notes: '',
            });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-zinc-800 hover:border-zinc-500 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4 text-white" />
          <span>Log Attendance Entry</span>
        </button>
      </div>

      {/* KPI Stats Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-[#121215] p-5 shadow-md">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Present On Duty</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">{presentCount} Entries</div>
          <p className="text-xs text-zinc-400 mt-0.5">Clocked in standard hours</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#121215] p-5 shadow-md">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Approved Time Off</span>
            <Calendar className="h-4 w-4 text-white" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">{leaveCount} Entries</div>
          <p className="text-xs text-zinc-400 mt-0.5">Excused & paid leaves</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#121215] p-5 shadow-md">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Unexcused Absences</span>
            <XCircle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">{absentCount} Entries</div>
          <p className="text-xs text-zinc-400 mt-0.5">Deducted from payroll base</p>
        </div>
      </div>

      {/* Search & Date Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 shadow-md">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search employee or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
            <option value="HALF_DAY">Half Day</option>
            <option value="ON_LEAVE">On Leave</option>
          </select>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-[#121215] shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-900/80">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Employee
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Date
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Clock In / Out
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Worked Hours
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Status
                </th>
                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Correction
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 bg-[#121215]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Loading attendance records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    <Clock className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
                    No attendance logs found matching filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r: any) => {
                  const statusInfo = STATUS_BADGES[r.status] || STATUS_BADGES.PRESENT;
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr key={r.id} className="hover:bg-zinc-900/60 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-700 text-white font-bold text-xs">
                            {r.employee?.firstName?.[0]}
                            {r.employee?.lastName?.[0]}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs">
                              {r.employee?.firstName} {r.employee?.lastName}
                            </div>
                            <div className="text-[10px] text-zinc-400 font-mono">
                              {r.employee?.employeeNumber || r.employee?.employeeCode}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-xs font-medium text-zinc-300 font-mono">
                        {r.date}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-xs text-zinc-400 font-mono">
                        {r.checkInTime || '--:--'} → {r.checkOutTime || '--:--'}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-xs font-semibold text-white">
                        {r.workedHours || 8} hrs {r.overtimeHours ? `(+${r.overtimeHours}h OT)` : ''}
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

                      <td className="px-5 py-3.5 whitespace-nowrap text-right text-xs">
                        <button
                          onClick={() => {
                            setSelectedRecord(r);
                            setCorrectionData({
                              checkInTime: r.checkInTime || '09:00',
                              checkOutTime: r.checkOutTime || '18:00',
                              workedHours: r.workedHours || 8,
                              status: r.status || 'PRESENT',
                              notes: r.notes || '',
                            });
                            setIsCorrectionModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors"
                        >
                          <Edit2 className="h-3 w-3 text-zinc-300" />
                          <span>Correct</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-[#121215] p-6 shadow-2xl border border-zinc-800 text-white">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white">Record Attendance Entry</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(formData);
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

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Check In Time</label>
                  <input
                    type="time"
                    value={formData.checkInTime}
                    onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Check Out Time</label>
                  <input
                    type="time"
                    value={formData.checkOutTime}
                    onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Worked Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.workedHours}
                    onChange={(e) => setFormData({ ...formData, workedHours: Number(e.target.value) })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                  >
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent</option>
                    <option value="HALF_DAY">Half Day</option>
                    <option value="ON_LEAVE">On Leave</option>
                  </select>
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
                  {createMutation.isPending ? 'Logging...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Correction Modal */}
      {isCorrectionModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-[#121215] p-6 shadow-2xl border border-zinc-800 text-white">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Attendance Correction</h3>
                <p className="text-xs text-zinc-400">
                  {selectedRecord.employee?.firstName} {selectedRecord.employee?.lastName} • {selectedRecord.date}
                </p>
              </div>
              <button
                onClick={() => setIsCorrectionModalOpen(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate({ id: selectedRecord.id, data: correctionData });
              }}
              className="mt-4 space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Check In</label>
                  <input
                    type="time"
                    value={correctionData.checkInTime}
                    onChange={(e) => setCorrectionData({ ...correctionData, checkInTime: e.target.value })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Check Out</label>
                  <input
                    type="time"
                    value={correctionData.checkOutTime}
                    onChange={(e) => setCorrectionData({ ...correctionData, checkOutTime: e.target.value })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Worked Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={correctionData.workedHours}
                    onChange={(e) => setCorrectionData({ ...correctionData, workedHours: Number(e.target.value) })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Status</label>
                  <select
                    value={correctionData.status}
                    onChange={(e) => setCorrectionData({ ...correctionData, status: e.target.value })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                  >
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent</option>
                    <option value="HALF_DAY">Half Day</option>
                    <option value="ON_LEAVE">On Leave</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCorrectionModalOpen(false)}
                  className="rounded-lg border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-zinc-800 hover:border-zinc-500 disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Updating...' : 'Save Correction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
