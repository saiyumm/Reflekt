import { motion, AnimatePresence } from 'framer-motion';
import { Filter, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { categoryList } from '@/lib/categories';
import type { Stats } from '@/types';

interface SidebarProps {
  open: boolean;
  stats: Stats | null;
}

export function Sidebar({ open, stats }: SidebarProps) {
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
              {/* Stats Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold">Overview</h2>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-2xl font-bold">{stats?.total ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Total updates</p>
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

              {/* Filters Section (placeholder for Phase 4) */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold">Filters</h2>
                </div>
                <p className="text-xs text-muted-foreground">
                  Category, date range, and tag filters will appear here.
                </p>
              </div>
            </div>
          </ScrollArea>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
