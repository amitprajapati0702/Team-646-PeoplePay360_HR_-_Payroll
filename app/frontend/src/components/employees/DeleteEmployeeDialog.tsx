'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useDeleteEmployee } from '@/hooks/use-employees';
import type { EmployeeListItem } from '@/types/employee';

interface DeleteEmployeeDialogProps {
  employee: EmployeeListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeleteEmployeeDialog({
  employee,
  isOpen,
  onClose,
  onSuccess,
}: DeleteEmployeeDialogProps) {
  const deleteMutation = useDeleteEmployee();

  const handleDelete = async () => {
    if (!employee) return;
    await deleteMutation.mutateAsync(employee.id, {
      onSuccess: () => {
        onClose();
        if (onSuccess) onSuccess();
      },
    });
  };

  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#121215] border-zinc-800 text-white shadow-2xl p-6">
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-400 mb-3">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-lg font-black tracking-tight text-white">
            Delete Employee
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400 mt-2 text-center">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-white">
              {employee.fullName || `${employee.firstName} ${employee.lastName}`}
            </span>{' '}
            ({employee.employeeCode})? This action will permanently remove their records.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-3 my-3 text-xs text-amber-300">
          <p className="font-bold">⚠️ Important Safeguard Notice</p>
          <p className="text-[11px] text-amber-400/90 mt-0.5">
            Employees with active direct subordinates cannot be deleted until subordinates are reassigned to another manager. Consider changing status to Terminated instead.
          </p>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-end mt-4 pt-4 border-t border-zinc-800">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={deleteMutation.isPending}
            className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-rose-700 hover:bg-rose-800 text-white font-bold shadow-md"
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Employee'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
