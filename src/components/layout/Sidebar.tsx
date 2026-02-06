import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter,
  BarChart3,
  CalendarIcon,
  RotateCcw,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { categoryList, getCategoryDef } from '@/lib/categories';
import type { Stats, FilterState, CategoryId } from '@/types';

interface SidebarProps {
  open: boolean;
  stats: Stats | null;
  filters: FilterState;
  allTags: string[];
  onToggleCategory: (c: CategoryId) => void;
  onToggleTag: (t: string) => void;
  onSetDateRange: (from: string | null, to: string | null) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function Sidebar({
  open,
  stats,
  filters,
  allTags,
  onToggleCategory,
  onToggleTag,
  onSetDateRange,
  onClearFilters,
  hasActiveFilters,
}: SidebarProps) {
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="border-r bg-background overflow-hidden shrink-0"
        >
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6" style={{ width: 280 }}>
              {/* ── Stats ────────────────────────────────────────────── */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold">Overview</h2>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-2xl font-bold">{stats?.total ?? 0}</p>
                  <p className="text-xs text-muted-foreground">
                    Total updates
                  </p>
                </div>

                {stats && stats.byCategory.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {stats.byCategory.map((item) => {
                      const catDef = categoryList.find(
                        (c) => c.id === item.category,
                      );
                      return (
                        <div
                          key={item.category}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'h-2 w-2 rounded-full',
                                catDef?.dotClass ?? 'bg-gray-500',
                              )}
                            />
                            <span className="text-muted-foreground">
                              {catDef?.label ?? item.category}
                            </span>
                          </div>
                          <span className="font-medium">{item.count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <Separator />

              {/* ── Filters ──────────────────────────────────────────── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold">Filters</h2>
                  </div>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-muted-foreground gap-1 px-2"
                      onClick={onClearFilters}
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset
                    </Button>
                  )}
                </div>

                {/* Category filters */}
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Category
                  </p>
                  <div className="space-y-0.5">
                    {categoryList.map((cat) => {
                      const isActive = filters.categories.includes(cat.id);
                      const count =
                        stats?.byCategory.find(
                          (s) => s.category === cat.id,
                        )?.count ?? 0;

                      return (
                        <button
                          key={cat.id}
                          onClick={() => onToggleCategory(cat.id)}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                            isActive
                              ? 'bg-primary/10 text-foreground'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                          )}
                        >
                          <span
                            className={cn(
                              'h-2.5 w-2.5 rounded-full border-2 transition-colors',
                              isActive
                                ? cat.dotClass + ' border-transparent'
                                : 'border-muted-foreground/30 bg-transparent',
                            )}
                          />
                          <span className="flex-1 text-left">{cat.label}</span>
                          {count > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date range */}
                <div className="mt-4 space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Date Range
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Popover open={fromOpen} onOpenChange={setFromOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            'h-8 w-full justify-start text-xs font-normal',
                            !filters.dateFrom && 'text-muted-foreground',
                          )}
                        >
                          <CalendarIcon className="h-3 w-3 mr-1.5" />
                          {filters.dateFrom
                            ? format(
                                new Date(filters.dateFrom + 'T00:00:00'),
                                'MMM d',
                              )
                            : 'From'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            filters.dateFrom
                              ? new Date(filters.dateFrom + 'T00:00:00')
                              : undefined
                          }
                          onSelect={(d) => {
                            onSetDateRange(
                              d ? format(d, 'yyyy-MM-dd') : null,
                              filters.dateTo,
                            );
                            setFromOpen(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>

                    <Popover open={toOpen} onOpenChange={setToOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            'h-8 w-full justify-start text-xs font-normal',
                            !filters.dateTo && 'text-muted-foreground',
                          )}
                        >
                          <CalendarIcon className="h-3 w-3 mr-1.5" />
                          {filters.dateTo
                            ? format(
                                new Date(filters.dateTo + 'T00:00:00'),
                                'MMM d',
                              )
                            : 'To'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            filters.dateTo
                              ? new Date(filters.dateTo + 'T00:00:00')
                              : undefined
                          }
                          onSelect={(d) => {
                            onSetDateRange(
                              filters.dateFrom,
                              d ? format(d, 'yyyy-MM-dd') : null,
                            );
                            setToOpen(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {(filters.dateFrom || filters.dateTo) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-full text-xs text-muted-foreground"
                      onClick={() => onSetDateRange(null, null)}
                    >
                      Clear dates
                    </Button>
                  )}
                </div>

                {/* Tag filters */}
                {allTags.length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Tags
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {allTags.map((tag) => {
                        const isActive = filters.tags.includes(tag);
                        return (
                          <button
                            key={tag}
                            onClick={() => onToggleTag(tag)}
                            className={cn(
                              'rounded-md px-2 py-0.5 text-xs font-medium transition-colors',
                              isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                            )}
                          >
                            #{tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
