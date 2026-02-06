import { AlertCircle } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppShell } from '@/components/layout/AppShell';
import { EmptyState } from '@/components/shared/EmptyState';
import { useFilters } from '@/hooks/useFilters';
import { useUpdates } from '@/hooks/useUpdates';
import { useWeekGroups } from '@/hooks/useWeekGroups';
import { CategoryBadge } from '@/components/shared/CategoryBadge';

function App() {
  const { filters, setSearch, queryParams } = useFilters();
  const { updates, loading, error } = useUpdates(queryParams);
  const weekGroups = useWeekGroups(updates);

  return (
    <TooltipProvider delayDuration={300}>
      <AppShell search={filters.search} onSearchChange={setSearch}>
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : error ? (
            <EmptyState
              title="Unable to load updates"
              description={error}
              icon={<AlertCircle className="h-8 w-8 text-destructive" />}
            />
          ) : weekGroups.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-6">
              {weekGroups.map((group) => (
                <div key={group.weekKey} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-semibold text-muted-foreground">
                      {group.label}
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      {group.updates.length} update
                      {group.updates.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {group.updates.map((update) => (
                      <div
                        key={update.id}
                        className="rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="font-medium leading-snug">
                              {update.title}
                            </p>
                            {update.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {update.description}
                              </p>
                            )}
                          </div>
                          <CategoryBadge category={update.category} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    </TooltipProvider>
  );
}

export default App;
