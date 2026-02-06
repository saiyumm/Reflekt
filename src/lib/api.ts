import { API_BASE } from './constants';
import type { Update, Stats } from '@/types';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.error || res.statusText);
  }

  return res.json();
}

export const api = {
  updates: {
    list(params?: Record<string, string>): Promise<Update[]> {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<Update[]>(`/updates${query}`);
    },
    get(id: string): Promise<Update> {
      return request<Update>(`/updates/${id}`);
    },
    create(data: Partial<Update>): Promise<Update> {
      return request<Update>('/updates', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update(id: string, data: Partial<Update>): Promise<Update> {
      return request<Update>(`/updates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    delete(id: string): Promise<void> {
      return request<void>(`/updates/${id}`, { method: 'DELETE' });
    },
  },
  stats: {
    get(): Promise<Stats> {
      return request<Stats>('/stats');
    },
  },
};

export { ApiError };
