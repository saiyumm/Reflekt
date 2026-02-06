export type CategoryId = 'bug_fix' | 'development' | 'improvement' | 'documentation' | 'devops' | 'other';

export type UpdateStatus = 'completed' | 'in_progress' | 'planned';

export interface Update {
  id: string;
  title: string;
  description: string | null;
  date: string; // YYYY-MM-DD
  category: CategoryId;
  tags: string[];
  status: UpdateStatus;
  isAutoCategorized: boolean;
  createdAt: string;
  updatedAt: string;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  updateId: string;
  type: 'image' | 'link' | 'before_after';
  filename: string | null;
  filepath: string | null;
  url: string | null;
  label: string | null;
  beforePath: string | null;
  afterPath: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface WeekGroup {
  weekKey: string; // e.g. "2026-W06"
  startDate: Date;
  endDate: Date;
  label: string; // e.g. "Feb 2 – Feb 8, 2026"
  updates: Update[];
  categoryCounts: Record<CategoryId, number>;
}

export interface FilterState {
  search: string;
  categories: CategoryId[];
  tags: string[];
  dateFrom: string | null;
  dateTo: string | null;
}

export interface Stats {
  total: number;
  byCategory: { category: string; count: number }[];
}
