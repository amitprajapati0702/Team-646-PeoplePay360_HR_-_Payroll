'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmployeeStatusBadge } from './EmployeeStatusBadge';
import {
  Briefcase,
  Building,
  Mail,
  MoreHorizontal,
  Eye,
  RefreshCw,
  GitFork,
  Layers,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type {
  KanbanGroupItem,
  EmployeeListItem,
} from '@/types/employee';

interface EmployeeKanbanProps {
  groups: KanbanGroupItem[];
  groupBy: 'status' | 'department' | 'employmentType';
  onGroupByChange: (groupBy: 'status' | 'department' | 'employmentType') => void;
  isLoading: boolean;
  onViewDetails: (employeeId: string) => void;
  onStatusChange?: (employee: EmployeeListItem) => void;
  onHierarchy?: (employee: EmployeeListItem) => void;
}

export function EmployeeKanban({
  groups,
  groupBy,
  onGroupByChange,
  isLoading,
  onViewDetails,
  onStatusChange,
  onHierarchy,
}: EmployeeKanbanProps) {
  const getHeaderAccent = (key: string) => {
    switch (key.toUpperCase()) {
      case 'ACTIVE':
        return 'border-t-emerald-500 bg-emerald-50/30';
      case 'PROBATION':
        return 'border-t-amber-500 bg-amber-50/30';
      case 'ON_LEAVE':
        return 'border-t-sky-500 bg-sky-50/30';
      case 'SUSPENDED':
        return 'border-t-orange-500 bg-orange-50/30';
      case 'TERMINATED':
        return 'border-t-rose-500 bg-rose-50/30';
      default:
        return 'border-t-indigo-500 bg-indigo-50/30';
    }
  };

  return (
    <div className="space-y-4">
      {/* Grouping Filter Control Bar */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Layers className="h-4 w-4 text-indigo-600" />
          <span className="text-xs font-bold text-slate-700">Group Columns By:</span>
          <div className="w-44">
            <Select
              value={groupBy}
              onValueChange={(val) =>
                onGroupByChange(val as 'status' | 'department' | 'employmentType')
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status">Status (Active, Probation, etc.)</SelectItem>
                <SelectItem value="employmentType">Employment Type</SelectItem>
                <SelectItem value="department">Department</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Showing <span className="font-bold text-slate-900">{groups.length}</span> columns
        </div>
      </div>

      {/* Kanban Board Horizontal Scroll Container */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 items-start">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="w-80 shrink-0 rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-5 w-24 rounded" />
                  <Skeleton className="h-5 w-8 rounded-full" />
                </div>
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
              </div>
            ))
          : groups.map((group) => (
              <div
                key={group.key}
                className="w-80 shrink-0 rounded-2xl border border-slate-200/90 bg-slate-50/70 shadow-2xs flex flex-col max-h-[calc(100vh-250px)]"
              >
                {/* Column Header */}
                <div
                  className={`flex items-center justify-between p-3.5 border-b border-slate-200/80 border-t-4 rounded-t-2xl bg-white ${getHeaderAccent(
                    group.key
                  )}`}
                >
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      {group.title || group.key}
                    </h3>
                  </div>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 font-bold text-[11px] text-slate-700">
                    {group.count}
                  </span>
                </div>

                {/* Column Cards Container */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {group.employees.length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-white/50 text-[11px] text-slate-400">
                      No employees in this stage
                    </div>
                  ) : (
                    group.employees.map((emp) => {
                      const asListItem: EmployeeListItem = {
                        id: emp.id,
                        employeeCode: emp.employeeCode,
                        firstName: emp.firstName,
                        lastName: emp.lastName,
                        fullName: emp.fullName,
                        workEmail: emp.workEmail,
                        personalEmail: null,
                        phone: null,
                        employmentType: emp.employmentType as EmployeeListItem['employmentType'],
                        status: emp.status as EmployeeListItem['status'],
                        joiningDate: '',
                        avatarUrl: emp.avatarUrl,
                        createdAt: '',
                        department: emp.departmentName
                          ? { id: '', name: emp.departmentName, code: '' }
                          : null,
                        jobPosition: emp.jobTitle
                          ? { id: '', title: emp.jobTitle, code: '' }
                          : null,
                        workingSchedule: null,
                      };

                      return (
                        <div
                          key={emp.id}
                          onClick={() => onViewDetails(emp.id)}
                          className="group relative rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer"
                        >
                          {/* Top Row: Avatar & Action */}
                          <div className="flex items-start justify-between gap-2 mb-2.5">
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-8 w-8 rounded-lg shadow-2xs">
                                <AvatarImage src={emp.avatarUrl || ''} />
                                <AvatarFallback className="bg-indigo-600 font-bold text-white text-xs">
                                  {emp.firstName[0]}
                                  {emp.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                                  {emp.fullName}
                                </h4>
                                <span className="font-mono text-[10px] text-slate-400">
                                  {emp.employeeCode}
                                </span>
                              </div>
                            </div>

                            {/* Dropdown Action */}
                            <div onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-slate-400 hover:text-slate-900"
                                  >
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem onClick={() => onViewDetails(emp.id)}>
                                    <Eye className="h-3.5 w-3.5 mr-2 text-indigo-600" />
                                    Smart View
                                  </DropdownMenuItem>
                                  {onStatusChange && (
                                    <DropdownMenuItem onClick={() => onStatusChange(asListItem)}>
                                      <RefreshCw className="h-3.5 w-3.5 mr-2 text-amber-600" />
                                      Change Status
                                    </DropdownMenuItem>
                                  )}
                                  {onHierarchy && (
                                    <DropdownMenuItem onClick={() => onHierarchy(asListItem)}>
                                      <GitFork className="h-3.5 w-3.5 mr-2 text-sky-600" />
                                      Hierarchy Tree
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {/* Middle Info */}
                          <div className="space-y-1 my-2 text-[11px] text-slate-500">
                            {emp.jobTitle && (
                              <div className="flex items-center gap-1.5 truncate">
                                <Briefcase className="h-3 w-3 text-slate-400 shrink-0" />
                                <span className="truncate font-medium text-slate-700">
                                  {emp.jobTitle}
                                </span>
                              </div>
                            )}
                            {emp.departmentName && (
                              <div className="flex items-center gap-1.5 truncate">
                                <Building className="h-3 w-3 text-slate-400 shrink-0" />
                                <span className="truncate">{emp.departmentName}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 truncate">
                              <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                              <span className="truncate text-slate-400">{emp.workEmail}</span>
                            </div>
                          </div>

                          {/* Bottom Row Badge */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                            <EmployeeStatusBadge
                              status={emp.status}
                              className="text-[10px] py-0 px-2"
                            />
                            <span className="text-[10px] text-slate-400 font-medium">
                              {emp.employmentType}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
