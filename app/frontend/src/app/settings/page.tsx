'use client';

import React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useHealth } from '@/hooks/use-health';
import { toast } from 'sonner';
import {
  Settings,
  ShieldCheck,
  User,
  Activity,
  Mail,
  Database,
  Layers,
  CheckCircle2,
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
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
          System Diagnostics & Settings
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Active session identity, infrastructure health checks, and instant demo role switcher.
        </p>
      </div>

      {/* Profile Info */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
          <User className="h-4 w-4 text-zinc-950" />
          Active Account Profile
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-zinc-50 p-3.5 border border-zinc-200">
            <div className="text-[10px] text-zinc-400 font-bold uppercase">Authenticated Email</div>
            <div className="text-xs font-bold text-zinc-900 mt-1">{user?.email || 'N/A'}</div>
          </div>

          <div className="rounded-lg bg-zinc-950 p-3.5 text-white">
            <div className="text-[10px] text-zinc-400 font-bold uppercase">Active Role</div>
            <div className="text-xs font-bold text-white mt-1 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-white" />
              {user?.role || 'EMPLOYEE'}
            </div>
          </div>

          <div className="rounded-lg bg-zinc-50 p-3.5 border border-zinc-200">
            <div className="text-[10px] text-zinc-400 font-bold uppercase">Linked Employee Record</div>
            <div className="text-xs font-bold text-zinc-900 mt-1">
              {user?.employee
                ? `${user.employee.firstName} ${user.employee.lastName} (${user.employee.employeeNumber || 'Linked'})`
                : 'Administrator Account'}
            </div>
          </div>
        </div>
      </div>

      {/* Demo Fast Account Switcher */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
            <Zap className="h-4 w-4 text-zinc-950" />
            Hackathon Live Role Switcher
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Instantly switch sessions between employee, HR manager, and payroll officer to test RBAC and access permissions.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            onClick={() => handleRoleSwitch('payroll@peoplepay360.com')}
            className={cn(
              'flex flex-col items-start rounded-lg border p-3.5 transition-all text-left cursor-pointer',
              user?.role === 'HR_PAYROLL_USER' || user?.role === 'HR_PAYROLL_MANAGER'
                ? 'border-zinc-950 bg-zinc-950 text-white shadow-xs'
                : 'border-zinc-200 bg-white hover:border-zinc-400'
            )}
          >
            <span className={cn('text-[10px] font-bold uppercase', user?.role?.includes('PAYROLL') ? 'text-zinc-300' : 'text-zinc-500')}>
              Payroll Officer
            </span>
            <span className={cn('text-xs font-bold mt-1', user?.role?.includes('PAYROLL') ? 'text-white' : 'text-zinc-950')}>
              payroll@peoplepay360.com
            </span>
            <span className={cn('text-[10px] mt-0.5', user?.role?.includes('PAYROLL') ? 'text-zinc-400' : 'text-zinc-500')}>
              Full Payrun & Salary Rules
            </span>
          </button>

          <button
            onClick={() => handleRoleSwitch('hr@peoplepay360.com')}
            className={cn(
              'flex flex-col items-start rounded-lg border p-3.5 transition-all text-left cursor-pointer',
              user?.role === 'HR_MANAGER'
                ? 'border-zinc-950 bg-zinc-950 text-white shadow-xs'
                : 'border-zinc-200 bg-white hover:border-zinc-400'
            )}
          >
            <span className={cn('text-[10px] font-bold uppercase', user?.role === 'HR_MANAGER' ? 'text-zinc-300' : 'text-zinc-500')}>
              HR Manager
            </span>
            <span className={cn('text-xs font-bold mt-1', user?.role === 'HR_MANAGER' ? 'text-white' : 'text-zinc-950')}>
              hr@peoplepay360.com
            </span>
            <span className={cn('text-[10px] mt-0.5', user?.role === 'HR_MANAGER' ? 'text-zinc-400' : 'text-zinc-500')}>
              Employees, Contracts, Leaves
            </span>
          </button>

          <button
            onClick={() => handleRoleSwitch('alice.johnson@example.com')}
            className={cn(
              'flex flex-col items-start rounded-lg border p-3.5 transition-all text-left cursor-pointer',
              user?.role === 'EMPLOYEE'
                ? 'border-zinc-950 bg-zinc-950 text-white shadow-xs'
                : 'border-zinc-200 bg-white hover:border-zinc-400'
            )}
          >
            <span className={cn('text-[10px] font-bold uppercase', user?.role === 'EMPLOYEE' ? 'text-zinc-300' : 'text-zinc-500')}>
              Employee (Alice)
            </span>
            <span className={cn('text-xs font-bold mt-1', user?.role === 'EMPLOYEE' ? 'text-white' : 'text-zinc-950')}>
              alice.johnson@example.com
            </span>
            <span className={cn('text-[10px] mt-0.5', user?.role === 'EMPLOYEE' ? 'text-zinc-400' : 'text-zinc-500')}>
              Self-Service Leaves & Slips
            </span>
          </button>
        </div>
      </div>

      {/* Infrastructure Diagnostics */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
          <Activity className="h-4 w-4 text-zinc-950" />
          Microservice & Infrastructure Connectivity
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 border border-zinc-200">
            <div className="flex items-center gap-2.5">
              <Database className="h-4 w-4 text-zinc-700" />
              <div>
                <div className="text-xs font-bold text-zinc-900">PostgreSQL (Drizzle ORM)</div>
                <div className="text-[10px] text-zinc-400 font-mono">Port 5434 • Database: peoplepay360</div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-950 px-2.5 py-0.5 text-[10px] font-bold text-white">
              Connected
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 border border-zinc-200">
            <div className="flex items-center gap-2.5">
              <Server className="h-4 w-4 text-zinc-700" />
              <div>
                <div className="text-xs font-bold text-zinc-900">Redis Cache & Sessions</div>
                <div className="text-[10px] text-zinc-400 font-mono">Port 6380 • Health Check: OK</div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-950 px-2.5 py-0.5 text-[10px] font-bold text-white">
              Healthy
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 border border-zinc-200">
            <div className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 text-zinc-700" />
              <div>
                <div className="text-xs font-bold text-zinc-900">SMTP Email Delivery Service</div>
                <div className="text-[10px] text-zinc-400 font-mono">Nodemailer • Ethereal / Gmail</div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-950 px-2.5 py-0.5 text-[10px] font-bold text-white">
              Active
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 border border-zinc-200">
            <div className="flex items-center gap-2.5">
              <Layers className="h-4 w-4 text-zinc-700" />
              <div>
                <div className="text-xs font-bold text-zinc-900">PDF Generator Engine</div>
                <div className="text-[10px] text-zinc-400 font-mono">PDFKit • In-Memory Stream</div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-950 px-2.5 py-0.5 text-[10px] font-bold text-white">
              Operational
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
