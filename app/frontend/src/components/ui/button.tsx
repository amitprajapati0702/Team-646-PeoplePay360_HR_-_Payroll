import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer text-white',
  {
    variants: {
      variant: {
        default:
          'bg-zinc-900 text-white border border-zinc-700 shadow hover:bg-zinc-800 hover:border-zinc-500 active:bg-zinc-900',
        destructive:
          'bg-rose-950 text-white border border-rose-800 shadow-sm hover:bg-rose-900 active:bg-rose-950',
        outline:
          'border border-zinc-700 bg-black text-white shadow-sm hover:bg-zinc-900 hover:border-zinc-600',
        secondary:
          'bg-zinc-800 text-white border border-zinc-700 shadow-sm hover:bg-zinc-700',
        ghost: 'text-white hover:bg-zinc-900 hover:text-white',
        link: 'text-white underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-lg px-6 text-base',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
