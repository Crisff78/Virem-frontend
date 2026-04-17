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

    try {
        return JSON.parse(raw);
    } catch {
        return raw;
    }
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

        const response = await fetch(apiUrl(`${path}${toQueryString(options.query)}`), {
            method: options.method || 'GET',
            headers,
            body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
            signal: options.signal,
        });

        const data = await parseResponseBody(response);

        if (!response.ok) {
            const message =
                (typeof data === 'object' && data && 'message' in data ? String((data as any).message) : '') ||
                `HTTP ${response.status}`;
            throw new ApiError(message, response.status, data);
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
