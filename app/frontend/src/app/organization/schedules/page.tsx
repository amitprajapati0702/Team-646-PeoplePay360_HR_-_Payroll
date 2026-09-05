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

export default function WorkingSchedulesPage() {
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

  const schedules = schedulesData?.workingSchedules || [];
  const daysList = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

  const toggleDay = (day: string) => {
    if (formData.workingDays.includes(day)) {
      setFormData({ ...formData, workingDays: formData.workingDays.filter((d) => d !== day) });
    } else {
      setFormData({ ...formData, workingDays: [...formData.workingDays, day] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            Working Schedules
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Define work week hours, working days, and attendance baseline policies for employees.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Create Schedule
        </button>
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
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs hover:border-zinc-400 transition-all space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-white font-bold text-xs">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-950 text-sm">{schedule.name}</h3>
                    <div className="text-[11px] text-zinc-500 font-mono">
                      {schedule.hoursPerDay}h/day • {schedule.hoursPerWeek}h/week
                    </div>
                  </div>
                </div>

                <p className="text-xs text-zinc-500 line-clamp-2">
                  {schedule.description || 'Standard full-time organizational schedule.'}
                </p>

                <div className="border-t border-zinc-100 pt-3">
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
                            'rounded px-2 py-0.5 text-[10px] font-bold',
                            isWorking
                              ? 'bg-zinc-950 text-white'
                              : 'bg-zinc-100 text-zinc-400'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="text-base font-bold text-zinc-950">Create Working Schedule</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-900 cursor-pointer">
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
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Schedule Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Standard 40-Hour Week"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:border-zinc-950 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Hours / Day *</label>
                  <input
                    type="number"
                    required
                    value={formData.hoursPerDay}
                    onChange={(e) => setFormData({ ...formData, hoursPerDay: Number(e.target.value) })}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:border-zinc-950 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Hours / Week *</label>
                  <input
                    type="number"
                    required
                    value={formData.hoursPerWeek}
                    onChange={(e) => setFormData({ ...formData, hoursPerWeek: Number(e.target.value) })}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:border-zinc-950 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Working Days</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {daysList.map((day) => {
                    const isSelected = formData.workingDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={cn(
                          'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer',
                          isSelected
                            ? 'bg-zinc-950 text-white'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        )}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Overtime policies..."
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:border-zinc-950 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
