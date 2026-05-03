import { apiUrl } from '../config/backend';
import { getAuthToken } from './session';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type QueryValue = string | number | boolean | null | undefined;

export type RequestOptions = {
    method?: HttpMethod;
    body?: unknown;
    headers?: Record<string, string>;
    authenticated?: boolean;
    authToken?: string;
    query?: Record<string, QueryValue>;
    signal?: AbortSignal;
};

export class ApiError extends Error {
    status: number;
    data: unknown;

    constructor(message: string, status: number, data: unknown) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

const toQueryString = (query?: Record<string, QueryValue>) => {
    if (!query) return '';

    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        params.append(key, String(value));
    });

    const raw = params.toString();
    return raw ? `?${raw}` : '';
};

const parseResponseBody = async (response: Response): Promise<any> => {
    const raw = await response.text();
    if (!raw) return null;

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        try {
            return JSON.parse(raw);
        } catch {
            return raw;
        }
    }

    try {
        return JSON.parse(raw);
    } catch {
        return raw;
    }
};

const extractErrorMessage = (data: unknown, fallback: string): string => {
    if (!data || typeof data !== 'object') return fallback;
    const source = data as Record<string, unknown>;
    const candidate = source.message ?? source.error ?? source.detail;
    const text = String(candidate ?? '').trim();
    return text || fallback;
};

export class ApiClient {
    private readonly tokenProvider: () => Promise<string>;

    constructor(tokenProvider: () => Promise<string> = getAuthToken) {
        this.tokenProvider = tokenProvider;
    }

    async request<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
        const headers: Record<string, string> = {
            Accept: 'application/json',
            ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
            ...(options.headers || {}),
        };

        if (options.authenticated) {
            const token = String(options.authToken || (await this.tokenProvider()) || '').trim();
            if (!token) {
                throw new ApiError('AUTH_REQUIRED', 401, null);
            }
            headers.Authorization = `Bearer ${token}`;
        }

        let response: Response;
        try {
            response = await fetch(apiUrl(`${path}${toQueryString(options.query)}`), {
                method: options.method || 'GET',
                headers,
                body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
                signal: options.signal,
            });
        } catch (error) {
            if ((error as any)?.name === 'AbortError') throw error;
            throw new ApiError('NETWORK_ERROR', 0, error);
        }

        const data = await parseResponseBody(response);

        if (!response.ok) {
            throw new ApiError(
                extractErrorMessage(data, `HTTP ${response.status}`),
                response.status,
                data
            );
        }

        return data as T;
    }

    get<T = any>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
        return this.request<T>(path, { ...options, method: 'GET' });
    }

    post<T = any>(path: string, options: Omit<RequestOptions, 'method'> = {}) {
        return this.request<T>(path, { ...options, method: 'POST' });
    }

    put<T = any>(path: string, options: Omit<RequestOptions, 'method'> = {}) {
        return this.request<T>(path, { ...options, method: 'PUT' });
    }

    patch<T = any>(path: string, options: Omit<RequestOptions, 'method'> = {}) {
        return this.request<T>(path, { ...options, method: 'PATCH' });
    }

    delete<T = any>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
        return this.request<T>(path, { ...options, method: 'DELETE' });
    }
}

export const apiClient = new ApiClient();

export async function requestJson<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
    return apiClient.request<T>(path, options);
}
