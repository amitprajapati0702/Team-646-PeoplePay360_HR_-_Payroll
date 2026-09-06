'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { EmployeeTable } from '@/components/employees/EmployeeTable';
import { EmployeeKanban } from '@/components/employees/EmployeeKanban';
import { EmployeeDetailDrawer } from '@/components/employees/EmployeeDetailDrawer';
import { CreateEmployeeModal } from '@/components/employees/CreateEmployeeModal';
import { EditEmployeeModal } from '@/components/employees/EditEmployeeModal';
import { StatusChangeModal } from '@/components/employees/StatusChangeModal';
import { EmployeeHierarchyModal } from '@/components/employees/EmployeeHierarchyModal';
import { DeleteEmployeeDialog } from '@/components/employees/DeleteEmployeeDialog';
import { Button } from '@/components/ui/button';
import { useEmployees, useEmployeeKanban } from '@/hooks/use-employees';
import {
  Users,
  LayoutGrid,
  Table as TableIcon,
  UserCheck,
  UserPlus,
  Clock,
  UserMinus,
} from 'lucide-react';
import type {
  EmployeeListItem,
  QueryEmployeesInput,
} from '@/types/employee';

export default function EmployeesPage() {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [kanbanGroupBy, setKanbanGroupBy] = useState<
    'status' | 'department' | 'employmentType'
  >('status');

  // Query state for Table View
  const [filters, setFilters] = useState<QueryEmployeesInput>({
    page: 1,
    limit: 15,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    search: '',
  });

  // Modal / Drawer state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [drawerEmployeeId, setDrawerEmployeeId] = useState<string | null>(null);
  const [editEmployee, setEditEmployee] = useState<EmployeeListItem | null>(null);
  const [statusEmployee, setStatusEmployee] = useState<EmployeeListItem | null>(null);
  const [hierarchyEmployee, setHierarchyEmployee] = useState<EmployeeListItem | null>(null);
  const [deleteEmployee, setDeleteEmployee] = useState<EmployeeListItem | null>(null);

  // TanStack Queries
  const { data: employeesResponse, isLoading: isTableLoading } = useEmployees(filters);
  const { data: kanbanGroups = [], isLoading: isKanbanLoading } = useEmployeeKanban(kanbanGroupBy);

  const employees = employeesResponse?.data || [];
  const pagination = employeesResponse?.meta;

  const handleFilterChange = (updated: Partial<QueryEmployeesInput>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  // Quick stats calculation
  const totalCount = pagination?.total ?? employees.length;
  const activeCount = employees.filter((e) => e.status === 'ACTIVE').length;
  const probationCount = employees.filter((e) => e.status === 'PROBATION').length;
  const onLeaveCount = employees.filter((e) => e.status === 'ON_LEAVE').length;

  return (
    <AppShell
      title="Employee Directory"
      subtitle="Comprehensive employee master records, position tracking, and org hierarchy"
      onNewEmployeeClick={() => setCreateModalOpen(true)}
      searchQuery={filters.search}
      onSearchChange={(val) => handleFilterChange({ search: val, page: 1 })}
    >
      <div className="space-y-6 max-w-7xl mx-auto text-white">
        {/* KPI Stats Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl bg-[#121215] border border-zinc-800 shadow-md hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Workforce</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-white">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mt-2 font-mono">{totalCount}</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Active directory records</p>
          </div>

          <div className="p-4 rounded-xl bg-[#121215] border border-zinc-800 shadow-md hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Active Duty</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-emerald-400">
                <UserCheck className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mt-2 font-mono">{activeCount}</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Working standard schedule</p>
          </div>

          <div className="p-4 rounded-xl bg-[#121215] border border-zinc-800 shadow-md hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">On Probation</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-amber-400">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mt-2 font-mono">{probationCount}</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Trial & onboarding stage</p>
          </div>

          <div className="p-4 rounded-xl bg-[#121215] border border-zinc-800 shadow-md hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">On Leave</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                <UserMinus className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mt-2 font-mono">{onLeaveCount}</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Approved time off</p>
          </div>
        </div>

        {/* Action Header & View Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950 p-2 rounded-xl border border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-900/80 p-1">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all text-white ${
                  viewMode === 'table'
                    ? 'bg-zinc-800 border border-zinc-700 shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span>Table View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all text-white ${
                  viewMode === 'kanban'
                    ? 'bg-zinc-800 border border-zinc-700 shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Kanban Board</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/employees/new"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-zinc-800 hover:border-zinc-500 transition-all"
            >
              <UserPlus className="h-4 w-4 mr-1 text-white" />
              <span>Add Employee (Page)</span>
            </Link>
            <Button
              onClick={() => setCreateModalOpen(true)}
              size="sm"
              className="border border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800 hover:border-zinc-500 shadow-md cursor-pointer"
            >
              <UserPlus className="h-4 w-4 mr-1.5 text-white" />
              <span>Quick Add (Modal)</span>
            </Button>
          </div>
        </div>

        {/* View Mode Switching */}
        {viewMode === 'table' ? (
          <EmployeeTable
            employees={employees}
            pagination={pagination}
            filters={filters}
            onFilterChange={handleFilterChange}
            isLoading={isTableLoading}
            onViewDetails={(emp) => setDrawerEmployeeId(emp.id)}
            onEdit={(emp) => setEditEmployee(emp)}
            onStatusChange={(emp) => setStatusEmployee(emp)}
            onHierarchy={(emp) => setHierarchyEmployee(emp)}
            onDelete={(emp) => setDeleteEmployee(emp)}
            onCreateNew={() => setCreateModalOpen(true)}
          />
        ) : (
          <EmployeeKanban
            groups={kanbanGroups}
            groupBy={kanbanGroupBy}
            onGroupByChange={setKanbanGroupBy}
            isLoading={isKanbanLoading}
            onViewDetails={(id) => setDrawerEmployeeId(id)}
            onStatusChange={(emp) => setStatusEmployee(emp)}
            onHierarchy={(emp) => setHierarchyEmployee(emp)}
          />
        )}
      </div>

      {/* 1. Employee Detail Drawer / Smart View */}
      <EmployeeDetailDrawer
        employeeId={drawerEmployeeId}
        isOpen={!!drawerEmployeeId}
        onClose={() => setDrawerEmployeeId(null)}
        onEdit={(emp) => {
          setDrawerEmployeeId(null);
          setEditEmployee(emp);
        }}
        onStatusChange={(emp) => {
          setDrawerEmployeeId(null);
          setStatusEmployee(emp);
        }}
        onHierarchy={(emp) => {
          setDrawerEmployeeId(null);
          setHierarchyEmployee(emp);
        }}
        onDelete={(emp) => {
          setDrawerEmployeeId(null);
          setDeleteEmployee(emp);
        }}
      />

      {/* 2. Create Employee Modal */}
      <CreateEmployeeModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />

      {/* 3. Edit Employee Modal */}
      <EditEmployeeModal
        employee={editEmployee}
        isOpen={!!editEmployee}
        onClose={() => setEditEmployee(null)}
      />

      {/* 4. Status Transition Modal */}
      <StatusChangeModal
        employee={statusEmployee}
        isOpen={!!statusEmployee}
        onClose={() => setStatusEmployee(null)}
      />

      {/* 5. Reporting Hierarchy Modal */}
      <EmployeeHierarchyModal
        initialEmployee={hierarchyEmployee}
        isOpen={!!hierarchyEmployee}
        onClose={() => setHierarchyEmployee(null)}
        onSelectEmployee={(id) => setDrawerEmployeeId(id)}
      />

      {/* 6. Delete Employee Confirmation Dialog */}
      <DeleteEmployeeDialog
        employee={deleteEmployee}
        isOpen={!!deleteEmployee}
        onClose={() => setDeleteEmployee(null)}
      />
    </AppShell>
  );
}
