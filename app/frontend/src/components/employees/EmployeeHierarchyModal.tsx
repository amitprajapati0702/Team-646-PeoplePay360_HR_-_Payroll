'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmployeeStatusBadge } from './EmployeeStatusBadge';
import { useEmployeeHierarchy } from '@/hooks/use-employees';
import { GitFork, User, Users, ArrowUp, ArrowDown } from 'lucide-react';
import type { EmployeeListItem } from '@/types/employee';

interface EmployeeHierarchyModalProps {
  initialEmployee: EmployeeListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectEmployee?: (id: string) => void;
}

interface EmployeeHierarchyContentProps {
  initialEmployee: EmployeeListItem;
  onClose: () => void;
  onSelectEmployee?: (id: string) => void;
}

function EmployeeHierarchyContent({
  initialEmployee,
  onClose,
  onSelectEmployee,
}: EmployeeHierarchyContentProps) {
  const [activeEmployeeId, setActiveEmployeeId] = useState<string>(
    initialEmployee.id
  );

  const { data: hierarchy, isLoading } = useEmployeeHierarchy(activeEmployeeId);

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <GitFork className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold text-slate-900">
              Reporting & Organization Hierarchy
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Interactive reporting tree & direct subordinates
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      {isLoading ? (
        <div className="space-y-4 py-6">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="py-4 space-y-6">
          {/* 1. Manager Section */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <ArrowUp className="h-3.5 w-3.5 text-indigo-600" />
              <span>Reports To (Manager)</span>
            </div>
            {hierarchy?.manager ? (
              <div
                onClick={() => setActiveEmployeeId(hierarchy.manager!.id)}
                className="group flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-indigo-500/10">
                    <AvatarImage src={hierarchy.manager.avatarUrl || ''} />
                    <AvatarFallback className="bg-indigo-50 font-semibold text-xs text-indigo-700">
                      {hierarchy.manager.firstName[0]}
                      {hierarchy.manager.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {hierarchy.manager.firstName} {hierarchy.manager.lastName}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {hierarchy.manager.workEmail}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  {hierarchy.manager.employeeCode}
                </span>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center text-xs text-slate-400">
                Top level (No designated manager)
              </div>
            )}
          </div>

          {/* Tree Branch Visual Connector */}
          <div className="flex justify-center -my-3">
            <div className="h-6 w-0.5 bg-indigo-200" />
          </div>

          {/* 2. Current Active Focus Node */}
          <div className="rounded-2xl border-2 border-indigo-600 bg-indigo-50/40 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      {initialEmployee.fullName ||
                        `${initialEmployee.firstName} ${initialEmployee.lastName}`}
                    </h3>
                    <EmployeeStatusBadge status={initialEmployee.status} />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {initialEmployee.jobPosition?.title || 'Employee'} •{' '}
                    {initialEmployee.department?.name || 'Department'}
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs font-semibold text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-indigo-100">
                {initialEmployee.employeeCode}
              </span>
            </div>
          </div>

          {/* Tree Branch Visual Connector */}
          <div className="flex justify-center -my-3">
            <div className="h-6 w-0.5 bg-indigo-200" />
          </div>

          {/* 3. Direct Subordinates / Direct Reports */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <ArrowDown className="h-3.5 w-3.5 text-emerald-600" />
                <span>Direct Reports</span>
              </div>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                {hierarchy?.directReportsCount || 0} Subordinates
              </span>
            </div>

            {hierarchy?.directReports && hierarchy.directReports.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {hierarchy.directReports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => {
                      setActiveEmployeeId(report.id);
                      if (onSelectEmployee) onSelectEmployee(report.id);
                    }}
                    className="group flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={report.avatarUrl || ''} />
                        <AvatarFallback className="bg-slate-100 text-[10px] font-bold text-slate-700">
                          {report.firstName[0]}
                          {report.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="truncate">
                        <p className="text-xs font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                          {report.firstName} {report.lastName}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {report.jobPosition?.title || report.workEmail}
                        </p>
                      </div>
                    </div>
                    <EmployeeStatusBadge
                      status={report.status}
                      className="text-[10px] py-0 px-1.5"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
                <Users className="h-6 w-6 text-slate-300 mx-auto mb-1" />
                <p className="text-xs font-medium text-slate-500">
                  No direct subordinates assigned.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2 border-t border-slate-100">
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    </>
  );
}

export function EmployeeHierarchyModal({
  initialEmployee,
  isOpen,
  onClose,
  onSelectEmployee,
}: EmployeeHierarchyModalProps) {
  if (!initialEmployee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <EmployeeHierarchyContent
          key={initialEmployee.id}
          initialEmployee={initialEmployee}
          onClose={onClose}
          onSelectEmployee={onSelectEmployee}
        />
      </DialogContent>
    </Dialog>
  );
}
