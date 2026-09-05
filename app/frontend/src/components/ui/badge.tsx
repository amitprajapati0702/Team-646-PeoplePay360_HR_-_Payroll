import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-indigo-50 text-indigo-700 border border-indigo-200/60',
        active: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
        probation: 'bg-amber-50 text-amber-700 border border-amber-200/60',
        on_leave: 'bg-blue-50 text-blue-700 border border-blue-200/60',
        suspended: 'bg-orange-50 text-orange-700 border border-orange-200/60',
        terminated: 'bg-rose-50 text-rose-700 border border-rose-200/60',
        secondary: 'bg-slate-100 text-slate-700 border border-slate-200',
        destructive: 'bg-rose-100 text-rose-800 border border-rose-200',
        outline: 'text-slate-700 border border-slate-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
