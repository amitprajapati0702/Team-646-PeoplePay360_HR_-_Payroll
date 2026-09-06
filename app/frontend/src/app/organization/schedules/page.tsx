'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  Clock,
  Plus,
  Search,
  Calendar,
  X,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/providers/AuthProvider';

export default function WorkingSchedulesPage() {
  const { user } = useAuth();
  const isEmployee = user?.role === 'EMPLOYEE';
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    hoursPerDay: 8,
    hoursPerWeek: 40,
    workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    description: '',
  });

  // Fetch Schedules
  const { data: schedulesData, isLoading } = useQuery({
    queryKey: ['working-schedules'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/organization/working-schedules');
      return res.data;
    },
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/organization/working-schedules', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Working schedule created successfully');
      setIsModalOpen(false);
      setFormData({
        name: '',
        hoursPerDay: 8,
        hoursPerWeek: 40,
        workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
        description: '',
      });
      queryClient.invalidateQueries({ queryKey: ['working-schedules'] });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to create schedule'),
  });

  const schedules = Array.isArray(schedulesData)
    ? schedulesData
    : (schedulesData?.workingSchedules || (schedulesData as any)?.data || []);
  const daysList = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

  const toggleDay = (day: string) => {
    const nextDays = formData.workingDays.includes(day)
      ? formData.workingDays.filter((d) => d !== day)
      : [...formData.workingDays, day];
    setFormData({
      ...formData,
      workingDays: nextDays,
      hoursPerWeek: nextDays.length * formData.hoursPerDay,
    });
  };

  return (
    <AppShell
      title="Work Schedule Management"
      subtitle="Define work week hours, working days, and attendance baseline policies for employees."
    >
      <div className="space-y-6 max-w-7xl mx-auto text-white">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-5">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Working Schedules
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Define work week hours, working days, shifts, and attendance baseline policies for employees.
            </p>
          </div>

          {!isEmployee && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-zinc-800 hover:border-zinc-500 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 text-white" />
              <span>Create Schedule</span>
            </button>
          )}
        </div>

        {/* Grid of Schedules */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-3 py-12 text-center text-zinc-400">Loading schedules...</div>
          ) : (
            schedules.map((schedule: any) => {
              const activeDays = Array.isArray(schedule.workingDays)
                ? schedule.workingDays
                : typeof schedule.workingDays === 'string'
                ? JSON.parse(schedule.workingDays)
                : ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

              return (
                <div
                  key={schedule.id}
                  className="rounded-xl border border-zinc-800 bg-[#121215] p-5 shadow-md hover:border-zinc-600 transition-all space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-700 text-white font-bold text-xs">
                      <Clock className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{schedule.name}</h3>
                      <div className="text-[11px] text-zinc-400 font-mono">
                        {schedule.hoursPerDay}h/day • {schedule.hoursPerWeek}h/week
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2">
                    {schedule.description || 'Standard full-time organizational schedule.'}
                  </p>

                  <div className="border-t border-zinc-800 pt-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                      Active Working Days
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {daysList.map((day) => {
                        const isWorking = activeDays.includes(day);
                        return (
                          <span
                            key={day}
                            className={cn(
                              'rounded px-2 py-0.5 text-[10px] font-bold border',
                              isWorking
                                ? 'bg-zinc-800 text-white border-zinc-700'
                                : 'bg-zinc-950 text-zinc-600 border-zinc-900'
                            )}
                          >
                            {day.slice(0, 3)}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Create Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-[#121215] p-6 shadow-2xl border border-zinc-800 text-white">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-base font-bold text-white">Create Working Schedule</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createMutation.mutate(formData);
                }}
                className="mt-4 space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Schedule Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Morning Shift (40-Hour)"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Hours / Day *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={24}
                      value={formData.hoursPerDay}
                      onChange={(e) => {
                        const hpd = Number(e.target.value) || 0;
                        setFormData({
                          ...formData,
                          hoursPerDay: hpd,
                          hoursPerWeek: formData.workingDays.length * hpd,
                        });
                      }}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-mono text-white focus:border-zinc-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Hours / Week <span className="text-[10px] text-emerald-400 font-normal">(Auto)</span>
                    </label>
                    <input
                      type="number"
                      readOnly
                      value={formData.hoursPerWeek}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none cursor-not-allowed"
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">
                      {formData.workingDays.length} days × {formData.hoursPerDay}h
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Working Days</label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {daysList.map((day) => {
                      const isSelected = formData.workingDays.includes(day);
                      return (
                        <button
                          type="button"
                          key={day}
                          onClick={() => toggleDay(day)}
                          className={cn(
                            'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer border',
                            isSelected
                              ? 'bg-zinc-800 text-white border-zinc-600'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-white'
                          )}
                        >
                          {day.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Shift timings, break schedule..."
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-lg border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-zinc-800 hover:border-zinc-500 disabled:opacity-50 cursor-pointer"
                  >
                    {createMutation.isPending ? 'Saving...' : 'Save Schedule'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
