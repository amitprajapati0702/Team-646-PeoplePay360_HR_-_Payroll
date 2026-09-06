'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiResponse } from '@/lib/api-client';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import { CreateUserModal } from '@/components/dashboard/CreateUserModal';
import {
  Users,
  UserCheck,
  Clock,
  UserMinus,
  CalendarCheck,
  Receipt,
  IndianRupee,
  ArrowRight,
  AlertCircle,
  Building2,
  LogIn,
  LogOut,
  UserPlus,
  Lock,
  Plus,
} from 'lucide-react';

interface DashboardKPIs {
  totalEmployees: number;
  activeEmployees: number;
  presentToday: number;
  absentToday: number;
  pendingLeaves: number;
  approvedLeaves: number;
  currentPayrollCost: number;
  totalGrossMonthly?: number;
  totalNetMonthly?: number;
}

interface DepartmentCost {
  department: string;
  code: string;
  totalGross: number;
  totalNet: number;
  employeeCount: number;
  percentage: number;
}

interface DashboardAlert {
  id: string;
  title: string;
  message: string;
  severity: 'warning' | 'error' | 'info';
  link: string;
  linkText: string;
}

interface FullDashboardResponse {
  kpis: DashboardKPIs;
  departmentCost: DepartmentCost[];
  alerts: DashboardAlert[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);

  // RBAC Permission: Only HR Managers and Administrators can add/create new users and employees
  const canManageUsers = !!user && ['HR_MANAGER', 'HR_PAYROLL_MANAGER', 'ADMIN'].includes(user.role);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<FullDashboardResponse>>('/dashboard/summary');
      return res.data;
    },
    refetchInterval: 30000,
  });

  // Live Check-In Mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/attendance/check-in', {});
      return res.data;
    },
    onSuccess: () => {
      toast.success('Successfully checked in for today!');
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Check-in failed';
      toast.error(msg);
    },
  });

  // Live Check-Out Mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/attendance/check-out', {});
      return res.data;
    },
    onSuccess: () => {
      toast.success('Successfully checked out for today!');
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Check-out failed';
      toast.error(msg);
    },
  });

  const kpis = dashboardData?.kpis;
  const deptCost = dashboardData?.departmentCost || [];
  const alerts = dashboardData?.alerts || [];

  return (
    <AppShell
      title="PeoplePay360 Executive Dashboard"
      subtitle="Live enterprise workforce KPIs, real-time database attendance, leave approvals, and payroll costs"
    >
      <div className="space-y-6 max-w-7xl mx-auto text-white pb-12">
        {/* Welcome & Quick Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-zinc-800 bg-[#121215] p-5 shadow-xl">
          <div>
            <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <span>Welcome back, {user?.employee?.firstName || user?.email?.split('@')[0] || 'Administrator'}</span>
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-0.5 text-[10px] font-bold text-zinc-300">
                {user?.role || 'ADMIN'}
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Production Dashboard • System Health Online • All data calculated straight from PostgreSQL
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => checkInMutation.mutate()}
              disabled={checkInMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-800 bg-emerald-950/80 px-3 py-2 text-xs font-bold text-emerald-300 shadow-md hover:bg-emerald-900 transition-all cursor-pointer disabled:opacity-50"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>{checkInMutation.isPending ? 'Punching...' : 'Punch In'}</span>
            </button>
            <button
              onClick={() => checkOutMutation.mutate()}
              disabled={checkOutMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-800 bg-rose-950/80 px-3 py-2 text-xs font-bold text-rose-300 shadow-md hover:bg-rose-900 transition-all cursor-pointer disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{checkOutMutation.isPending ? 'Punching...' : 'Punch Out'}</span>
            </button>
            {canManageUsers ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateUserOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-bold text-white shadow-md hover:bg-zinc-800 transition-all cursor-pointer"
                  title="Provision a new system user login with roles (HR Manager Privilege)"
                >
                  <UserPlus className="h-3.5 w-3.5 text-zinc-300" />
                  <span>Create User</span>
                </button>
                <Link
                  href="/employees/new"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-black shadow-md hover:bg-zinc-200 transition-all cursor-pointer"
                  title="Full Employee Onboarding Form (HR Manager Privilege)"
                >
                  <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Add Employee</span>
                </Link>
              </div>
            ) : (
              <button
                type="button"
                disabled
                title="Access Restricted: Employees cannot add or create new users or employees. Only HR Managers and Administrators have permission."
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800/80 bg-zinc-900/40 px-3 py-2 text-xs font-semibold text-zinc-500 shadow-none cursor-not-allowed opacity-50 select-none"
              >
                <Lock className="h-3.5 w-3.5 text-zinc-500" />
                <span>Add User / Employee</span>
                <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-[9px] font-mono text-zinc-500">HR Only</span>
              </button>
            )}
          </div>
        </div>

        {/* ─── Production Dashboard Layout (Exact LLD Spec) ─── */}
        <div className="space-y-4">
          {/* Row 1: Total Employees & Active Employees */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-zinc-800 bg-[#121215] p-5 shadow-lg flex items-center justify-between hover:border-zinc-700 transition-all">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Employees</span>
                <p className="text-3xl font-black text-white mt-1 font-mono">
                  {isLoading ? '...' : kpis?.totalEmployees ?? 0}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">Master workforce directory in database</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-white">
                <Users className="h-6 w-6" />
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-[#121215] p-5 shadow-lg flex items-center justify-between hover:border-zinc-700 transition-all">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Active Employees</span>
                <p className="text-3xl font-black text-white mt-1 font-mono">
                  {isLoading ? '...' : kpis?.activeEmployees ?? 0}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">Currently on duty with active contracts</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400">
                <UserCheck className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Row 2: Present Today & Absent Today */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-zinc-800 bg-[#121215] p-5 shadow-lg flex items-center justify-between hover:border-zinc-700 transition-all">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Present Today</span>
                <p className="text-3xl font-black text-white mt-1 font-mono">
                  {isLoading ? '...' : kpis?.presentToday ?? 0}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">Recorded daily check-in events</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-blue-400">
                <Clock className="h-6 w-6" />
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-[#121215] p-5 shadow-lg flex items-center justify-between hover:border-zinc-700 transition-all">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Absent Today</span>
                <p className="text-3xl font-black text-white mt-1 font-mono">
                  {isLoading ? '...' : kpis?.absentToday ?? 0}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">Unrecorded or flagged exception status</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-rose-400">
                <UserMinus className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Row 3: Pending Leaves & Approved Leaves */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-zinc-800 bg-[#121215] p-5 shadow-lg flex items-center justify-between hover:border-zinc-700 transition-all">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Pending Leaves</span>
                <p className="text-3xl font-black text-white mt-1 font-mono">
                  {isLoading ? '...' : kpis?.pendingLeaves ?? 0}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">Awaiting manager and HR review</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-amber-400">
                <CalendarCheck className="h-6 w-6" />
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-[#121215] p-5 shadow-lg flex items-center justify-between hover:border-zinc-700 transition-all">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Approved Leaves</span>
                <p className="text-3xl font-black text-white mt-1 font-mono">
                  {isLoading ? '...' : kpis?.approvedLeaves ?? 0}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">Authorized time off requests</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400">
                <CalendarCheck className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Row 4: Current Payroll Cost */}
          <div className="rounded-xl border border-zinc-800 bg-[#121215] p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <IndianRupee className="h-4 w-4 text-emerald-400" />
                  Current Payroll Cost (Monthly Gross)
                </span>
                <p className="text-4xl font-black text-emerald-400 mt-2 font-mono">
                  {isLoading ? '...' : `₹${Number(kpis?.currentPayrollCost ?? 0).toLocaleString('en-IN')}`}
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  Active wage commitments calculated from contract salary schedules & payrun batches
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/payroll"
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-zinc-800 transition-all"
                >
                  <Receipt className="h-4 w-4" />
                  <span>Manage Pay Runs</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Supporting Modules & Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department Cost Distribution */}
          <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-[#121215] p-5 shadow-lg space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Building2 className="h-4 w-4 text-zinc-400" />
              Departmental Payroll Allocation
            </h3>

            <div className="space-y-3">
              {deptCost.length === 0 ? (
                <p className="text-xs text-zinc-500 py-6 text-center">No department payroll commitments found.</p>
              ) : (
                deptCost.map((d) => (
                  <div key={d.code} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-white">
                        {d.department} <span className="font-mono text-zinc-500">({d.code})</span>
                      </span>
                      <span className="font-mono font-bold text-emerald-400">
                        ₹{Number(d.totalGross).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-white transition-all duration-500 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(5, d.percentage))}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Operational Alerts */}
          <div className="rounded-xl border border-zinc-800 bg-[#121215] p-5 shadow-lg space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-400" />
              HR Operations Alerts
            </h3>

            <div className="space-y-2">
              {alerts.length === 0 ? (
                <p className="text-xs text-zinc-500 py-6 text-center">All systems nominal. No pending warnings.</p>
              ) : (
                alerts.map((a) => (
                  <div
                    key={a.id}
                    className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/60 space-y-1 text-xs"
                  >
                    <p className="font-bold text-white">{a.title}</p>
                    <p className="text-zinc-400 text-[11px]">{a.message}</p>
                    <Link
                      href={a.link}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-300 hover:text-white pt-1"
                    >
                      <span>{a.linkText}</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Create User Account Modal (HR Privilege) */}
      <CreateUserModal
        isOpen={isCreateUserOpen}
        onClose={() => setIsCreateUserOpen(false)}
      />
    </AppShell>
  );
}
