import { useState, useCallback, useMemo } from 'react';
import { AlertCircle, Plus } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppShell } from '@/components/layout/AppShell';
import { EmptyState } from '@/components/shared/EmptyState';
import { WeekGroup } from '@/components/updates/WeekGroup';
import { UpdateCard } from '@/components/updates/UpdateCard';
import { UpdateForm } from '@/components/updates/UpdateForm';
import { UpdateDetail } from '@/components/updates/UpdateDetail';
import { FilterBar } from '@/components/filters/FilterBar';
import { useFilters } from '@/hooks/useFilters';
import { useUpdates } from '@/hooks/useUpdates';
import { useWeekGroups } from '@/hooks/useWeekGroups';
import { Button } from '@/components/ui/button';
import type { Update } from '@/types';

function App() {
  const {
    filters,
    setSearch,
    toggleCategory,
    toggleTag,
    setDateRange,
    clearFilters,
    hasActiveFilters,
    queryParams,
  } = useFilters();

  const {
    updates,
    loading,
    error,
    refresh,
    createUpdate,
    updateUpdate,
    deleteUpdate,
  } = useUpdates(queryParams);

  const weekGroups = useWeekGroups(updates);

  // Collect all unique tags across all updates for the sidebar filter
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const u of updates) {
      for (const t of u.tags) tagSet.add(t);
    }
    return Array.from(tagSet).sort();
  }, [updates]);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<Update | null>(null);

  // Detail panel state
  const [detailUpdate, setDetailUpdate] = useState<Update | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Refresh key to trigger stats re-fetch in AppShell
  const [statsKey, setStatsKey] = useState(0);
  const bumpStats = useCallback(() => setStatsKey((k) => k + 1), []);

  /** Refresh both the update list and sidebar stats */
  const refreshAll = useCallback(() => {
    refresh();
    bumpStats();
  }, [refresh, bumpStats]);

  const handleNewUpdate = useCallback(() => {
    setEditingUpdate(null);
    setFormOpen(true);
  }, []);

  const handleEdit = useCallback((update: Update) => {
    setEditingUpdate(update);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!window.confirm('Delete this update?')) return;
      await deleteUpdate(id);
      bumpStats();
      if (detailUpdate?.id === id) {
        setDetailOpen(false);
        setDetailUpdate(null);
      }
    },
    [deleteUpdate, bumpStats, detailUpdate],
  );

  const handleCardClick = useCallback((update: Update) => {
    setDetailUpdate(update);
    setDetailOpen(true);
  }, []);

  const handleFormSubmit = useCallback(
    async (data: Partial<Update>): Promise<Update> => {
      let result: Update;
      if (editingUpdate) {
        result = await updateUpdate(editingUpdate.id, data);
      } else {
        result = await createUpdate(data);
      }
      bumpStats();
      return result;
    },
    [editingUpdate, createUpdate, updateUpdate, bumpStats],
  );

  // Keep the detail panel in sync when updates refresh
  const currentDetail = detailUpdate
    ? updates.find((u) => u.id === detailUpdate.id) ?? detailUpdate
    : null;

  return (
    <TooltipProvider delayDuration={300}>
      <AppShell
        search={filters.search}
        onSearchChange={setSearch}
        onNewUpdate={handleNewUpdate}
        onDataChanged={refreshAll}
        statsKey={statsKey}
        filters={filters}
        allTags={allTags}
        hasActiveFilters={hasActiveFilters}
        onToggleCategory={toggleCategory}
        onToggleTag={toggleTag}
        onSetDateRange={setDateRange}
        onClearFilters={clearFilters}
      >
        <div className="p-6 max-w-4xl mx-auto">
          {/* Active filter chips */}
          <FilterBar
            filters={filters}
            hasActive={hasActiveFilters}
            onToggleCategory={toggleCategory}
            onToggleTag={toggleTag}
            onClearDateRange={() => setDateRange(null, null)}
            onClearAll={clearFilters}
          />

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
            <EmptyState
              title={hasActiveFilters ? 'No matching updates' : 'No updates yet'}
              description={
                hasActiveFilters
                  ? 'Try adjusting your filters or clearing them.'
                  : 'Start tracking your weekly progress by adding your first update.'
              }
              action={
                hasActiveFilters ? (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : (
                  <Button onClick={handleNewUpdate}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add your first update
                  </Button>
                )
              }
            />
          ) : (
            <div className="space-y-4">
              {weekGroups.map((group) => (
                <WeekGroup key={group.weekKey} group={group}>
                  {group.updates.map((update) => (
                    <UpdateCard
                      key={update.id}
                      update={update}
                      onClick={() => handleCardClick(update)}
                      onEdit={() => handleEdit(update)}
                      onDelete={() => handleDelete(update.id)}
                      onRefresh={refreshAll}
                    />
                  ))}
                </WeekGroup>
              ))}
            </div>
          )}
        </div>
      </AppShell>

      {/* Create / Edit dialog */}
      <UpdateForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initialData={editingUpdate}
        onSubmit={handleFormSubmit}
        onRefresh={refreshAll}
      />

      {/* Detail side panel */}
      <UpdateDetail
        update={currentDetail}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={handleEdit}
        onDelete={(id) => handleDelete(id)}
        onRefresh={refreshAll}
      />
    </TooltipProvider>
  );
}

export default App;
