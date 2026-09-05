import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { HealthResponse } from '@/types/employee';

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      try {
        return await apiClient<HealthResponse>('/health');
      } catch {
        return {
          status: 'degraded',
          services: {
            database: 'disconnected',
            redis: 'disconnected',
          },
        };
      }
    },
    refetchInterval: 30000, // Check every 30s
  });
}
