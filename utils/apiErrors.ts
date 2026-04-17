import { ApiError } from './api';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object';

export const isApiErrorStatus = (error: unknown, status: number) =>
  error instanceof ApiError && error.status === status;

export const isAuthError = (error: unknown) => isApiErrorStatus(error, 401);

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError) {
    if (isRecord(error.data) && typeof error.data.message === 'string' && error.data.message.trim()) {
      return error.data.message.trim();
    }

    if (error.message && error.message !== 'AUTH_REQUIRED' && !/^HTTP \d+$/.test(error.message)) {
      return error.message;
    }
  }

  return fallback;
};
