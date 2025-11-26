export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public severity: 'info' | 'warning' | 'error' | 'critical' = 'error',
    public retry: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const ErrorCodes = {
  // Network errors
  NETWORK_OFFLINE: 'NETWORK_OFFLINE',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  NETWORK_ERROR: 'NETWORK_ERROR',

  // Auth errors
  AUTH_FAILED: 'AUTH_FAILED',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',

  // Job errors
  JOB_NOT_FOUND: 'JOB_NOT_FOUND',
  JOB_UPDATE_FAILED: 'JOB_UPDATE_FAILED',
  JOB_INVALID: 'JOB_INVALID',

  // Sync errors
  SYNC_CONFLICT: 'SYNC_CONFLICT',
  SYNC_FAILED: 'SYNC_FAILED',

  // Storage errors
  STORAGE_ERROR: 'STORAGE_ERROR',
  STORAGE_FULL: 'STORAGE_FULL',

  // Unknown errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

export function getErrorMessage(error: any): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unknown error occurred';
}

export function getErrorCode(error: any): string {
  if (error instanceof AppError) {
    return error.code;
  }

  if (error?.code) {
    return error.code;
  }

  return ErrorCodes.UNKNOWN_ERROR;
}

export function shouldRetry(error: any): boolean {
  if (error instanceof AppError) {
    return error.retry;
  }

  // Network errors should retry
  if (error?.code === 'ECONNREFUSED' || error?.code === 'ETIMEDOUT') {
    return true;
  }

  return false;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!shouldRetry(error)) {
        throw error;
      }

      if (attempt < maxRetries - 1) {
        const delayMs = initialDelayMs * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}
