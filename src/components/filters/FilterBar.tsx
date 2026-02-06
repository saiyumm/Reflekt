import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCategoryDef } from '@/lib/categories';
import { cn } from '@/lib/utils';
import type { FilterState, CategoryId } from '@/types';

interface FilterBarProps {
  filters: FilterState;
  hasActive: boolean;
  onToggleCategory: (c: CategoryId) => void;
  onToggleTag: (t: string) => void;
  onClearDateRange: () => void;
  onClearAll: () => void;
}

export function FilterBar({
  filters,
  hasActive,
  onToggleCategory,
  onToggleTag,
  onClearDateRange,
  onClearAll,
}: FilterBarProps) {
  if (!hasActive) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap mb-4">
      <span className="text-xs text-muted-foreground font-medium">
        Filters:
      </span>

      {filters.categories.map((catId) => {
        const def = getCategoryDef(catId);
        return (
          <button
            key={catId}
            onClick={() => onToggleCategory(catId)}
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors hover:opacity-80',
              def.bgClass,
              def.textClass,
              def.borderClass,
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', def.dotClass)} />
            {def.label}
            <X className="h-3 w-3 ml-0.5" />
          </button>
        );
      })}

      {filters.tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onToggleTag(tag)}
          className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
        >
          #{tag}
          <X className="h-3 w-3 ml-0.5" />
        </button>
      ))}

      {(filters.dateFrom || filters.dateTo) && (
        <button
          onClick={onClearDateRange}
          className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
        >
          {filters.dateFrom ?? '...'} → {filters.dateTo ?? '...'}
          <X className="h-3 w-3 ml-0.5" />
        </button>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="h-6 text-xs text-muted-foreground"
        onClick={onClearAll}
      >
        Clear all
      </Button>
    </div>
  );
}
