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
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Shield, Mail, Lock, User, CheckCircle2 } from 'lucide-react';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'EMPLOYEE' as 'EMPLOYEE' | 'HR_MANAGER' | 'HR_PAYROLL_USER' | 'HR_PAYROLL_MANAGER',
    password: 'Password@123',
    confirmPassword: 'Password@123',
  });

  const createUserMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const res = await apiClient.post<{ success: boolean; message: string; data: any }>(
        '/auth/register',
        payload
      );
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'New user account created successfully!');
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      if (onSuccess) onSuccess();
      onClose();
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        role: 'EMPLOYEE',
        password: 'Password@123',
        confirmPassword: 'Password@123',
      });
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to create user account. Please check your inputs.';
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('First and last names are required.');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Email address is required.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    createUserMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] bg-[#121215] border border-zinc-800 text-white p-6 shadow-2xl rounded-2xl">
        <DialogHeader className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-700 text-white">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white">Create New User Account</DialogTitle>
              <DialogDescription className="text-xs text-zinc-400">
                HR Manager privilege: Provision a new system user login and role.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">First Name</label>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                <Input
                  required
                  placeholder="e.g. John"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="pl-8 bg-zinc-900/80 border-zinc-800 text-xs h-9 text-white focus:border-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Last Name</label>
              <Input
                required
                placeholder="e.g. Doe"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="bg-zinc-900/80 border-zinc-800 text-xs h-9 text-white focus:border-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Work Email</label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
              <Input
                required
                type="email"
                placeholder="john.doe@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pl-8 bg-zinc-900/80 border-zinc-800 text-xs h-9 text-white focus:border-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Assigned Role</label>
            <div className="relative">
              <Shield className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full pl-8 pr-3 bg-zinc-900/80 border border-zinc-800 rounded-lg text-xs h-9 text-white focus:border-white focus:outline-none appearance-none cursor-pointer"
              >
                <option value="EMPLOYEE">EMPLOYEE (Standard Self-Service)</option>
                <option value="HR_MANAGER">HR_MANAGER (Workforce & Leave Administration)</option>
                <option value="HR_PAYROLL_USER">HR_PAYROLL_USER (Payroll & Contract Processing)</option>
                <option value="HR_PAYROLL_MANAGER">HR_PAYROLL_MANAGER (Full HR & Payroll Validation)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Initial Password</label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                <Input
                  required
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-8 bg-zinc-900/80 border-zinc-800 text-xs h-9 text-white focus:border-white font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Confirm Password</label>
              <Input
                required
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="bg-zinc-900/80 border-zinc-800 text-xs h-9 text-white focus:border-white font-mono"
              />
            </div>
          </div>

          <div className="rounded-lg border border-emerald-950/60 bg-emerald-950/20 p-2.5 flex items-start gap-2 text-[11px] text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              The user can immediately log in with these credentials. Initial password meets high-security complexity criteria.
            </span>
          </div>

          <DialogFooter className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-800/80">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs h-8 px-3 border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createUserMutation.isPending}
              className="text-xs h-8 px-4 font-bold bg-white text-black hover:bg-zinc-200 cursor-pointer"
            >
              {createUserMutation.isPending ? 'Creating...' : 'Create User Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
