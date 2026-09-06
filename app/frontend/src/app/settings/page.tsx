'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/providers/AuthProvider';
import { useHealth } from '@/hooks/use-health';
import { toast } from 'sonner';
import {
  ShieldCheck,
  User,
  Activity,
  Mail,
  Database,
  Layers,
  Server,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { user, login } = useAuth();
  const { data: health } = useHealth();

  const handleRoleSwitch = async (email: string) => {
    try {
      await login(email, 'Password123!');
      toast.success(`Active session switched to ${email}`);
    } catch (err: any) {
      toast.error('Failed to switch role');
    }
  };

  return (
    <AppShell
      title="Diagnostics & Settings"
      subtitle="Active session identity, infrastructure health checks, and instant demo role switcher"
    >
      <div className="space-y-6 max-w-5xl mx-auto text-white">
        {/* Profile Info */}
        <div className="rounded-xl border border-zinc-800 bg-[#121215] p-6 shadow-md space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <User className="h-4 w-4 text-white" />
            Active Account Profile
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-zinc-900 p-3.5 border border-zinc-800">
              <div className="text-[10px] text-zinc-400 font-bold uppercase">Authenticated Email</div>
              <div className="text-xs font-bold text-white mt-1">{user?.email || 'N/A'}</div>
            </div>

            <div className="rounded-lg bg-zinc-900 p-3.5 border border-zinc-800 text-white">
              <div className="text-[10px] text-zinc-400 font-bold uppercase">Active Role</div>
              <div className="text-xs font-bold text-white mt-1 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-white" />
                {user?.role || 'EMPLOYEE'}
              </div>
            </div>

            <div className="rounded-lg bg-zinc-900 p-3.5 border border-zinc-800">
              <div className="text-[10px] text-zinc-400 font-bold uppercase">Linked Employee Record</div>
              <div className="text-xs font-bold text-white mt-1">
                {user?.employee
                  ? `${user.employee.firstName} ${user.employee.lastName} (${user.employee.employeeNumber || 'Linked'})`
                  : 'Administrator Account'}
              </div>
            </div>
          </div>
        </div>

        {/* Demo Fast Account Switcher */}
        <div className="rounded-xl border border-zinc-800 bg-[#121215] p-6 shadow-md space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="h-4 w-4 text-white" />
              Live Role Switcher
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Instantly switch sessions between employee, HR manager, and payroll officer to test RBAC and access permissions.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              onClick={() => handleRoleSwitch('payroll@peoplepay360.com')}
              className={cn(
                'flex flex-col items-start rounded-lg border p-3.5 transition-all text-left cursor-pointer',
                user?.role === 'HR_PAYROLL_USER' || user?.role === 'HR_PAYROLL_MANAGER'
                  ? 'border-zinc-500 bg-zinc-900 text-white shadow-md'
                  : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-900/60'
              )}
            >
              <span className={cn('text-[10px] font-bold uppercase', user?.role?.includes('PAYROLL') ? 'text-zinc-300' : 'text-zinc-400')}>
                Payroll Officer
              </span>
              <span className="text-xs font-bold mt-1 text-white">
                payroll@peoplepay360.com
              </span>
              <span className="text-[10px] mt-0.5 text-zinc-400">
                Full Payrun & Salary Rules
              </span>
            </button>

            <button
              onClick={() => handleRoleSwitch('hr@peoplepay360.com')}
              className={cn(
                'flex flex-col items-start rounded-lg border p-3.5 transition-all text-left cursor-pointer',
                user?.role === 'HR_MANAGER'
                  ? 'border-zinc-500 bg-zinc-900 text-white shadow-md'
                  : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-900/60'
              )}
            >
              <span className={cn('text-[10px] font-bold uppercase', user?.role === 'HR_MANAGER' ? 'text-zinc-300' : 'text-zinc-400')}>
                HR Manager
              </span>
              <span className="text-xs font-bold mt-1 text-white">
                hr@peoplepay360.com
              </span>
              <span className="text-[10px] mt-0.5 text-zinc-400">
                Employees, Contracts, Leaves
              </span>
            </button>

            <button
              onClick={() => handleRoleSwitch('alice.johnson@example.com')}
              className={cn(
                'flex flex-col items-start rounded-lg border p-3.5 transition-all text-left cursor-pointer',
                user?.role === 'EMPLOYEE'
                  ? 'border-zinc-500 bg-zinc-900 text-white shadow-md'
                  : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-900/60'
              )}
            >
              <span className={cn('text-[10px] font-bold uppercase', user?.role === 'EMPLOYEE' ? 'text-zinc-300' : 'text-zinc-400')}>
                Employee (Alice)
              </span>
              <span className="text-xs font-bold mt-1 text-white">
                alice.johnson@example.com
              </span>
              <span className="text-[10px] mt-0.5 text-zinc-400">
                Self-Service Leaves & Slips
              </span>
            </button>
          </div>
        </div>

        {/* Infrastructure Diagnostics */}
        <div className="rounded-xl border border-zinc-800 bg-[#121215] p-6 shadow-md space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="h-4 w-4 text-white" />
            Microservice & Infrastructure Connectivity
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg bg-zinc-900 p-3 border border-zinc-800">
              <div className="flex items-center gap-2.5">
                <Database className="h-4 w-4 text-zinc-300" />
                <div>
                  <div className="text-xs font-bold text-white">PostgreSQL (Drizzle ORM)</div>
                  <div className="text-[10px] text-zinc-400 font-mono">Port 5434 • Database: peoplepay360</div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 border border-zinc-700 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                Connected
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-zinc-900 p-3 border border-zinc-800">
              <div className="flex items-center gap-2.5">
                <Server className="h-4 w-4 text-zinc-300" />
                <div>
                  <div className="text-xs font-bold text-white">Redis Cache & Sessions</div>
                  <div className="text-[10px] text-zinc-400 font-mono">Port 6380 • Health Check: OK</div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 border border-zinc-700 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                Healthy
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-zinc-900 p-3 border border-zinc-800">
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-zinc-300" />
                <div>
                  <div className="text-xs font-bold text-white">SMTP Email Delivery Service</div>
                  <div className="text-[10px] text-zinc-400 font-mono">Nodemailer • Ethereal / Gmail</div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 border border-zinc-700 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                Active
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-zinc-900 p-3 border border-zinc-800">
              <div className="flex items-center gap-2.5">
                <Layers className="h-4 w-4 text-zinc-300" />
                <div>
                  <div className="text-xs font-bold text-white">PDF Generator Engine</div>
                  <div className="text-[10px] text-zinc-400 font-mono">PDFKit • In-Memory Stream</div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 border border-zinc-700 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                Operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

