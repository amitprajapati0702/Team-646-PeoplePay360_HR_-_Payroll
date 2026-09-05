'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmployeeStatusBadge, EmploymentTypeBadge } from './EmployeeStatusBadge';
import { useEmployee } from '@/hooks/use-employees';
import {
  Mail,
  Phone,
  Calendar,
  Building,
  Briefcase,
  Clock,
  CreditCard,
  FileText,
  CalendarCheck,
  Receipt,
  UserCheck,
  GitFork,
  Pencil,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import type { EmployeeListItem } from '@/types/employee';

interface EmployeeDetailDrawerProps {
  employeeId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (employee: EmployeeListItem) => void;
  onStatusChange?: (employee: EmployeeListItem) => void;
  onHierarchy?: (employee: EmployeeListItem) => void;
  onDelete?: (employee: EmployeeListItem) => void;
}

export function EmployeeDetailDrawer({
  employeeId,
  isOpen,
  onClose,
  onEdit,
  onStatusChange,
  onHierarchy,
  onDelete,
}: EmployeeDetailDrawerProps) {
  const { data: employee, isLoading } = useEmployee(employeeId);

  if (!employeeId) return null;

  const asListItem: EmployeeListItem | null = employee
    ? {
        id: employee.id,
        employeeCode: employee.employeeCode,
        firstName: employee.firstName,
        lastName: employee.lastName,
        fullName: employee.fullName,
        workEmail: employee.workEmail,
        personalEmail: employee.personalEmail,
        phone: employee.phone,
        employmentType: employee.employmentType,
        status: employee.status,
        joiningDate: employee.joiningDate,
        avatarUrl: employee.avatarUrl,
        createdAt: employee.createdAt,
        department: employee.department,
        jobPosition: employee.jobPosition,
        workingSchedule: employee.workingSchedule,
      }
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Employee Smart View</DialogTitle>
        </DialogHeader>
        {isLoading || !employee ? (
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Header Profile Banner */}
            <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white rounded-t-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl ring-4 ring-white/10 shadow-xl">
                    <AvatarImage src={employee.avatarUrl || ''} />
                    <AvatarFallback className="bg-indigo-600 font-bold text-lg sm:text-xl text-white">
                      {employee.firstName[0]}
                      {employee.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                        {employee.fullName}
                      </h2>
                      <EmployeeStatusBadge
                        status={employee.status}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center gap-2">
                      <span>{employee.jobPosition?.title || 'Job Title'}</span>
                      <span>•</span>
                      <span>{employee.department?.name || 'Department'}</span>
                      <span>•</span>
                      <span className="font-mono text-indigo-300">
                        {employee.employeeCode}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {asListItem && onEdit && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onEdit(asListItem)}
                      className="bg-white/10 hover:bg-white/20 text-white border-0 text-xs"
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                  )}
                  {asListItem && onStatusChange && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onStatusChange(asListItem)}
                      className="bg-white/10 hover:bg-white/20 text-white border-0 text-xs"
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      Status
                    </Button>
                  )}
                  {asListItem && onHierarchy && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onHierarchy(asListItem)}
                      className="bg-white/10 hover:bg-white/20 text-white border-0 text-xs"
                    >
                      <GitFork className="h-3.5 w-3.5 mr-1" />
                      Tree
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Smart Badges KPI Summary with Direct Filter Links */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 bg-zinc-50 border-b border-zinc-200">
              <a
                href={`/contracts?employeeId=${employee.id}`}
                className="group p-3.5 rounded-xl bg-white border border-zinc-200 hover:border-zinc-900 hover:shadow-xs transition-all text-left block"
                title="View Employee Contracts"
              >
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-[11px] font-semibold text-zinc-500">Active Contract</span>
                  <FileText className="h-3.5 w-3.5 text-zinc-900 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-sm font-bold text-zinc-950">
                  {employee.smartBadges?.activeContract
                    ? `₹${Number(employee.smartBadges.activeContract.wage).toLocaleString('en-IN')}/mo`
                    : 'No Contract'}
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5 group-hover:text-zinc-950 transition-colors">
                  {employee.smartBadges?.contractsCount || 0} records →
                </p>
              </a>

              <a
                href={`/attendance?employeeId=${employee.id}`}
                className="group p-3.5 rounded-xl bg-white border border-zinc-200 hover:border-zinc-900 hover:shadow-xs transition-all text-left block"
                title="View Employee Attendance Logs"
              >
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-[11px] font-semibold text-zinc-500">Attendance</span>
                  <UserCheck className="h-3.5 w-3.5 text-zinc-900 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-sm font-bold text-zinc-950">
                  {employee.smartBadges?.attendancesCountThisMonth || 0} Days
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5 group-hover:text-zinc-950 transition-colors">
                  Logs & Punches →
                </p>
              </a>

              <a
                href={`/time-off?employeeId=${employee.id}`}
                className="group p-3.5 rounded-xl bg-white border border-zinc-200 hover:border-zinc-900 hover:shadow-xs transition-all text-left block"
                title="View Employee Leave History & Balance"
              >
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-[11px] font-semibold text-zinc-500">Time Off Balance</span>
                  <CalendarCheck className="h-3.5 w-3.5 text-zinc-900 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-sm font-bold text-zinc-950">
                  {employee.smartBadges?.timeOffRemainingDays ?? 0} Days Left
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5 group-hover:text-zinc-950 transition-colors">
                  {employee.smartBadges?.timeOffAllocatedDays ?? 0} allocated →
                </p>
              </a>

              <a
                href="/payroll"
                className="group p-3.5 rounded-xl bg-white border border-zinc-200 hover:border-zinc-900 hover:shadow-xs transition-all text-left block"
                title="View Employee Payslips"
              >
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-[11px] font-semibold text-zinc-500">Payslip Archive</span>
                  <Receipt className="h-3.5 w-3.5 text-zinc-900 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-sm font-bold text-zinc-950">
                  {employee.smartBadges?.payslipsGeneratedCount || 0} Generated
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5 group-hover:text-zinc-950 transition-colors">
                  View Payruns →
                </p>
              </a>
            </div>

            {/* Tabbed Profile Sections */}
            <div className="p-6">
              <Tabs defaultValue="work" className="w-full">
                <TabsList className="grid grid-cols-3 mb-6 bg-slate-100 p-1 rounded-xl">
                  <TabsTrigger value="work" className="rounded-lg text-xs">
                    Work & Organization
                  </TabsTrigger>
                  <TabsTrigger value="personal" className="rounded-lg text-xs">
                    Personal Details
                  </TabsTrigger>
                  <TabsTrigger value="bank" className="rounded-lg text-xs">
                    Bank & Payroll
                  </TabsTrigger>
                </TabsList>

                {/* 1. Work & Organization Tab */}
                <TabsContent value="work" className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                      <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-slate-400" />
                        Department
                      </p>
                      <p className="text-xs font-semibold text-slate-900">
                        {employee.department?.name || 'Not Assigned'}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400">
                        Code: {employee.department?.code || 'N/A'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                      <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                        Job Position
                      </p>
                      <p className="text-xs font-semibold text-slate-900">
                        {employee.jobPosition?.title || 'Not Assigned'}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400">
                        Code: {employee.jobPosition?.code || 'N/A'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                      <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        Working Schedule
                      </p>
                      <p className="text-xs font-semibold text-slate-900">
                        {employee.workingSchedule?.name || 'Standard 40h'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {employee.workingSchedule?.totalWeeklyHours || '40.00'} hrs / week
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                      <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        Employment Type & Joining
                      </p>
                      <div className="flex items-center gap-2 pt-0.5">
                        <EmploymentTypeBadge type={employee.employmentType} />
                        <span className="text-xs text-slate-600 font-medium">
                          Joined {employee.joiningDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Manager Card */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Direct Manager
                    </p>
                    {employee.manager ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-indigo-50 font-bold text-xs text-indigo-700">
                              {employee.manager.firstName[0]}
                              {employee.manager.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              {employee.manager.firstName} {employee.manager.lastName}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {employee.manager.workEmail}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {employee.manager.employeeCode}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        No direct manager assigned.
                      </p>
                    )}
                  </div>
                </TabsContent>

                {/* 2. Personal Details Tab */}
                <TabsContent value="personal" className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                      <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        Work Email
                      </p>
                      <p className="text-xs font-semibold text-slate-900 break-all">
                        {employee.workEmail}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                      <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        Personal Email
                      </p>
                      <p className="text-xs font-semibold text-slate-900 break-all">
                        {employee.personalEmail || 'None provided'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                      <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        Phone Number
                      </p>
                      <p className="text-xs font-semibold text-slate-900">
                        {employee.phone || 'None provided'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                      <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        Date of Birth & Gender
                      </p>
                      <p className="text-xs font-semibold text-slate-900">
                        {employee.dateOfBirth || 'N/A'} • {employee.gender || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </TabsContent>

                {/* 3. Bank & Payroll Tab */}
                <TabsContent value="bank" className="space-y-4">
                  <div className="p-5 rounded-2xl border border-indigo-100 bg-indigo-50/40">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          Disbursement Bank Account
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {employee.bankDetails?.hasCompleteBankDetails
                            ? 'Complete and verified for automatic direct deposits'
                            : 'Incomplete banking records'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          Bank Name
                        </span>
                        <p className="text-xs font-semibold text-slate-900 mt-0.5">
                          {employee.bankDetails?.bankName || 'Not configured'}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          Account Number
                        </span>
                        <p className="text-xs font-mono font-semibold text-slate-900 mt-0.5">
                          {employee.bankDetails?.bankAccountNumber
                            ? `•••• •••• ${employee.bankDetails.bankAccountNumber.slice(-4)}`
                            : 'Not configured'}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          Routing / IFSC / Sort Code
                        </span>
                        <p className="text-xs font-mono font-semibold text-slate-900 mt-0.5">
                          {employee.bankDetails?.bankRoutingOrIfsc || 'N/A'}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          Account Holder Name
                        </span>
                        <p className="text-xs font-semibold text-slate-900 mt-0.5">
                          {employee.bankDetails?.bankAccountHolderName || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50">
              {asListItem && onDelete ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(asListItem)}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete Record
                </Button>
              ) : (
                <div />
              )}
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
