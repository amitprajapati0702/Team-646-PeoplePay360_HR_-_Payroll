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
  ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data: employee, isLoading, error } = useEmployee(id);

  return (
    <AppShell
      title="Employee Profile"
      subtitle="Detailed employee master record, contracts, and attendance history"
    >
      <div className="max-w-5xl mx-auto space-y-6 text-white">
        {/* Back navigation */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/employees')}
          className="border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800 hover:border-zinc-500 text-xs gap-1.5 font-bold"
        >
          <ArrowLeft className="h-4 w-4 text-white" />
          <span>Back to Employee Directory</span>
        </Button>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-40 w-full rounded-2xl bg-zinc-800" />
            <div className="grid grid-cols-4 gap-4">
              <Skeleton className="h-24 rounded-2xl bg-zinc-800" />
              <Skeleton className="h-24 rounded-2xl bg-zinc-800" />
              <Skeleton className="h-24 rounded-2xl bg-zinc-800" />
              <Skeleton className="h-24 rounded-2xl bg-zinc-800" />
            </div>
            <Skeleton className="h-64 rounded-2xl bg-zinc-800" />
          </div>
        ) : error || !employee ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-800 bg-[#121215]">
            <p className="text-sm font-semibold text-zinc-300">
              Employee record not found or could not be loaded.
            </p>
            <Button
              className="mt-4 border border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800 font-bold"
              size="sm"
              onClick={() => router.push('/employees')}
            >
              Return to Directory
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-[#121215] overflow-hidden shadow-2xl">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-6 sm:p-8 text-white border-b border-zinc-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl ring-4 ring-zinc-800 shadow-xl">
                    <AvatarImage src={employee.avatarUrl || ''} />
                    <AvatarFallback className="bg-zinc-800 font-bold text-lg sm:text-xl text-white border border-zinc-700">
                      {employee.firstName[0]}
                      {employee.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                        {employee.fullName}
                      </h1>
                      <EmployeeStatusBadge
                        status={employee.status}
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-1 flex items-center gap-2">
                      <span>{employee.jobPosition?.title || 'Job Title'}</span>
                      <span>•</span>
                      <span>{employee.department?.name || 'Department'}</span>
                      <span>•</span>
                      <span className="font-mono text-zinc-300">
                        {employee.employeeCode}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6 bg-zinc-950 border-b border-zinc-800">
              <Link
                href={`/contracts?employeeId=${id}`}
                className="group p-3.5 rounded-xl bg-[#121215] border border-zinc-800 shadow-md hover:border-zinc-700 hover:bg-zinc-900/60 transition-all cursor-pointer block"
              >
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-[11px] font-semibold flex items-center gap-1 group-hover:text-emerald-400 transition-colors">
                    Active Contract
                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                  <FileText className="h-3.5 w-3.5 text-zinc-300 group-hover:text-emerald-400 transition-colors" />
                </div>
                <p className="text-sm font-bold text-white font-mono">
                  {employee.smartBadges?.activeContract
                    ? `₹${Number(employee.smartBadges.activeContract.wage).toLocaleString('en-IN')}/mo`
                    : 'No Contract'}
                </p>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {employee.smartBadges?.contractsCount || 0} total records
                </p>
              </Link>

              <Link
                href={`/attendance?employeeId=${id}`}
                className="group p-3.5 rounded-xl bg-[#121215] border border-zinc-800 shadow-md hover:border-zinc-700 hover:bg-zinc-900/60 transition-all cursor-pointer block"
              >
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-[11px] font-semibold flex items-center gap-1 group-hover:text-blue-400 transition-colors">
                    Attendance (Mo)
                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                  <UserCheck className="h-3.5 w-3.5 text-zinc-300 group-hover:text-blue-400 transition-colors" />
                </div>
                <p className="text-sm font-bold text-white font-mono">
                  {employee.smartBadges?.attendancesCountThisMonth || 0} Days
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  Present this month
                </p>
              </Link>

              <Link
                href={`/time-off?employeeId=${id}`}
                className="group p-3.5 rounded-xl bg-[#121215] border border-zinc-800 shadow-md hover:border-zinc-700 hover:bg-zinc-900/60 transition-all cursor-pointer block"
              >
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-[11px] font-semibold flex items-center gap-1 group-hover:text-amber-400 transition-colors">
                    Time Off Balance
                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                  <CalendarCheck className="h-3.5 w-3.5 text-zinc-300 group-hover:text-amber-400 transition-colors" />
                </div>
                <p className="text-sm font-bold text-white font-mono">
                  {employee.smartBadges?.timeOffRemainingDays ?? 0} Days
                </p>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  of {employee.smartBadges?.timeOffAllocatedDays ?? 0} allocated
                </p>
              </Link>

              <Link
                href={`/payroll?employeeId=${id}`}
                className="group p-3.5 rounded-xl bg-[#121215] border border-zinc-800 shadow-md hover:border-zinc-700 hover:bg-zinc-900/60 transition-all cursor-pointer block"
              >
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-[11px] font-semibold flex items-center gap-1 group-hover:text-purple-400 transition-colors">
                    Payslips
                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                  <Receipt className="h-3.5 w-3.5 text-zinc-300 group-hover:text-purple-400 transition-colors" />
                </div>
                <p className="text-sm font-bold text-white font-mono">
                  {employee.smartBadges?.payslipsGeneratedCount || 0} Generated
                </p>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Lifetime processed
                </p>
              </Link>
            </div>

            {/* Tabbed Content */}
            <div className="p-6 sm:p-8">
              <Tabs defaultValue="work" className="w-full">
                <TabsList className="grid grid-cols-3 mb-6 bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
                  <TabsTrigger value="work" className="rounded-lg text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400 font-semibold">
                    Work & Organization
                  </TabsTrigger>
                  <TabsTrigger value="personal" className="rounded-lg text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400 font-semibold">
                    Personal Details
                  </TabsTrigger>
                  <TabsTrigger value="bank" className="rounded-lg text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400 font-semibold">
                    Bank & Payroll
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="work" className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-1">
                      <p className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-zinc-400" />
                        Department
                      </p>
                      <p className="text-xs font-semibold text-white">
                        {employee.department?.name || 'Not Assigned'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-1">
                      <p className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-zinc-400" />
                        Job Position
                      </p>
                      <p className="text-xs font-semibold text-white">
                        {employee.jobPosition?.title || 'Not Assigned'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-1">
                      <p className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-zinc-400" />
                        Working Schedule
                      </p>
                      <p className="text-xs font-semibold text-white">
                        {employee.workingSchedule?.name || 'Standard 40h'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-1">
                      <p className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                        Employment Type & Joining
                      </p>
                      <div className="flex items-center gap-2 pt-0.5">
                        <EmploymentTypeBadge type={employee.employmentType} />
                        <span className="text-xs text-zinc-300 font-medium">
                          Joined {employee.joiningDate}
                        </span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="personal" className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-1">
                      <p className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-zinc-400" />
                        Work Email
                      </p>
                      <p className="text-xs font-semibold text-white break-all">
                        {employee.workEmail}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-1">
                      <p className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-zinc-400" />
                        Personal Email
                      </p>
                      <p className="text-xs font-semibold text-white break-all">
                        {employee.personalEmail || 'None provided'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-1">
                      <p className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-zinc-400" />
                        Phone Number
                      </p>
                      <p className="text-xs font-semibold text-white">
                        {employee.phone || 'None provided'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-1">
                      <p className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                        Date of Birth & Gender
                      </p>
                      <p className="text-xs font-semibold text-white">
                        {employee.dateOfBirth || 'N/A'} • {employee.gender || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="bank" className="space-y-4">
                  <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-800 text-white border border-zinc-700">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">
                          Disbursement Bank Account
                        </h4>
                        <p className="text-[11px] text-zinc-400">
                          Verified for direct deposit
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-zinc-400">
                          Bank Name
                        </span>
                        <p className="text-xs font-semibold text-white mt-0.5">
                          {employee.bankDetails?.bankName || 'Not configured'}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-zinc-400">
                          Account Number
                        </span>
                        <p className="text-xs font-mono font-semibold text-white mt-0.5">
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

