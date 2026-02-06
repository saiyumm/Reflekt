import { useState, useCallback, useMemo } from 'react';
import type { FilterState, CategoryId } from '@/types';

const initialFilters: FilterState = {
  search: '',
  categories: [],
  tags: [],
  dateFrom: null,
  dateTo: null,
};

export function useFilters() {
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  }, []);

  const toggleCategory = useCallback((category: CategoryId) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  }, []);

  const setDateRange = useCallback((from: string | null, to: string | null) => {
    setFilters((prev) => ({ ...prev, dateFrom: from, dateTo: to }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== '' ||
      filters.categories.length > 0 ||
      filters.tags.length > 0 ||
      filters.dateFrom !== null ||
      filters.dateTo !== null
    );
  }, [filters]);

  // Build query params for API calls
  const queryParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (filters.search) params.search = filters.search;
    if (filters.categories.length === 1) params.category = filters.categories[0];
    if (filters.tags.length === 1) params.tag = filters.tags[0];
    if (filters.dateFrom) params.from = filters.dateFrom;
    if (filters.dateTo) params.to = filters.dateTo;
    return params;
  }, [filters]);

  return {
    filters,
    setSearch,
    toggleCategory,
    toggleTag,
    setDateRange,
    clearFilters,
    hasActiveFilters,
    queryParams,
  };
}
