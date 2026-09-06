'use client';

import React, { useState, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCreateEmployee, useEmployeeFormOptions } from '@/hooks/use-employees';
import { UserPlus, User, Briefcase, CreditCard, Shield, Loader2 } from 'lucide-react';
import type {
  CreateEmployeePayload,
  EmployeeStatus,
  EmploymentType,
  UserRole,
} from '@/types/employee';

interface CreateEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DEFAULT_FORM: CreateEmployeePayload = {
  employeeCode: '',
  firstName: '',
  lastName: '',
  workEmail: '',
  personalEmail: '',
  phone: '',
  gender: 'MALE',
  dateOfBirth: '',
  joiningDate: new Date().toISOString().split('T')[0],
  departmentId: '',
  jobPositionId: '',
  workingScheduleId: '',
  managerId: null,
  employmentType: 'FULL_TIME',
  status: 'ACTIVE',
  bankName: '',
  bankAccountNumber: '',
  bankRoutingOrIfsc: '',
  bankAccountHolderName: '',
  avatarUrl: '',
  createUserAccount: false,
  userPassword: '',
  userRole: 'EMPLOYEE',
};

export function CreateEmployeeModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateEmployeeModalProps) {
  const [formData, setFormData] = useState<CreateEmployeePayload>(DEFAULT_FORM);
  const [activeTab, setActiveTab] = useState('personal');

  const { data: options, isLoading: isOptionsLoading } = useEmployeeFormOptions();
  const createMutation = useCreateEmployee();

  // Set default department, job position, and schedule once options load
  useEffect(() => {
    if (options) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData((prev) => ({
        ...prev,
        departmentId: prev.departmentId || options.departments[0]?.id || '',
        jobPositionId: prev.jobPositionId || options.jobPositions[0]?.id || '',
        workingScheduleId: prev.workingScheduleId || options.workingSchedules[0]?.id || '',
      }));
    }
  }, [options]);

  const handleChange = (
    field: keyof CreateEmployeePayload,
    value: string | boolean | null
  ) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // If department changed, update jobPosition if current one is not in that department
      if (field === 'departmentId' && options) {
        const matchingPositions = options.jobPositions.filter(
          (p) => p.departmentId === value
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

    // Prepare payload with clean nulls for optional empty strings
    const payload: CreateEmployeePayload = {
      employeeCode: formData.employeeCode.trim().toUpperCase(),
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      workEmail: formData.workEmail.trim().toLowerCase(),
      personalEmail: formData.personalEmail?.trim() || null,
      phone: formData.phone?.trim() || null,
      gender: formData.gender || null,
      dateOfBirth: formData.dateOfBirth?.trim() || null,
      joiningDate: formData.joiningDate.trim(),
      departmentId: formData.departmentId,
      jobPositionId: formData.jobPositionId,
      workingScheduleId: formData.workingScheduleId,
      managerId: formData.managerId || null,
      employmentType: formData.employmentType,
      status: formData.status,
      bankName: formData.bankName?.trim() || null,
      bankAccountNumber: formData.bankAccountNumber?.trim() || null,
      bankRoutingOrIfsc: formData.bankRoutingOrIfsc?.trim() || null,
      bankAccountHolderName: formData.bankAccountHolderName?.trim() || null,
      avatarUrl: formData.avatarUrl?.trim() || null,
      createUserAccount: formData.createUserAccount,
      userPassword: formData.createUserAccount && formData.userPassword ? formData.userPassword : undefined,
      userRole: formData.createUserAccount ? formData.userRole : undefined,
    };

    await createMutation.mutateAsync(payload, {
      onSuccess: () => {
        setFormData(DEFAULT_FORM);
        onClose();
        if (onSuccess) onSuccess();
      },
    });
  };

  const filteredJobPositions = options?.jobPositions.filter(
    (p) => !formData.departmentId || p.departmentId === formData.departmentId
  ) || options?.jobPositions || [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[88vh] overflow-y-auto bg-[#121215] border-zinc-800 text-white shadow-2xl p-6">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-white shadow-inner">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black tracking-tight text-white">
                  Onboard New Employee
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-400">
                  Create master profile, department & position assignments, and portal access credentials.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {isOptionsLoading ? (
            <div className="flex items-center justify-center p-12 text-xs text-zinc-400 gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              <span>Loading organization directory...</span>
            </div>
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full mt-5"
            >
              <TabsList className="grid grid-cols-4 bg-zinc-900 border border-zinc-800 p-1 rounded-xl mb-5">
                <TabsTrigger value="personal" className="text-xs flex items-center gap-1.5 data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400 font-semibold">
                  <User className="h-3.5 w-3.5" />
                  <span>Personal</span>
                </TabsTrigger>
                <TabsTrigger value="job" className="text-xs flex items-center gap-1.5 data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400 font-semibold">
                  <Briefcase className="h-3.5 w-3.5" />
                  <span>Job & Org</span>
                </TabsTrigger>
                <TabsTrigger value="bank" className="text-xs flex items-center gap-1.5 data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400 font-semibold">
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>Bank</span>
                </TabsTrigger>
                <TabsTrigger value="account" className="text-xs flex items-center gap-1.5 data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400 font-semibold">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Account</span>
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: Personal Details */}
              <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                      Employee ID / Code <span className="text-rose-400">*</span>
                    </label>
                    <Input
                      required
                      placeholder="e.g. EMP-1001"
                      value={formData.employeeCode}
                      onChange={(e) => handleChange('employeeCode', e.target.value)}
                      className="text-xs font-mono uppercase bg-zinc-900/90 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-zinc-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                      Work Email Address <span className="text-rose-400">*</span>
                    </label>
                    <Input
                      required
                      type="email"
                      placeholder="e.g. name@company.com"
                      value={formData.workEmail}
                      onChange={(e) => handleChange('workEmail', e.target.value)}
                      className="text-xs bg-zinc-900/90 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-zinc-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                      First Name <span className="text-rose-400">*</span>
                    </label>
                    <Input
                      required
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      className="text-xs bg-zinc-900/90 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-zinc-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                      Last Name <span className="text-rose-400">*</span>
                    </label>
                    <Input
                      required
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      className="text-xs bg-zinc-900/90 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-zinc-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                      Personal Email (Optional)
                    </label>
                    <Input
                      type="email"
                      placeholder="personal@email.com"
                      value={formData.personalEmail || ''}
                      onChange={(e) => handleChange('personalEmail', e.target.value)}
                      className="text-xs bg-zinc-900/90 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-zinc-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                      Phone Number
                    </label>
                    <Input
                      placeholder="+91 98765 43210"
                      value={formData.phone || ''}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="text-xs bg-zinc-900/90 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-zinc-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                      Date of Birth
                    </label>
                    <Input
                      type="date"
                      value={formData.dateOfBirth || ''}
                      onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                      className="text-xs bg-zinc-900/90 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-zinc-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                      Gender
                    </label>
                    <Select
                      value={formData.gender || 'MALE'}
                      onValueChange={(val) => handleChange('gender', val)}
                    >
                      <SelectTrigger className="bg-zinc-900/90 border-zinc-700 text-white text-xs">
                        <SelectValue placeholder="Gender" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="NON_BINARY">Non-Binary</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              {/* TAB 2: Job & Organization */}
              <TabsContent value="job" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                      Department <span className="text-rose-400">*</span>
                    </label>
                    <Select
                      value={formData.departmentId}
                      onValueChange={(val) => handleChange('departmentId', val)}
                    >
                      <SelectTrigger className="bg-zinc-900/90 border-zinc-700 text-white text-xs">
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        {options?.departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name} ({dept.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                      Job Position <span className="text-rose-400">*</span>
                    </label>
                    <Select
                      value={formData.jobPositionId}
                      onValueChange={(val) => handleChange('jobPositionId', val)}
                    >
                      <SelectTrigger className="bg-zinc-900/90 border-zinc-700 text-white text-xs">
                        <SelectValue placeholder="Select Job Position" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        {filteredJobPositions.map((pos) => (
                          <SelectItem key={pos.id} value={pos.id}>
                            {pos.title} ({pos.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                      Working Schedule <span className="text-rose-400">*</span>
                    </label>
                    <Select
                      value={formData.workingScheduleId}
                      onValueChange={(val) => handleChange('workingScheduleId', val)}
                    >
                      <SelectTrigger className="bg-zinc-900/90 border-zinc-700 text-white text-xs">
                        <SelectValue placeholder="Select Schedule" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        {options?.workingSchedules.map((sched) => (
                          <SelectItem key={sched.id} value={sched.id}>
                            {sched.name} ({sched.totalWeeklyHours}h/week)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                      Joining Date <span className="text-rose-400">*</span>
                    </label>
                    <Input
                      required
                      type="date"
                      value={formData.joiningDate}
                      onChange={(e) => handleChange('joiningDate', e.target.value)}
                      className="text-xs bg-zinc-900/90 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-zinc-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                      Employment Type <span className="text-rose-400">*</span>
                    </label>
                    <Select
                      value={formData.employmentType}
                      onValueChange={(val) =>
                        handleChange('employmentType', val as EmploymentType)
                      }
                    >
                      <SelectTrigger className="bg-zinc-900/90 border-zinc-700 text-white text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectItem value="FULL_TIME">Full Time</SelectItem>
                        <SelectItem value="PART_TIME">Part Time</SelectItem>
                        <SelectItem value="CONTRACT">Contract</SelectItem>
                        <SelectItem value="INTERN">Intern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                      Initial Status
                    </label>
                    <Select
                      value={formData.status}
                      onValueChange={(val) =>
                        handleChange('status', val as EmployeeStatus)
                      }
                    >
                      <SelectTrigger className="bg-zinc-900/90 border-zinc-700 text-white text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="PROBATION">Probation</SelectItem>
                        <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                      Direct Manager (Optional)
                    </label>
                    <Select
                      value={formData.managerId || 'NONE'}
                      onValueChange={(val) =>
                        handleChange('managerId', val === 'NONE' ? null : val)
                      }
                    >
                      <SelectTrigger className="bg-zinc-900/90 border-zinc-700 text-white text-xs">
                        <SelectValue placeholder="Select Manager" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectItem value="NONE">No Manager (Direct Executive)</SelectItem>
                        {options?.managers.map((mgr) => (
                          <SelectItem key={mgr.id} value={mgr.id}>
                            {mgr.fullName} ({mgr.employeeCode} - {mgr.workEmail})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              {/* TAB 3: Bank & Payroll */}
              <TabsContent value="bank" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                      Bank Name
                    </label>
                    <Input
                      placeholder="e.g. HDFC Bank, ICICI Bank"
                      value={formData.bankName || ''}
                      onChange={(e) => handleChange('bankName', e.target.value)}
                      className="text-xs bg-zinc-900/90 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-zinc-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                      Bank Account Number
                    </label>
                    <Input
                      placeholder="e.g. 50100234567890"
                      value={formData.bankAccountNumber || ''}
                      onChange={(e) => handleChange('bankAccountNumber', e.target.value)}
                      className="text-xs font-mono bg-zinc-900/90 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-zinc-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                      IFSC / Routing Code
                    </label>
                    <Input
                      placeholder="e.g. HDFC0001234"
                      value={formData.bankRoutingOrIfsc || ''}
                      onChange={(e) => handleChange('bankRoutingOrIfsc', e.target.value)}
                      className="text-xs font-mono bg-zinc-900/90 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-zinc-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                      Account Holder Name
                    </label>
                    <Input
                      placeholder="Full Legal Name on Account"
                      value={formData.bankAccountHolderName || ''}
                      onChange={(e) =>
                        handleChange('bankAccountHolderName', e.target.value)
                      }
                      className="text-xs bg-zinc-900/90 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-zinc-400"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* TAB 4: User Provisioning */}
              <TabsContent value="account" className="space-y-4">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="createUserAccount"
                      checked={formData.createUserAccount}
                      onChange={(e) =>
                        handleChange('createUserAccount', e.target.checked)
                      }
                      className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-white focus:ring-zinc-400 cursor-pointer"
                    />
                    <label
                      htmlFor="createUserAccount"
                      className="text-xs font-semibold text-white cursor-pointer"
                    >
                      Provision portal user login for this employee
                    </label>
                  </div>

                  {formData.createUserAccount && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-zinc-800">
                      <div>
                        <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                          Initial Password <span className="text-rose-400">*</span>
                        </label>
                        <Input
                          required={formData.createUserAccount}
                          type="password"
                          placeholder="Min 6 characters"
                          value={formData.userPassword || ''}
                          onChange={(e) => handleChange('userPassword', e.target.value)}
                          className="text-xs bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-zinc-400"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                          Assigned Security Role
                        </label>
                        <Select
                          value={formData.userRole}
                          onValueChange={(val) =>
                            handleChange('userRole', val as UserRole)
                          }
                        >
                          <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                            <SelectItem value="EMPLOYEE">Employee (Self-Service)</SelectItem>
                            <SelectItem value="HR_PAYROLL_USER">HR Payroll User</SelectItem>
                            <SelectItem value="HR_PAYROLL_MANAGER">HR Payroll Manager</SelectItem>
                            <SelectItem value="HR_MANAGER">HR Manager</SelectItem>
                            <SelectItem value="ADMIN">System Administrator</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="flex gap-2 sm:justify-end mt-6 pt-4 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createMutation.isPending}
              className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || isOptionsLoading}
              className="border border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800 hover:border-zinc-500 shadow-md font-bold"
            >
              {createMutation.isPending ? 'Onboarding...' : 'Onboard Employee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
