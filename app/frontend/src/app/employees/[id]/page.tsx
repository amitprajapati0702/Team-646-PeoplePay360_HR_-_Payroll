'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { useEmployee } from '@/hooks/use-employees';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmployeeStatusBadge, EmploymentTypeBadge } from '@/components/employees/EmployeeStatusBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
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
} from 'lucide-react';

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data: employee, isLoading, error } = useEmployee(id);

  return (
    <AppShell
      title="Employee Profile"
      subtitle="Detailed employee records, contracts, and smart badges"
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back navigation */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/employees')}
          className="text-xs text-slate-600 gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Employee Directory</span>
        </Button>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <div className="grid grid-cols-4 gap-4">
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
            </div>
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        ) : error || !employee ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-white">
            <p className="text-sm font-semibold text-slate-800">
              Employee record not found or could not be loaded.
            </p>
            <Button
              className="mt-4"
              size="sm"
              onClick={() => router.push('/employees')}
            >
              Return to Directory
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white">
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
                      <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                        {employee.fullName}
                      </h1>
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
              </div>
            </div>

            {/* Smart Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6 bg-slate-50 border-b border-slate-200/80">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-medium">Active Contract</span>
                  <FileText className="h-3.5 w-3.5 text-indigo-600" />
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {employee.smartBadges?.activeContract
                    ? `$${employee.smartBadges.activeContract.wage}/mo`
                    : 'No Contract'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {employee.smartBadges?.contractsCount || 0} total records
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-medium">Attendance (Mo)</span>
                  <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {employee.smartBadges?.attendancesCountThisMonth || 0} Days
                </p>
                <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
                  Present this month
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-medium">Time Off Balance</span>
                  <CalendarCheck className="h-3.5 w-3.5 text-sky-600" />
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {employee.smartBadges?.timeOffRemainingDays ?? 0} Days
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  of {employee.smartBadges?.timeOffAllocatedDays ?? 0} allocated
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-medium">Payslips</span>
                  <Receipt className="h-3.5 w-3.5 text-purple-600" />
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {employee.smartBadges?.payslipsGeneratedCount || 0} Generated
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Lifetime processed
                </p>
              </div>
            </div>

            {/* Tabbed Content */}
            <div className="p-6 sm:p-8">
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
                    </div>

                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                      <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                        Job Position
                      </p>
                      <p className="text-xs font-semibold text-slate-900">
                        {employee.jobPosition?.title || 'Not Assigned'}
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
                </TabsContent>

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
                          Verified for direct deposit
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
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
