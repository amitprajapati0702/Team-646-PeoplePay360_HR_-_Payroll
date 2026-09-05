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
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-3">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-lg font-bold text-slate-900">
            Delete Employee
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-2">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-slate-800">
              {employee.fullName || `${employee.firstName} ${employee.lastName}`}
            </span>{' '}
            ({employee.employeeCode})? This action will permanently remove their records.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-3 my-2 text-xs text-amber-800">
          <p className="font-medium">⚠️ Important Safeguard Notice</p>
          <p className="text-[11px] text-amber-700 mt-0.5">
            Employees with active direct subordinates cannot be deleted until subordinates are reassigned to another manager.
          </p>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-end mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Employee'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
