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
import { useUpdateEmployee, useEmployeeFormOptions } from '@/hooks/use-employees';
import type {
  EmployeeListItem,
  EmploymentType,
  UpdateEmployeePayload,
} from '@/types/employee';

interface EditEmployeeModalProps {
  employee: EmployeeListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface EditEmployeeFormProps {
  employee: EmployeeListItem;
  onClose: () => void;
  onSuccess?: () => void;
}

function EditEmployeeForm({
  employee,
  onClose,
  onSuccess,
}: EditEmployeeFormProps) {
  const [formData, setFormData] = useState<UpdateEmployeePayload>(() => ({
    firstName: employee.firstName,
    lastName: employee.lastName,
    workEmail: employee.workEmail,
    personalEmail: employee.personalEmail || '',
    phone: employee.phone || '',
    employmentType: employee.employmentType,
    departmentId: employee.department?.id || undefined,
    jobPositionId: employee.jobPosition?.id || undefined,
    workingScheduleId: employee.workingSchedule?.id || undefined,
  }));

  const { data: options } = useEmployeeFormOptions();
  const updateMutation = useUpdateEmployee();

  const handleDepartmentChange = (deptId: string) => {
    setFormData((prev) => {
      const next = { ...prev, departmentId: deptId };
      if (options) {
        const matchingPositions = options.jobPositions.filter(
          (p) => p.departmentId === deptId
        );
        if (matchingPositions.length > 0) {
          next.jobPositionId = matchingPositions[0].id;
        }
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: UpdateEmployeePayload = {
      firstName: formData.firstName?.trim(),
      lastName: formData.lastName?.trim(),
      workEmail: formData.workEmail?.trim().toLowerCase(),
      personalEmail: formData.personalEmail?.trim() || null,
      phone: formData.phone?.trim() || null,
      employmentType: formData.employmentType,
      departmentId: formData.departmentId,
      jobPositionId: formData.jobPositionId,
      workingScheduleId: formData.workingScheduleId,
    };

    await updateMutation.mutateAsync(
      {
        id: employee.id,
        data: payload,
      },
      {
        onSuccess: () => {
          onClose();
          if (onSuccess) onSuccess();
        },
      }
    );
  };

  const filteredJobPositions = options?.jobPositions.filter(
    (p) => !formData.departmentId || p.departmentId === formData.departmentId
  ) || options?.jobPositions || [];

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle className="text-base font-bold text-slate-900">
          Edit Employee Profile
        </DialogTitle>
        <DialogDescription className="text-xs text-slate-500">
          Update information for {employee.fullName} ({employee.employeeCode})
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 py-4">
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1 block">
            First Name
          </label>
          <Input
            value={formData.firstName || ''}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, firstName: e.target.value }))
            }
            className="text-xs"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1 block">
            Last Name
          </label>
          <Input
            value={formData.lastName || ''}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, lastName: e.target.value }))
            }
            className="text-xs"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1 block">
            Work Email
          </label>
          <Input
            type="email"
            value={formData.workEmail || ''}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, workEmail: e.target.value }))
            }
            className="text-xs"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1 block">
            Personal Email
          </label>
          <Input
            type="email"
            value={formData.personalEmail || ''}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                personalEmail: e.target.value,
              }))
            }
            className="text-xs"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1 block">
            Phone Number
          </label>
          <Input
            value={formData.phone || ''}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, phone: e.target.value }))
            }
            className="text-xs"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1 block">
            Employment Type
          </label>
          <Select
            value={formData.employmentType || 'FULL_TIME'}
            onValueChange={(val) =>
              setFormData((prev) => ({
                ...prev,
                employmentType: val as EmploymentType,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FULL_TIME">Full Time</SelectItem>
              <SelectItem value="PART_TIME">Part Time</SelectItem>
              <SelectItem value="CONTRACT">Contract</SelectItem>
              <SelectItem value="INTERN">Intern</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {options && (
          <>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Department
              </label>
              <Select
                value={formData.departmentId || ''}
                onValueChange={handleDepartmentChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {options.departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Job Position
              </label>
              <Select
                value={formData.jobPositionId || ''}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, jobPositionId: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Position" />
                </SelectTrigger>
                <SelectContent>
                  {filteredJobPositions.map((pos) => (
                    <SelectItem key={pos.id} value={pos.id}>
                      {pos.title} ({pos.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Working Schedule
              </label>
              <Select
                value={formData.workingScheduleId || ''}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, workingScheduleId: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Schedule" />
                </SelectTrigger>
                <SelectContent>
                  {options.workingSchedules.map((sched) => (
                    <SelectItem key={sched.id} value={sched.id}>
                      {sched.name} ({sched.totalWeeklyHours}h)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>

      <DialogFooter className="flex gap-2 sm:justify-end mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={updateMutation.isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function EditEmployeeModal({
  employee,
  isOpen,
  onClose,
  onSuccess,
}: EditEmployeeModalProps) {
  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <EditEmployeeForm
          key={employee.id}
          employee={employee}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
