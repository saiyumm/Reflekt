import { useMemo } from 'react';
import { startOfISOWeek, endOfISOWeek, format, getISOWeek, getISOWeekYear } from 'date-fns';
import type { Update, WeekGroup, CategoryId } from '@/types';

export function useWeekGroups(updates: Update[]): WeekGroup[] {
  return useMemo(() => {
    const groups = new Map<string, Update[]>();

    for (const update of updates) {
      const date = new Date(update.date + 'T00:00:00');
      const weekYear = getISOWeekYear(date);
      const week = getISOWeek(date);
      const weekKey = `${weekYear}-W${String(week).padStart(2, '0')}`;

      if (!groups.has(weekKey)) {
        groups.set(weekKey, []);
      }
      groups.get(weekKey)!.push(update);
    }

    const weekGroups: WeekGroup[] = [];

    for (const [weekKey, weekUpdates] of groups) {
      const sampleDate = new Date(weekUpdates[0].date + 'T00:00:00');
      const start = startOfISOWeek(sampleDate);
      const end = endOfISOWeek(sampleDate);

      const categoryCounts = {} as Record<CategoryId, number>;
      for (const update of weekUpdates) {
        categoryCounts[update.category] = (categoryCounts[update.category] || 0) + 1;
      }

      const startStr = format(start, 'MMM d');
      const endStr = format(end, 'MMM d, yyyy');
      const label = `${startStr} – ${endStr}`;

      weekGroups.push({
        weekKey,
        startDate: start,
        endDate: end,
        label,
        updates: weekUpdates,
        categoryCounts,
      });
    }

    // Sort by week descending (most recent first)
    weekGroups.sort((a, b) => b.weekKey.localeCompare(a.weekKey));

    return weekGroups;
  }, [updates]);
}
