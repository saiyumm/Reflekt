import type { CategoryId } from '@/types';

export interface CategoryDef {
  id: CategoryId;
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
}

export const categories: Record<CategoryId, CategoryDef> = {
  bug_fix: {
    id: 'bug_fix',
    label: 'Bug Fix',
    bgClass: 'bg-red-50 dark:bg-red-950/40',
    textClass: 'text-red-700 dark:text-red-400',
    borderClass: 'border-red-200 dark:border-red-800',
    dotClass: 'bg-red-500',
  },
  development: {
    id: 'development',
    label: 'Development',
    bgClass: 'bg-teal-50 dark:bg-teal-950/40',
    textClass: 'text-teal-700 dark:text-teal-400',
    borderClass: 'border-teal-200 dark:border-teal-800',
    dotClass: 'bg-teal-500',
  },
  improvement: {
    id: 'improvement',
    label: 'Improvement',
    bgClass: 'bg-green-50 dark:bg-green-950/40',
    textClass: 'text-green-700 dark:text-green-400',
    borderClass: 'border-green-200 dark:border-green-800',
    dotClass: 'bg-green-500',
  },
  documentation: {
    id: 'documentation',
    label: 'Documentation',
    bgClass: 'bg-yellow-50 dark:bg-yellow-950/40',
    textClass: 'text-yellow-700 dark:text-yellow-400',
    borderClass: 'border-yellow-200 dark:border-yellow-800',
    dotClass: 'bg-yellow-500',
  },
  devops: {
    id: 'devops',
    label: 'DevOps',
    bgClass: 'bg-orange-50 dark:bg-orange-950/40',
    textClass: 'text-orange-700 dark:text-orange-400',
    borderClass: 'border-orange-200 dark:border-orange-800',
    dotClass: 'bg-orange-500',
  },
  other: {
    id: 'other',
    label: 'Other',
    bgClass: 'bg-gray-50 dark:bg-gray-950/40',
    textClass: 'text-gray-700 dark:text-gray-400',
    borderClass: 'border-gray-200 dark:border-gray-800',
    dotClass: 'bg-gray-500',
  },
};

export const categoryList = Object.values(categories);

export function getCategoryDef(id: CategoryId): CategoryDef {
  return categories[id] || categories.other;
}
