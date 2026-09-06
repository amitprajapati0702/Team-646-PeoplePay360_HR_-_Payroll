'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import { AppShell } from '@/components/layout/AppShell';
import {
  DollarSign,
  Plus,
  Search,
  Layers,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Edit2,
  ArrowUpRight,
  Percent,
  Calculator,
  ListOrdered,
  X,
  PlusCircle,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  BASIC: { bg: 'bg-zinc-900 border border-zinc-700 text-white', text: 'text-white', label: 'Basic Base' },
  ALW: { bg: 'bg-zinc-900 border border-zinc-700 text-zinc-300', text: 'text-zinc-300', label: 'Allowance (+)' },
  GROSS: { bg: 'bg-zinc-800 border border-zinc-600 text-white', text: 'text-white', label: 'Gross Pay' },
  DED: { bg: 'bg-rose-950 border border-rose-800 text-rose-300', text: 'text-rose-300', label: 'Deduction (-)' },
  NET: { bg: 'bg-emerald-950 border border-emerald-800 text-emerald-300', text: 'text-emerald-300', label: 'Net Pay' },
};

export default function SalaryStructuresPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canEdit = ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_MANAGER'].includes(user?.role || '');
  const isReadOnly = user?.role === 'HR_PAYROLL_USER';

  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewStructureModalOpen, setIsNewStructureModalOpen] = useState(false);
  const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false);

  // Form states
  const [structureForm, setStructureForm] = useState({
    name: '',
    code: '',
    description: '',
  });

  const [ruleForm, setRuleForm] = useState({
    name: '',
    code: '',
    category: 'ALW',
    calculationType: 'PERCENTAGE',
    percentage: 10,
    amount: 0,
    baseRuleCode: 'BASIC',
    sequence: 10,
    condition: '',
  });

  // Fetch all structures
  const { data: structuresData, isLoading: isStructuresLoading } = useQuery({
    queryKey: ['salary-structures'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/salary-structures');
      return res.data;
    },
  });

  const structures = Array.isArray(structuresData) ? structuresData : (structuresData?.structures || structuresData?.data || []);
  const activeStructure = structures.find((s: any) => s.id === selectedStructureId) || structures[0];

  // Fetch detailed active structure with rules
  const { data: structureDetailData } = useQuery({
    queryKey: ['salary-structure-detail', activeStructure?.id],
    queryFn: async () => {
      if (!activeStructure?.id) return null;
      const res = await apiClient.get<any>(`/salary-structures/${activeStructure.id}`);
      return res?.data || res;
    },
    enabled: !!activeStructure?.id,
  });

  // Create Structure Mutation
  const createStructureMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post<any>('/salary-structures', data);
      return res.data;
    },
    onSuccess: (newStruct: any) => {
      toast.success('Salary structure created successfully');
      setIsNewStructureModalOpen(false);
      setStructureForm({ name: '', code: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ['salary-structures'] });
      setSelectedStructureId(newStruct?.id || newStruct?.data?.id);
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to create structure'),
  });

  // Add Rule Mutation
  const addRuleMutation = useMutation({
    mutationFn: async ({ structureId, data }: { structureId: string; data: any }) => {
      const payload = {
        name: data.name,
        code: data.code,
        categoryId: data.category,
        category: data.category,
        computationType: data.calculationType,
        calculationType: data.calculationType,
        fixedAmount: Number(data.amount || 0),
        amount: Number(data.amount || 0),
        percentage: Number(data.percentage || 0),
        percentageBaseRuleCode: data.baseRuleCode || undefined,
        baseRuleCode: data.baseRuleCode || undefined,
        sequence: Number(data.sequence || 10),
        conditionExpression: data.condition || undefined,
      };
      const createdRule = await apiClient.post<any>('/salary-structures/rules', payload);
      const ruleId = createdRule?.data?.id || createdRule?.id;
      await apiClient.post(`/salary-structures/${structureId}/rules`, {
        salaryRuleId: ruleId,
        ruleId: ruleId,
        sequenceOverride: Number(data.sequence || 10),
      });
      return createdRule;
    },
    onSuccess: () => {
      toast.success('Rule attached to structure successfully');
      setIsAddRuleModalOpen(false);
      setRuleForm({
        name: '',
        code: '',
        category: 'ALW',
        calculationType: 'PERCENTAGE',
        percentage: 10,
        amount: 0,
        baseRuleCode: 'BASIC',
        sequence: 10,
        condition: '',
      });
      queryClient.invalidateQueries({ queryKey: ['salary-structure-detail', activeStructure?.id] });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to add rule'),
  });

  // Remove Rule Mutation
  const removeRuleMutation = useMutation({
    mutationFn: async ({ structureId, ruleId }: { structureId: string; ruleId: string }) => {
      const res = await apiClient.delete(`/salary-structures/${structureId}/rules/${ruleId}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Rule removed from structure');
      queryClient.invalidateQueries({ queryKey: ['salary-structure-detail', activeStructure?.id] });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to remove rule'),
  });

  const structureDetail = structureDetailData || activeStructure;
  const rules = structureDetail?.structureRules?.map((sr: any) => ({
    ...sr.rule,
    sequence: sr.sequence,
  })) || [];

  return (
    <AppShell
      title="Salary Structures & Rules"
      subtitle="Configure dynamic calculation formulas, statutory allowances, and deductions"
      searchQuery={searchTerm}
      onSearchChange={setSearchTerm}
    >
      <div className="space-y-6 max-w-7xl mx-auto text-white">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-white">
                Salary Structures & Calculation Rules
              </h1>
              {isReadOnly && (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-700 text-[11px] font-semibold text-zinc-300">
                  <Lock className="h-3 w-3 text-zinc-400" />
                  Read-Only Mode
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Configure dynamic calculation formulas, statutory allowances, tax deductions, and gross-to-net sequencing.
            </p>
          </div>

          {canEdit ? (
            <button
              onClick={() => setIsNewStructureModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-zinc-800 hover:border-zinc-500 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 text-white" />
              <span>Create Structure</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-500">
              <ShieldCheck className="h-4 w-4 text-zinc-500" />
              <span>Read-only access</span>
            </div>
          )}
        </div>

        {/* Main Grid: Left List + Right Detail */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left column: Structures List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="rounded-xl border border-zinc-800 bg-[#121215] p-4 shadow-md">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                Salary Structures ({structures.length})
              </h2>

              {isStructuresLoading ? (
                <div className="py-8 text-center text-zinc-400">Loading structures...</div>
              ) : (
                <div className="space-y-2">
                  {structures.map((s: any) => {
                    const isSelected = (activeStructure?.id === s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => setSelectedStructureId(s.id)}
                        className={cn(
                          'cursor-pointer rounded-lg border p-3 transition-all text-left group',
                          isSelected
                            ? 'border-zinc-500 bg-zinc-900 shadow-md'
                            : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white group-hover:text-white">
                            {s.name}
                          </span>
                          <span className="rounded font-mono text-[10px] font-bold text-zinc-300 bg-zinc-900 border border-zinc-700 px-1.5 py-0.5">
                            {s.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">
                          {s.description || 'No description provided'}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500">
                          <span>{s.rulesCount || s.structureRules?.length || 0} calculation rules</span>
                          {isSelected && <span className="font-bold text-white">Active</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right column: Active Structure Rules & Formula Breakdown */}
          <div className="lg:col-span-8 space-y-4">
            {activeStructure ? (
              <div className="rounded-xl border border-zinc-800 bg-[#121215] p-6 shadow-md space-y-5">
                {/* Structure Banner */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white">{activeStructure.name}</h2>
                      <span className="rounded bg-zinc-900 border border-zinc-700 px-2 py-0.5 font-mono text-xs font-bold text-zinc-300">
                        {activeStructure.code}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{activeStructure.description}</p>
                  </div>

                  {canEdit && (
                    <button
                      onClick={() => setIsAddRuleModalOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      <PlusCircle className="h-3.5 w-3.5 text-zinc-300" />
                      <span>Add Rule</span>
                    </button>
                  )}
                </div>

                {/* Rules List Table */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Execution Pipeline & Salary Formula Rules
                    </h3>
                    <span className="text-[11px] text-zinc-500">Ascending execution sequence (Seq #)</span>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-zinc-800">
                    <table className="min-w-full divide-y divide-zinc-800">
                      <thead className="bg-zinc-900/80">
                        <tr>
                          <th className="px-4 py-2.5 text-left text-xs font-bold uppercase text-zinc-400">Seq</th>
                          <th className="px-4 py-2.5 text-left text-xs font-bold uppercase text-zinc-400">Rule Name</th>
                          <th className="px-4 py-2.5 text-left text-xs font-bold uppercase text-zinc-400">Code</th>
                          <th className="px-4 py-2.5 text-left text-xs font-bold uppercase text-zinc-400">Category</th>
                          <th className="px-4 py-2.5 text-left text-xs font-bold uppercase text-zinc-400">Calculation Formula</th>
                          <th className="px-4 py-2.5 text-right text-xs font-bold uppercase text-zinc-400">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 bg-[#121215]">
                        {rules.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-xs text-zinc-400">
                              No rules attached to this structure yet. Click "Add Rule" to configure.
                            </td>
                          </tr>
                        ) : (
                          rules
                            .sort((a: any, b: any) => (a.sequence || 0) - (b.sequence || 0))
                            .map((rule: any) => {
                              const badge = CATEGORY_BADGES[rule.category] || {
                                bg: 'bg-zinc-900 text-zinc-300 border border-zinc-700',
                                label: rule.category,
                              };

                              let calcDisplay = '';
                              if (rule.calculationType === 'PERCENTAGE') {
                                calcDisplay = `${rule.percentage}% of ${rule.baseRuleCode || 'BASIC'}`;
                              } else if (rule.calculationType === 'FIXED') {
                                calcDisplay = `Fixed ₹${Number(rule.amount || 0).toLocaleString('en-IN')}`;
                              } else if (rule.calculationType === 'FORMULA') {
                                calcDisplay = `Formula (${rule.code})`;
                              }

                              return (
                                <tr key={rule.id} className="hover:bg-zinc-900/60 transition-colors">
                                  <td className="px-4 py-3 whitespace-nowrap text-xs font-mono font-bold text-zinc-500">
                                    #{rule.sequence}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap font-bold text-white text-xs">
                                    {rule.name}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap font-mono text-xs font-bold text-zinc-300">
                                    {rule.code}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span
                                      className={cn(
                                        'inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold',
                                        badge.bg
                                      )}
                                    >
                                      {badge.label}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-zinc-200 bg-zinc-900/60 rounded">
                                    {calcDisplay}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-right text-xs">
                                    {canEdit ? (
                                      <button
                                        onClick={() =>
                                          removeRuleMutation.mutate({
                                            structureId: activeStructure.id,
                                            ruleId: rule.id,
                                          })
                                        }
                                        className="text-zinc-500 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                                        title="Remove rule"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    ) : (
                                      <span className="text-zinc-600 inline-block p-1" title="Read only">
                                        <Lock className="h-3.5 w-3.5 text-zinc-600" />
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Engine Architecture Callout */}
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-1 flex items-center gap-1.5">
                    <Calculator className="h-3.5 w-3.5 text-zinc-300" />
                    Salary Engine Execution Order
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    During payrun processing, the engine initializes from Contract Wage (<strong>BASIC</strong>), computes proportional Attendance days, applies all Allowance rules (<strong>ALW</strong>) to form <strong>GROSS</strong>, deducts statutory PF/Tax (<strong>DED</strong>), and finalizes <strong>NET PAY</strong>.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-800 bg-[#121215] p-12 text-center text-zinc-500">
                Select or create a salary structure to view details.
              </div>
            )}
          </div>
        </div>

        {/* New Structure Modal */}
        {isNewStructureModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-[#121215] p-6 shadow-2xl border border-zinc-800 text-white">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-base font-bold text-white">Create Salary Structure</h3>
                <button
                  onClick={() => setIsNewStructureModalOpen(false)}
                  className="text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createStructureMutation.mutate(structureForm);
                }}
                className="mt-4 space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Structure Name *</label>
                  <input
                    type="text"
                    required
                    value={structureForm.name}
                    onChange={(e) => setStructureForm({ ...structureForm, name: e.target.value })}
                    placeholder="e.g., Executive Package"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Unique Code *</label>
                  <input
                    type="text"
                    required
                    value={structureForm.code}
                    onChange={(e) => setStructureForm({ ...structureForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., EXEC_PACKAGE"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-mono text-white focus:border-zinc-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={structureForm.description}
                    onChange={(e) => setStructureForm({ ...structureForm, description: e.target.value })}
                    placeholder="Eligible job positions..."
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsNewStructureModalOpen(false)}
                    className="rounded-lg border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createStructureMutation.isPending}
                    className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-zinc-800 hover:border-zinc-500 disabled:opacity-50"
                  >
                    {createStructureMutation.isPending ? 'Saving...' : 'Create Structure'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Rule Modal */}
        {isAddRuleModalOpen && activeStructure && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-2xl bg-[#121215] p-6 shadow-2xl border border-zinc-800 text-white">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">Add Calculation Rule</h3>
                  <p className="text-xs text-zinc-400">Adding to {activeStructure.name}</p>
                </div>
                <button
                  onClick={() => setIsAddRuleModalOpen(false)}
                  className="text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addRuleMutation.mutate({
                    structureId: activeStructure.id,
                    data: ruleForm,
                  });
                }}
                className="mt-4 space-y-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Rule Name *</label>
                    <input
                      type="text"
                      required
                      value={ruleForm.name}
                      onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                      placeholder="e.g., Housing Allowance"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Rule Code *</label>
                    <input
                      type="text"
                      required
                      value={ruleForm.code}
                      onChange={(e) => setRuleForm({ ...ruleForm, code: e.target.value.toUpperCase() })}
                      placeholder="e.g., HRA"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-mono text-white focus:border-zinc-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Category *</label>
                    <select
                      value={ruleForm.category}
                      onChange={(e) => setRuleForm({ ...ruleForm, category: e.target.value })}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                    >
                      <option value="BASIC">Basic</option>
                      <option value="ALW">Allowance</option>
                      <option value="GROSS">Gross</option>
                      <option value="DED">Deduction</option>
                      <option value="NET">Net Pay</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Calculation Type *</label>
                    <select
                      value={ruleForm.calculationType}
                      onChange={(e) => setRuleForm({ ...ruleForm, calculationType: e.target.value })}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed Amount (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Sequence # *</label>
                    <input
                      type="number"
                      required
                      value={ruleForm.sequence}
                      onChange={(e) => setRuleForm({ ...ruleForm, sequence: Number(e.target.value) })}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs focus:border-zinc-400 focus:outline-none font-mono text-white"
                    />
                  </div>
                </div>

                {ruleForm.calculationType === 'PERCENTAGE' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">Percentage (%) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={ruleForm.percentage}
                        onChange={(e) => setRuleForm({ ...ruleForm, percentage: Number(e.target.value) })}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">Base Rule Code</label>
                      <input
                        type="text"
                        value={ruleForm.baseRuleCode}
                        onChange={(e) => setRuleForm({ ...ruleForm, baseRuleCode: e.target.value.toUpperCase() })}
                        placeholder="e.g., BASIC or GROSS"
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-mono text-white focus:border-zinc-400 focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Fixed Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      value={ruleForm.amount}
                      onChange={(e) => setRuleForm({ ...ruleForm, amount: Number(e.target.value) })}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsAddRuleModalOpen(false)}
                    className="rounded-lg border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addRuleMutation.isPending}
                    className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-zinc-800 hover:border-zinc-500 disabled:opacity-50"
                  >
                    {addRuleMutation.isPending ? 'Adding Rule...' : 'Attach Rule'}
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
