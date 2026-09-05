import React from 'react';
import { cn } from '@/lib/utils';
import type { EmployeeStatus, EmploymentType } from '@/types/employee';

interface StatusBadgeProps {
  status: EmployeeStatus | string;
  className?: string;
}

export function EmployeeStatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status?.toUpperCase() || 'ACTIVE';

  const styles: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    ACTIVE: {
      bg: 'bg-emerald-50 border-emerald-200/60',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500',
      label: 'Active',
    },
    PROBATION: {
      bg: 'bg-amber-50 border-amber-200/60',
      text: 'text-amber-700',
      dot: 'bg-amber-500',
      label: 'Probation',
    },
    ON_LEAVE: {
      bg: 'bg-sky-50 border-sky-200/60',
      text: 'text-sky-700',
      dot: 'bg-sky-500',
      label: 'On Leave',
    },
    SUSPENDED: {
      bg: 'bg-orange-50 border-orange-200/60',
      text: 'text-orange-700',
      dot: 'bg-orange-500',
      label: 'Suspended',
    },
    TERMINATED: {
      bg: 'bg-rose-50 border-rose-200/60',
      text: 'text-rose-700',
      dot: 'bg-rose-500',
      label: 'Terminated',
    },
  };

  const current = styles[normalized] || {
    bg: 'bg-slate-50 border-slate-200',
    text: 'text-slate-700',
    dot: 'bg-slate-400',
    label: status,
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors',
        current.bg,
        current.text,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', current.dot)} />
      {current.label}
    </span>
  );
}

interface EmploymentTypeBadgeProps {
  type: EmploymentType | string;
  className?: string;
}

export function EmploymentTypeBadge({ type, className }: EmploymentTypeBadgeProps) {
  const normalized = type?.toUpperCase() || 'FULL_TIME';

  const labels: Record<string, string> = {
    FULL_TIME: 'Full Time',
    PART_TIME: 'Part Time',
    CONTRACT: 'Contract',
    INTERN: 'Intern',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600',
        className
      )}
    >
      {labels[normalized] || type}
    </span>
  );
}
