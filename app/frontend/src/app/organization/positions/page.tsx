'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiResponse } from '@/lib/api-client';
import { toast } from 'sonner';
import { AppShell } from '@/components/layout/AppShell';
import {
  Briefcase,
  Plus,
  Building2,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';

interface Department {
  id: string;
  name: string;
  code: string;
  description?: string | null;
}

interface JobPosition {
  id: string;
  title: string;
  code: string;
  departmentId: string;
  department?: Department;
  description?: string | null;
  minSalary?: number | null;
  maxSalary?: number | null;
  isActive: boolean;
}

interface DeptsResponse {
  departments: Department[];
}

interface JobsResponse {
  jobPositions: JobPosition[];
}

export default function PositionsPage() {
  const { user } = useAuth();
  const isEmployee = user?.role === 'EMPLOYEE';
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const [form, setForm] = useState({
    title: '',
    code: '',
    departmentId: '',
    description: '',
    minSalary: '',
    maxSalary: '',
  });

  // Fetch Departments
  const { data: deptData } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<DeptsResponse>>('/organization/departments');
      return res.data;
    },
  });

  // Fetch Job Positions
  const { data: jobsData, isLoading: isJobsLoading } = useQuery({
    queryKey: ['job-positions'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<JobsResponse>>('/organization/job-positions');
      return res.data;
    },
  });

  // Create Job Position Mutation
  const createJobMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      code: string;
      departmentId: string;
      description?: string;
      minSalary?: number;
      maxSalary?: number;
    }) => {
      const res = await apiClient.post('/organization/job-positions', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Job Position created successfully');
      setIsNewModalOpen(false);
      setForm({
        title: '',
        code: '',
        departmentId: '',
        description: '',
        minSalary: '',
        maxSalary: '',
      });
      queryClient.invalidateQueries({ queryKey: ['job-positions'] });
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to create job position';
      toast.error(msg);
    },
  });

  const departments: Department[] = Array.isArray(deptData)
    ? (deptData as Department[])
    : (deptData?.departments || (deptData as any)?.data || []);
  const positions: JobPosition[] = Array.isArray(jobsData)
    ? (jobsData as JobPosition[])
    : (jobsData?.jobPositions || (jobsData as any)?.data || []);

  const filteredPositions = positions.filter((p) => {
    const matchesSearch =
      p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.department?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDeptFilter === 'ALL' || p.departmentId === selectedDeptFilter;
    return matchesSearch && matchesDept;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.code || !form.departmentId) {
      toast.error('Title, Code and Department are required');
      return;
    }

    createJobMutation.mutate({
      title: form.title,
      code: form.code,
      departmentId: form.departmentId,
      description: form.description || undefined,
      minSalary: form.minSalary ? Number(form.minSalary) : undefined,
      maxSalary: form.maxSalary ? Number(form.maxSalary) : undefined,
    });
  };

  return (
    <AppShell
      title="Job Positions & Roles"
      subtitle="Define organizational designations, job codes, departmental linkages, and salary brackets"
      searchQuery={searchTerm}
      onSearchChange={setSearchTerm}
    >
      <div className="space-y-6 max-w-7xl mx-auto text-white">
        {/* Header Summary & Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-5">
          <div>
            <h2 className="text-xl font-black tracking-tight text-white">
              Job Position Directory
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Manage designations for payroll structures and recruitment levels.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              aria-label="Filter positions by department"
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 focus:border-zinc-400 focus:outline-none"
            >
              <option value="ALL" className="bg-zinc-900 text-white">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id} className="bg-zinc-900 text-white">
                  {d.name} ({d.code})
                </option>
              ))}
            </select>

            {!isEmployee && (
              <button
                onClick={() => setIsNewModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-zinc-800 hover:border-zinc-500 transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Position</span>
              </button>
            )}
          </div>
        </div>

        {/* Position Cards Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isJobsLoading ? (
            <div className="col-span-3 py-16 text-center text-zinc-400">
              Loading job positions...
            </div>
          ) : filteredPositions.length === 0 ? (
            <div className="col-span-3 py-16 text-center rounded-2xl border border-zinc-800 bg-[#121215] p-8">
              <Briefcase className="h-10 w-10 mx-auto text-zinc-500 mb-2" />
              <p className="text-sm font-bold text-white">No job positions found</p>
              <p className="text-xs text-zinc-400 mt-1">
                Create new designations or clear search filters.
              </p>
            </div>
          ) : (
            filteredPositions.map((pos) => {
              const dept = departments.find((d) => d.id === pos.departmentId) || pos.department;

              return (
                <div
                  key={pos.id}
                  className="rounded-xl border border-zinc-800 bg-[#121215] p-5 shadow-md hover:border-zinc-700 transition-all space-y-4 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-white font-bold text-xs">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">{pos.title}</h3>
                        <span className="font-mono text-[11px] font-bold text-zinc-400">
                          {pos.code}
                        </span>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border',
                        pos.isActive !== false
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-700'
                      )}
                    >
                      {pos.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-zinc-500" />
                        Department
                      </span>
                      <span className="font-semibold text-white">
                        {dept?.name || 'General Operations'}
                      </span>
                    </div>

                    {(pos.minSalary || pos.maxSalary) && (
                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5 text-zinc-500" />
                          Salary Bracket
                        </span>
                        <span className="font-mono font-bold text-emerald-400">
                          ₹{Number(pos.minSalary || 0).toLocaleString('en-IN')} - ₹{Number(pos.maxSalary || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2 border-t border-zinc-800/80 pt-3">
                    {pos.description || 'Standard responsibilities under this designation.'}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* New Job Position Modal */}
        {isNewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-[#121215] p-6 shadow-2xl border border-zinc-800 text-white">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-base font-bold text-white">Create Job Position</h3>
                <button
                  onClick={() => setIsNewModalOpen(false)}
                  className="text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Job Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g., Senior Software Engineer"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Code <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      placeholder="e.g., SR_SWE"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-mono text-white placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Department <span className="text-rose-400">*</span>
                    </label>
                    <select
                      required
                      value={form.departmentId}
                      onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                    >
                      <option value="" disabled className="bg-zinc-900 text-zinc-400">
                        Select
                      </option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id} className="bg-zinc-900 text-white">
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Min Salary (₹)
                    </label>
                    <input
                      type="number"
                      value={form.minSalary}
                      onChange={(e) => setForm({ ...form, minSalary: e.target.value })}
                      placeholder="40000"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-mono text-white placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Max Salary (₹)
                    </label>
                    <input
                      type="number"
                      value={form.maxSalary}
                      onChange={(e) => setForm({ ...form, maxSalary: e.target.value })}
                      placeholder="95000"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-mono text-white placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Job Description
                  </label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Key responsibilities and qualifications..."
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsNewModalOpen(false)}
                    className="rounded-lg border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createJobMutation.isPending}
                    className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-zinc-800 hover:border-zinc-500 disabled:opacity-50 cursor-pointer"
                  >
                    {createJobMutation.isPending ? 'Saving...' : 'Save Position'}
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
