'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  Building2,
  Plus,
  Search,
  Briefcase,
  Users,
  X,
  Edit2,
  Trash2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewDeptModalOpen, setIsNewDeptModalOpen] = useState(false);
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);

  const [deptForm, setDeptForm] = useState({
    name: '',
    code: '',
    description: '',
  });

  const [jobForm, setJobForm] = useState({
    title: '',
    code: '',
    departmentId: '',
    description: '',
  });

  // Fetch Departments
  const { data: deptData, isLoading: isDeptLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/organization/departments');
      return res.data;
    },
  });

  // Fetch Job Positions
  const { data: jobsData } = useQuery({
    queryKey: ['job-positions'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/organization/job-positions');
      return res.data;
    },
  });

  // Create Dept Mutation
  const createDeptMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/organization/departments', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Department created successfully');
      setIsNewDeptModalOpen(false);
      setDeptForm({ name: '', code: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to create department'),
  });

  // Create Job Position Mutation
  const createJobMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/organization/job-positions', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Job position created successfully');
      setIsNewJobModalOpen(false);
      setJobForm({ title: '', code: '', departmentId: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ['job-positions'] });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to create job position'),
  });

  const departments = deptData?.departments || [];
  const jobs = jobsData?.jobPositions || [];

  const filteredDepts = departments.filter((d: any) =>
    d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            Departments & Job Positions
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Organize company hierarchy, operational cost centers, and designation roles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewJobModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            <Briefcase className="h-3.5 w-3.5 text-zinc-500" />
            Add Job Position
          </button>
          <button
            onClick={() => setIsNewDeptModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-950 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Department
          </button>
        </div>
      </div>

      {/* Grid: Departments cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isDeptLoading ? (
          <div className="col-span-3 py-12 text-center text-zinc-400">Loading departments...</div>
        ) : filteredDepts.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-zinc-400">
            No departments found. Create your first department.
          </div>
        ) : (
          filteredDepts.map((dept: any) => {
            const deptJobs = jobs.filter((j: any) => j.departmentId === dept.id);

            return (
              <div
                key={dept.id}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs hover:border-zinc-400 transition-all space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-white font-bold text-xs">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-950 text-sm">{dept.name}</h3>
                      <span className="font-mono text-[11px] font-bold text-zinc-400">
                        {dept.code}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-zinc-500 line-clamp-2">
                  {dept.description || 'No description added.'}
                </p>

                <div className="border-t border-zinc-100 pt-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    Job Positions ({deptJobs.length})
                  </div>
                  <div className="space-y-1.5">
                    {deptJobs.length === 0 ? (
                      <p className="text-xs text-zinc-400 italic">No job positions assigned</p>
                    ) : (
                      deptJobs.map((j: any) => (
                        <div
                          key={j.id}
                          className="flex items-center justify-between rounded-md bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-700"
                        >
                          <span>{j.title}</span>
                          <span className="font-mono text-[10px] text-zinc-400">{j.code}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Department Modal */}
      {isNewDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="text-base font-bold text-zinc-950">Add Department</h3>
              <button
                onClick={() => setIsNewDeptModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-900 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createDeptMutation.mutate(deptForm);
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  placeholder="e.g., Engineering"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:border-zinc-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Code *</label>
                <input
                  type="text"
                  required
                  value={deptForm.code}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., ENG"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs font-mono focus:border-zinc-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  placeholder="Responsibilities & scope..."
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:border-zinc-950 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsNewDeptModalOpen(false)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDeptMutation.isPending}
                  className="rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {createDeptMutation.isPending ? 'Saving...' : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Job Position Modal */}
      {isNewJobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="text-base font-bold text-zinc-950">Add Job Position</h3>
              <button
                onClick={() => setIsNewJobModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-900 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createJobMutation.mutate(jobForm);
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  value={jobForm.title}
                  onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                  placeholder="e.g., Staff Software Engineer"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:border-zinc-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Code *</label>
                <input
                  type="text"
                  required
                  value={jobForm.code}
                  onChange={(e) => setJobForm({ ...jobForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., STAFF_SWE"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs font-mono focus:border-zinc-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Department *</label>
                <select
                  required
                  value={jobForm.departmentId}
                  onChange={(e) => setJobForm({ ...jobForm, departmentId: e.target.value })}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs focus:border-zinc-950 focus:outline-none"
                >
                  <option value="" disabled>Select Department</option>
                  {departments.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsNewJobModalOpen(false)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createJobMutation.isPending}
                  className="rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {createJobMutation.isPending ? 'Saving...' : 'Save Job Position'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
