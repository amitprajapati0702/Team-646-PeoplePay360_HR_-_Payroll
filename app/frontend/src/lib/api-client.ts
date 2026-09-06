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
  _retry?: boolean;
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('pp360_token');
  if (!token || token === 'undefined' || token === 'null' || token.trim() === '') return null;
  return token;
}

export async function apiClient<T = ApiResponse<unknown>>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, headers, _retry, ...customConfig } = options;

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
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    credentials: 'include',
    ...customConfig,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
  });

  if (response.status === 204) {
    return {} as T;
  }

  // Automatic token refresh & retry on 401 for authenticated endpoints
  if (
    response.status === 401 &&
    !_retry &&
    !endpoint.includes('/auth/login') &&
    !endpoint.includes('/auth/refresh') &&
    !endpoint.includes('/auth/register')
  ) {
    try {
      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (refreshRes.ok) {
        const refreshJson = await refreshRes.json();
        const newAccessToken =
          refreshJson.data?.accessToken || refreshJson.data?.token;
        if (newAccessToken && typeof window !== 'undefined') {
          localStorage.setItem('pp360_token', newAccessToken);
          return apiClient<T>(endpoint, {
            ...options,
            _retry: true,
            headers: {
              ...headers,
              Authorization: `Bearer ${newAccessToken}`,
            },
          });
        }
      }
    } catch {
      // Fall through to error handling
    }
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
