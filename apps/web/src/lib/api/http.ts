import type { ApiErrorResponse } from '@vms/shared';

const defaultTenantId = '11111111-1111-4111-8111-111111111111';

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');
  let response: Response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': defaultTenantId,
        ...init.headers,
      },
    });
  } catch {
    throw new ApiClientError(
      `Unable to reach the API at ${baseUrl}. Check that the API is running and the app URL is configured correctly.`,
      'API_UNREACHABLE',
      0,
    );
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorResponse | null;
    throw new ApiClientError(
      body?.error.message ?? 'The request failed.',
      body?.error.code ?? 'HTTP_ERROR',
      response.status,
    );
  }

  return (await response.json()) as T;
}
