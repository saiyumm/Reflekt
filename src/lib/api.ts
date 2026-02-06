import { API_BASE } from './constants';
import type { Update, Attachment, Stats } from '@/types';

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

/** Upload helper — uses FormData, no Content-Type header (browser sets boundary) */
async function upload<T>(endpoint: string, formData: FormData): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, { method: 'POST', body: formData });

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

  attachments: {
    uploadImage(updateId: string, file: File, label?: string): Promise<Attachment> {
      const fd = new FormData();
      fd.append('file', file);
      if (label) fd.append('label', label);
      return upload<Attachment>(`/updates/${updateId}/attachments/image`, fd);
    },

    uploadBeforeAfter(
      updateId: string,
      before: File,
      after: File,
      label?: string,
    ): Promise<Attachment> {
      const fd = new FormData();
      fd.append('before', before);
      fd.append('after', after);
      if (label) fd.append('label', label);
      return upload<Attachment>(`/updates/${updateId}/attachments/before-after`, fd);
    },

    addLink(updateId: string, url: string, label?: string): Promise<Attachment> {
      return request<Attachment>(`/updates/${updateId}/attachments/link`, {
        method: 'POST',
        body: JSON.stringify({ url, label }),
      });
    },

    delete(id: string): Promise<void> {
      return request<void>(`/attachments/${id}`, { method: 'DELETE' });
    },
  },

  stats: {
    get(): Promise<Stats> {
      return request<Stats>('/stats');
    },
  },

  export: {
    /** Download all data as a JSON blob */
    async download(): Promise<void> {
      const url = `${API_BASE}/export`;
      const res = await fetch(url);
      if (!res.ok) throw new ApiError(res.status, 'Export failed');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `reflekt-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    },

    /** Import data from a JSON file */
    async import(file: File): Promise<{ updatesImported: number; attachmentsImported: number }> {
      const text = await file.text();
      const data = JSON.parse(text);
      return request<{ updatesImported: number; attachmentsImported: number }>('/import', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },
};

/** Build a URL for an attachment file served statically */
export function attachmentFileUrl(filename: string): string {
  return `${API_BASE}/attachments/files/${filename}`;
}

export { ApiError };
