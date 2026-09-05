const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export class ApiError extends Error {
  statusCode: number;
  errorCode?: string;
  details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode?: string,
    details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pp360_token');
}

export async function apiClient<T = ApiResponse<unknown>>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, headers, ...customConfig } = options;

  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const token = getAuthToken();
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, {
    ...customConfig,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
  });

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage =
      data?.message || data?.error || `Request failed with status ${response.status}`;
    throw new ApiError(
      errorMessage,
      response.status,
      data?.errorCode || data?.errorcode,
      data?.errors
    );
  }

  return data as T;
}

apiClient.get = function <T = ApiResponse<unknown>>(endpoint: string, options?: RequestOptions): Promise<T> {
  return apiClient<T>(endpoint, { ...options, method: 'GET' });
};

apiClient.post = function <T = ApiResponse<unknown>>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
};

apiClient.put = function <T = ApiResponse<unknown>>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
};

apiClient.patch = function <T = ApiResponse<unknown>>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
};

apiClient.delete = function <T = ApiResponse<unknown>>(endpoint: string, options?: RequestOptions): Promise<T> {
  return apiClient<T>(endpoint, { ...options, method: 'DELETE' });
};
