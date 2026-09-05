'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  EmployeeStatusBadge,
  EmploymentTypeBadge,
} from './EmployeeStatusBadge';
import {
  MoreHorizontal,
  Eye,
  Pencil,
  RefreshCw,
  GitFork,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
  ArrowUpDown,
  Building,
} from 'lucide-react';
import type {
  EmployeeListItem,
  EmployeeStatus,
  EmploymentType,
  PaginationMeta,
  QueryEmployeesInput,
} from '@/types/employee';

import { useEmployeeFormOptions } from '@/hooks/use-employees';

interface EmployeeTableProps {
  employees: EmployeeListItem[];
  pagination?: PaginationMeta;
  filters: QueryEmployeesInput;
  onFilterChange: (filters: Partial<QueryEmployeesInput>) => void;
  isLoading: boolean;
  onViewDetails: (employee: EmployeeListItem) => void;
  onEdit: (employee: EmployeeListItem) => void;
  onStatusChange: (employee: EmployeeListItem) => void;
  onHierarchy: (employee: EmployeeListItem) => void;
  onDelete: (employee: EmployeeListItem) => void;
  onCreateNew?: () => void;
}

export function EmployeeTable({
  employees,
  pagination,
  filters,
  onFilterChange,
  isLoading,
  onViewDetails,
  onEdit,
  onStatusChange,
  onHierarchy,
  onDelete,
  onCreateNew,
}: EmployeeTableProps) {
  const { data: options } = useEmployeeFormOptions();

  return (
    <div className="space-y-4">
      {/* Table Filter Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <div className="w-36">
            <Select
              value={filters.status || 'ALL'}
              onValueChange={(val) =>
                onFilterChange({
                  status: val === 'ALL' ? undefined : (val as EmployeeStatus),
                  page: 1,
                })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Status: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PROBATION">Probation</SelectItem>
                <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="TERMINATED">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Department Filter */}
          {options && options.departments.length > 0 && (
            <div className="w-44">
              <Select
                value={filters.departmentId || 'ALL'}
                onValueChange={(val) =>
                  onFilterChange({
                    departmentId: val === 'ALL' ? undefined : val,
                    page: 1,
                  })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Department: All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Departments</SelectItem>
                  {options.departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Employment Type Filter */}
          <div className="w-40">
            <Select
              value={filters.employmentType || 'ALL'}
              onValueChange={(val) =>
                onFilterChange({
                  employmentType:
                    val === 'ALL' ? undefined : (val as EmploymentType),
                  page: 1,
                })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Type: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="FULL_TIME">Full Time</SelectItem>
                <SelectItem value="PART_TIME">Part Time</SelectItem>
                <SelectItem value="CONTRACT">Contract</SelectItem>
                <SelectItem value="INTERN">Intern</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Column */}
          <div className="w-40">
            <Select
              value={filters.sortBy || 'createdAt'}
              onValueChange={(val) =>
                onFilterChange({
                  sortBy: val as QueryEmployeesInput['sortBy'],
                  page: 1,
                })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Created Date</SelectItem>
                <SelectItem value="joiningDate">Joining Date</SelectItem>
                <SelectItem value="firstName">First Name</SelectItem>
                <SelectItem value="lastName">Last Name</SelectItem>
                <SelectItem value="employeeCode">Employee Code</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Order Toggle */}
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              onFilterChange({
                sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
                page: 1,
              })
            }
            className="h-8 px-2.5 text-xs text-slate-600"
            title="Toggle sort direction"
          >
            <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
            <span>{filters.sortOrder === 'asc' ? 'Asc' : 'Desc'}</span>
          </Button>
        </div>

        {/* Total Count Info */}
        <div className="text-xs text-slate-500 font-medium ml-auto">
          Total Employees:{' '}
          <span className="font-bold text-slate-900">
            {pagination?.total ?? employees.length}
          </span>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 pl-6 pr-4">Employee</th>
                <th className="py-3.5 px-4">Department & Role</th>
                <th className="py-3.5 px-4">Employment</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Joining Date</th>
                <th className="py-3.5 pl-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-3.5 pl-6 pr-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-xl" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-3.5 w-28" />
                          <Skeleton className="h-2.5 w-36" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Skeleton className="h-3.5 w-24 mb-1" />
                      <Skeleton className="h-2.5 w-16" />
                    </td>
                    <td className="py-3.5 px-4">
                      <Skeleton className="h-5 w-20 rounded-md" />
                    </td>
                    <td className="py-3.5 px-4">
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </td>
                    <td className="py-3.5 px-4">
                      <Skeleton className="h-3.5 w-20" />
                    </td>
                    <td className="py-3.5 pl-4 pr-6 text-right">
                      <Skeleton className="h-8 w-8 rounded-lg ml-auto" />
                    </td>
                  </tr>
                ))
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12">
                    <EmptyState
                      icon={Users}
                      title="No employees found"
                      description="No records match your selected filters or search keyword. Try adjusting filters or create a new employee."
                      actionLabel="Create Employee"
                      onAction={onCreateNew}
                    />
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="group hover:bg-indigo-50/30 transition-colors cursor-pointer"
                    onClick={() => onViewDetails(emp)}
                  >
                    {/* Employee Profile Cell */}
                    <td className="py-3.5 pl-6 pr-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 rounded-xl border border-slate-200/60 shadow-2xs">
                          <AvatarImage src={emp.avatarUrl || ''} />
                          <AvatarFallback className="bg-gradient-to-tr from-indigo-500 to-indigo-700 font-bold text-xs text-white">
                            {emp.firstName[0]}
                            {emp.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {emp.fullName || `${emp.firstName} ${emp.lastName}`}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              {emp.employeeCode}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {emp.workEmail}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Department & Role */}
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">
                        {emp.jobPosition?.title || '—'}
                      </p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Building className="h-3 w-3 text-slate-400" />
                        {emp.department?.name || 'Unassigned'}
                      </p>
                    </td>

                    {/* Employment Type */}
                    <td className="py-3.5 px-4">
                      <EmploymentTypeBadge type={emp.employmentType} />
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <EmployeeStatusBadge status={emp.status} />
                    </td>

                    {/* Joining Date */}
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {emp.joiningDate || '—'}
                    </td>

                    {/* Actions Menu */}
                    <td
                      className="py-3.5 pl-4 pr-6 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-slate-900 rounded-lg"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => onViewDetails(emp)}>
                            <Eye className="h-4 w-4 mr-2 text-indigo-600" />
                            View Smart View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(emp)}>
                            <Pencil className="h-4 w-4 mr-2 text-slate-600" />
                            Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onStatusChange(emp)}>
                            <RefreshCw className="h-4 w-4 mr-2 text-amber-600" />
                            Change Status
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onHierarchy(emp)}>
                            <GitFork className="h-4 w-4 mr-2 text-sky-600" />
                            Reporting Tree
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(emp)}
                            className="text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Employee
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/50">
            <div className="text-xs text-slate-500">
              Showing page{' '}
              <span className="font-semibold text-slate-800">
                {pagination.page}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-slate-800">
                {pagination.totalPages}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs"
                disabled={pagination.page <= 1}
                onClick={() =>
                  onFilterChange({ page: Math.max(1, (filters.page || 1) - 1) })
                }
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() =>
                  onFilterChange({ page: (filters.page || 1) + 1 })
                }
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
