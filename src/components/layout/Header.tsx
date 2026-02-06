import { useRef, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Download,
  Upload,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { APP_NAME } from '@/lib/constants';
import { api } from '@/lib/api';

interface HeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onNewUpdate: () => void;
  onDataChanged: () => void;
}

export function Header({
  search,
  onSearchChange,
  sidebarOpen,
  onToggleSidebar,
  onNewUpdate,
  onDataChanged,
}: HeaderProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleExport = useCallback(async () => {
    try {
      await api.export.download();
    } catch (err) {
      console.error('Export failed:', err);
    }
  }, []);

  const handleImport = useCallback(
    async (file: File) => {
      try {
        const result = await api.export.import(file);
        onDataChanged();
        alert(
          `Imported ${result.updatesImported} updates and ${result.attachmentsImported} attachments.`,
        );
      } catch (err) {
        console.error('Import failed:', err);
        alert('Import failed. Make sure the file is a valid Reflekt export.');
      }
    },
    [onDataChanged],
  );

  // ── Keyboard shortcuts ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'n' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onNewUpdate();
      }
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onNewUpdate]);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-4">
        {/* Sidebar toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="h-9 w-9"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeft className="h-4 w-4" />
              )}
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{sidebarOpen ? 'Close' : 'Open'} sidebar</p>
          </TooltipContent>
        </Tooltip>

        {/* App name */}
        <h1 className="text-lg font-bold tracking-tight hidden sm:block">
          {APP_NAME}
        </h1>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="search"
              placeholder="Search updates...  ( / )"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Hidden file input for import */}
          <input
            ref={importInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImport(file);
              e.target.value = '';
            }}
          />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => importInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                <span className="sr-only">Import</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Import data</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={handleExport}
              >
                <Download className="h-4 w-4" />
                <span className="sr-only">Export</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export data</p>
            </TooltipContent>
          </Tooltip>

          <ThemeToggle />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" className="ml-2" onClick={onNewUpdate}>
                <Plus className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">New Update</span>
                <span className="sm:hidden">New</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>New update (N)</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}
