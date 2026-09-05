'use client';

import React, { useState } from 'react';
import { Bell, Search, Plus, Menu, Clock, LogIn, LogOut, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface HeaderProps {
  onNewEmployeeClick?: () => void;
  onMobileMenuToggle?: () => void;
  title?: string;
  subtitle?: string;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export function Header({
  onNewEmployeeClick,
  onMobileMenuToggle,
  title = 'PeoplePay360 Operations',
  subtitle = 'Enterprise HR & Payroll Platform',
  searchQuery,
  onSearchChange,
}: HeaderProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  // Quick Punch Attendance Mutation
  const punchMutation = useMutation({
    mutationFn: async (type: 'CHECK_IN' | 'CHECK_OUT') => {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().slice(0, 5);

      const payload = {
        employeeId: user?.employee?.id || 'demo',
        date: dateStr,
        checkInTime: type === 'CHECK_IN' ? timeStr : '09:00',
        checkOutTime: type === 'CHECK_OUT' ? timeStr : undefined,
        workedHours: type === 'CHECK_OUT' ? 8 : 4,
        status: 'PRESENT',
      };

      const res = await apiClient.post('/attendance', payload);
      return res.data;
    },
    onSuccess: (_, type) => {
      if (type === 'CHECK_IN') {
        setIsCheckedIn(true);
        toast.success(`Clocked in at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      } else {
        setIsCheckedIn(false);
        toast.success(`Clocked out at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      }
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to record attendance punch');
    },
  });

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-zinc-800 bg-[#09090b]/90 px-4 sm:px-6 backdrop-blur-md text-white">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white lg:hidden cursor-pointer"
            aria-label="Open sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        <div>
          <h2 className="text-sm font-bold text-white leading-none tracking-tight">{title}</h2>
          <p className="text-[11px] text-zinc-400 mt-0.5 hidden sm:block">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Search */}
        {onSearchChange !== undefined && (
          <div className="relative hidden md:block w-56">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search..."
              className="h-8 w-full rounded-lg border border-zinc-800 bg-zinc-900/90 pl-8 pr-3 text-xs text-white placeholder:text-zinc-500 focus:border-white focus:outline-none"
            />
          </div>
        )}

        {/* Quick Attendance Punch Widget */}
        <div className="hidden sm:flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
          <button
            onClick={() => punchMutation.mutate(isCheckedIn ? 'CHECK_OUT' : 'CHECK_IN')}
            disabled={punchMutation.isPending}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition-all cursor-pointer shadow-xs',
              isCheckedIn
                ? 'bg-rose-500 text-white hover:bg-rose-600'
                : 'bg-white text-black hover:bg-zinc-200'
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>{isCheckedIn ? 'Clock Out' : 'Clock In'}</span>
          </button>
        </div>

        {/* Role Pill */}
        <Link
          href="/settings"
          className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] font-mono font-bold text-zinc-300 hover:border-zinc-700 hover:text-white transition-colors"
          title="Switch role in Settings"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-zinc-400" />
          <span>{user?.role || 'EMPLOYEE'}</span>
        </Link>

        {/* Action Button */}
        {onNewEmployeeClick && (
          <button
            onClick={onNewEmployeeClick}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-black shadow-md hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span className="hidden xs:inline">Add Employee</span>
            <span className="xs:hidden">Add</span>
          </button>
        )}
      </div>
    </header>
  );
}
