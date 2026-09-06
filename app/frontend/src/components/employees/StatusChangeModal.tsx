'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpdateEmployeeStatus } from '@/hooks/use-employees';
import type { EmployeeListItem, EmployeeStatus } from '@/types/employee';

interface StatusChangeModalProps {
  employee: EmployeeListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface StatusChangeFormProps {
  employee: EmployeeListItem;
  onClose: () => void;
  onSuccess?: () => void;
}

function StatusChangeForm({
  employee,
  onClose,
  onSuccess,
}: StatusChangeFormProps) {
  const [status, setStatus] = useState<EmployeeStatus>(
    () => employee.status || 'ACTIVE'
  );
  const [exitDate, setExitDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  const statusMutation = useUpdateEmployeeStatus();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await statusMutation.mutateAsync(
      {
        id: employee.id,
        data: {
          status,
          exitDate:
            status === 'TERMINATED'
              ? exitDate || new Date().toISOString().split('T')[0]
              : null,
          reason: reason || undefined,
        },
      },
      {
        onSuccess: () => {
          onClose();
          if (onSuccess) onSuccess();
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle className="text-lg font-black tracking-tight text-white">
          Update Employment Status
        </DialogTitle>
        <DialogDescription className="text-xs text-zinc-400 mt-1">
          Transition lifecycle status for{' '}
          <span className="font-semibold text-white">
            {employee.fullName || `${employee.firstName} ${employee.lastName}`}
          </span>{' '}
          ({employee.employeeCode})
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div>
          <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
            Target Lifecycle Status <span className="text-rose-400">*</span>
          </label>
          <Select
            value={status}
            onValueChange={(val) => setStatus(val as EmployeeStatus)}
          >
            <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white text-xs">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
              <SelectItem value="ACTIVE">🟢 Active</SelectItem>
              <SelectItem value="PROBATION">🟡 Probation</SelectItem>
              <SelectItem value="ON_LEAVE">🔵 On Leave</SelectItem>
              <SelectItem value="SUSPENDED">🟠 Suspended</SelectItem>
              <SelectItem value="TERMINATED">🔴 Terminated (Exit)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {status === 'TERMINATED' && (
          <div>
            <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
              Official Exit Date (YYYY-MM-DD)
            </label>
            <Input
              type="date"
              value={exitDate}
              onChange={(e) => setExitDate(e.target.value)}
              placeholder="YYYY-MM-DD"
              className="text-xs bg-zinc-900 border-zinc-700 text-white focus:border-zinc-400"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Leave blank to default to today&apos;s date.
            </p>
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
            Status Change Note / Reason (Optional)
          </label>
          <Input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Completed 90-day probation review successfully"
            className="text-xs bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-zinc-400"
          />
        </div>
      </div>

      <DialogFooter className="flex gap-2 sm:justify-end mt-4 pt-4 border-t border-zinc-800">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={statusMutation.isPending}
          className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={statusMutation.isPending}
          className="border border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800 hover:border-zinc-500 shadow-md font-bold"
        >
          {statusMutation.isPending ? 'Updating...' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function StatusChangeModal({
  employee,
  isOpen,
  onClose,
  onSuccess,
}: StatusChangeModalProps) {
  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#121215] border-zinc-800 text-white shadow-2xl p-6">
        <StatusChangeForm
          key={employee.id}
          employee={employee}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
