import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient, ApiError } from '@/lib/api-client';
import type {
  EmployeeListItem,
  EmployeeSmartView,
  KanbanGroupItem,
  ReportingTreeResponse,
  ApiResponse,
  QueryEmployeesInput,
  CreateEmployeePayload,
  UpdateEmployeePayload,
  UpdateEmployeeStatusPayload,
  FormOptionsResponse,
} from '@/types/employee';

// Query Keys Constants
export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (filters: QueryEmployeesInput) => [...employeeKeys.lists(), filters] as const,
  details: () => [...employeeKeys.all, 'detail'] as const,
  detail: (id: string) => [...employeeKeys.details(), id] as const,
  kanban: (groupBy: string) => [...employeeKeys.all, 'kanban', groupBy] as const,
  hierarchy: (id: string) => [...employeeKeys.all, 'hierarchy', id] as const,
  formOptions: () => [...employeeKeys.all, 'formOptions'] as const,
};

// Form Options Hook (Departments, Positions, Schedules, Managers)
export function useEmployeeFormOptions() {
  return useQuery({
    queryKey: employeeKeys.formOptions(),
    queryFn: async () => {
      const response = await apiClient<ApiResponse<FormOptionsResponse>>('/employees/form-options');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// 1. List Employees Hook (Paginated & Filtered)
export function useEmployees(filters: QueryEmployeesInput = {}) {
  return useQuery({
    queryKey: employeeKeys.list(filters),
    queryFn: async () => {
      const response = await apiClient<ApiResponse<EmployeeListItem[]>>('/employees', {
        params: filters as Record<string, string | number | boolean | undefined | null>,
      });
      return response;
    },
  });
}

// 2. Single Employee Smart View Hook
export function useEmployee(id: string | null) {
  return useQuery({
    queryKey: employeeKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null;
      const response = await apiClient<ApiResponse<EmployeeSmartView>>(`/employees/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

// 3. Kanban View Hook
export function useEmployeeKanban(groupBy: 'status' | 'department' | 'employmentType' = 'status') {
  return useQuery({
    queryKey: employeeKeys.kanban(groupBy),
    queryFn: async () => {
      const response = await apiClient<ApiResponse<KanbanGroupItem[]>>('/employees/kanban', {
        params: { groupBy },
      });
      return response.data;
    },
  });
}

// 4. Employee Reporting Hierarchy Hook
export function useEmployeeHierarchy(id: string | null) {
  return useQuery({
    queryKey: employeeKeys.hierarchy(id || ''),
    queryFn: async () => {
      if (!id) return null;
      const response = await apiClient<ApiResponse<ReportingTreeResponse>>(
        `/employees/${id}/hierarchy`
      );
      return response.data;
    },
    enabled: !!id,
  });
}

// 5. Create Employee Mutation
export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateEmployeePayload) => {
      const response = await apiClient<ApiResponse<EmployeeSmartView>>('/employees', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Employee ${data.fullName || data.employeeCode} created successfully!`);
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to create employee.');
    },
  });
}

// 6. Update Employee Mutation
export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateEmployeePayload }) => {
      const response = await apiClient<ApiResponse<EmployeeSmartView>>(`/employees/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      toast.success('Employee profile updated successfully.');
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeKeys.kanban('status') });
      queryClient.invalidateQueries({ queryKey: employeeKeys.kanban('department') });
      queryClient.invalidateQueries({ queryKey: employeeKeys.kanban('employmentType') });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to update employee.');
    },
  });
}

// 7. Update Employee Status Mutation
export function useUpdateEmployeeStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateEmployeeStatusPayload }) => {
      const response = await apiClient<ApiResponse<EmployeeSmartView>>(`/employees/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      toast.success(`Status updated to ${variables.data.status}`);
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to update employee status.');
    },
  });
}

// 8. Delete Employee Mutation
export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient<ApiResponse<{ id: string }>>(`/employees/${id}`, {
        method: 'DELETE',
      });
      return response;
    },
    onSuccess: () => {
      toast.success('Employee deleted successfully.');
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to delete employee.');
    },
  });
}
