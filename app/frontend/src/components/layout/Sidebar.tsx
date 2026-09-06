'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  FileText,
  Clock,
  CalendarCheck,
  Receipt,
  PieChart,
  Settings,
  Building2,
  Briefcase,
  DollarSign,
  LogOut,
  ChevronRight,
  Command,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHealth } from '@/hooks/use-health';
import { useAuth } from '@/providers/AuthProvider';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  minRole?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const ROLE_LEVELS: Record<string, number> = {
  EMPLOYEE: 1,
  HR_MANAGER: 2,
  HR_PAYROLL_USER: 3,
  HR_PAYROLL_MANAGER: 4,
  ADMIN: 5,
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Executive Dashboard', href: '/dashboard', icon: PieChart },
      { label: 'Reports & Analytics', href: '/reports', icon: FileText },
    ],
  },
  {
    label: 'Human Resources',
    items: [
      { label: 'Employee Hub', href: '/employees', icon: Users },
      { label: 'Add Employee', href: '/employees/new', icon: Users, minRole: 'HR_MANAGER' },
      { label: 'Contracts', href: '/contracts', icon: FileText },
      { label: 'Attendance Logs', href: '/attendance', icon: Clock },
      { label: 'Time Off & Leaves', href: '/time-off', icon: CalendarCheck },
    ],
  },
  {
    label: 'Payroll Engine',
    items: [
      { label: 'My Payslips', href: '/payslips', icon: Receipt },
      { label: 'Payrun Processing', href: '/payroll', icon: Receipt, minRole: 'HR_PAYROLL_USER' },
      { label: 'Salary Structures', href: '/salary-structures', icon: DollarSign, minRole: 'HR_PAYROLL_USER' },
    ],
  },
  {
    label: 'Organization Structure',
    items: [
      { label: 'Departments', href: '/organization/departments', icon: Building2 },
      { label: 'Job Positions', href: '/organization/positions', icon: Briefcase },
      { label: 'Working Schedules', href: '/organization/schedules', icon: Clock },
    ],
  },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  EMPLOYEE: 'Employee',
  HR_MANAGER: 'HR Manager',
  HR_PAYROLL_USER: 'HR Payroll User',
  HR_PAYROLL_MANAGER: 'Payroll Manager',
  ADMIN: 'Administrator',
};

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: health } = useHealth();
  const { user, logout } = useAuth();
  const isHealthy = health?.status === 'healthy' || health?.status === 'ok';
  const userLevel = ROLE_LEVELS[user?.role ?? 'EMPLOYEE'] ?? 1;

  const getInitials = () => {
    if (user?.employee) {
      return `${user.employee.firstName[0]}${user.employee.lastName[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() ?? 'U';
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-xs lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-zinc-800/90 bg-[#09090b] text-zinc-100 shadow-2xl transition-transform duration-200 ease-in-out lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between border-b border-zinc-800 px-5 bg-zinc-950/50">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black shadow-md">
              <Command className="h-4 w-4 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight text-white">PeoplePay</span>
                <span className="rounded bg-zinc-800 px-1.5 py-0.2 text-[10px] font-mono font-bold text-zinc-200">
                  360
                </span>
              </div>
              <span className="text-[10px] font-medium text-zinc-400">Enterprise HR & Payroll</span>
            </div>
          </Link>

          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white lg:hidden cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) => {
              if (!item.minRole) return true;
              return userLevel >= (ROLE_LEVELS[item.minRole] ?? 1);
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label}>
                <div className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  {group.label}
                </div>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      (item.href !== '/reports' && pathname?.startsWith(`${item.href}/`));

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onMobileClose}
                        className={cn(
                          'group flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold transition-all',
                          isActive
                            ? 'bg-white text-black shadow-md font-bold'
                            : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={cn(
                              'h-4 w-4 shrink-0 transition-colors',
                              isActive ? 'text-black' : 'text-zinc-400 group-hover:text-white'
                            )}
                          />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={cn(
                              'rounded px-1.5 py-0.5 text-[10px] font-bold',
                              isActive ? 'bg-zinc-200 text-black' : 'bg-zinc-800 text-zinc-300'
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                        {isActive && <ChevronRight className="h-3.5 w-3.5 text-black shrink-0" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* System Settings & Health */}
          {/* System Settings & Health */}
          <div>
            <div className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Personal & System
            </div>
            <div className="space-y-0.5">
              <Link
                href="/profile"
                onClick={onMobileClose}
                className={cn(
                  'group flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold transition-all',
                  pathname === '/profile'
                    ? 'bg-white text-black font-bold shadow-md'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Command
                    className={cn(
                      'h-4 w-4 shrink-0',
                      pathname === '/profile' ? 'text-black' : 'text-zinc-400 group-hover:text-white'
                    )}
                  />
                  <span>My Profile & Password</span>
                </div>
              </Link>

              <Link
                href="/settings"
                onClick={onMobileClose}
                className={cn(
                  'group flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold transition-all',
                  pathname === '/settings'
                    ? 'bg-white text-black font-bold shadow-md'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Settings
                    className={cn(
                      'h-4 w-4 shrink-0',
                      pathname === '/settings' ? 'text-black' : 'text-zinc-400 group-hover:text-white'
                    )}
                  />
                  <span>Settings & Diagnostics</span>
                </div>
              </Link>
            </div>

            {/* Gateway Status Widget */}
            <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950 p-2.5">
              <div className="flex items-center justify-between text-[11px] font-medium text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      isHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    )}
                  />
                  API Gateway
                </span>
                <span className="font-mono text-[10px] font-bold text-white">
                  {isHealthy ? 'ONLINE' : 'CHECKING'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* User Card & Logout */}
        <div className="border-t border-zinc-800 p-3 bg-zinc-950/40">
          <div className="flex items-center gap-2.5 rounded-lg border border-zinc-800 bg-zinc-900/90 p-2">
            <Link
              href="/profile"
              onClick={onMobileClose}
              className="flex items-center gap-2.5 flex-1 min-w-0 group cursor-pointer"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-xs font-black text-black shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                {getInitials()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate group-hover:text-zinc-300 transition-colors">
                  {user?.employee
                    ? `${user.employee.firstName} ${user.employee.lastName}`
                    : user?.email ?? 'User'}
                </p>
                <p className="text-[10px] font-mono font-medium text-zinc-400 truncate">
                  {ROLE_LABELS[user?.role ?? 'EMPLOYEE']}
                </p>
              </div>
            </Link>
            <button
              onClick={logout}
              title="Sign Out"
              className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
