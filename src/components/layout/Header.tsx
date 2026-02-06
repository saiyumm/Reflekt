import { Search, Plus, Download, Upload, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { APP_NAME } from '@/lib/constants';

interface HeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function Header({
  search,
  onSearchChange,
  sidebarOpen,
  onToggleSidebar,
}: HeaderProps) {
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
              type="search"
              placeholder="Search updates..."
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" disabled>
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
              <Button variant="ghost" size="icon" className="h-9 w-9" disabled>
                <Download className="h-4 w-4" />
                <span className="sr-only">Export</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export data</p>
            </TooltipContent>
          </Tooltip>

          <ThemeToggle />

          <Button size="sm" className="ml-2" disabled>
            <Plus className="h-4 w-4 mr-1" />
            New Update
          </Button>
        </div>
      </div>
    </header>
  );
}
