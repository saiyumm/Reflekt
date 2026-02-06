import { useState, useRef, useCallback, useEffect } from 'react';
import { RotateCcw, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { attachmentFileUrl } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ZoomState {
  scale: number;
  x: number;
  y: number;
}

const DEFAULT_ZOOM: ZoomState = { scale: 1, x: 0, y: 0 };

interface PanelProps {
  src: string;
  label: string;
}

function ZoomPanel({ src, label }: PanelProps) {
  const [zoom, setZoom] = useState<ZoomState>(DEFAULT_ZOOM);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setZoom((prev) => {
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      const newScale = Math.max(0.5, Math.min(6, prev.scale + delta));
      return { ...prev, scale: newScale };
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return;
      setZoom((prev) => ({
        ...prev,
        x: prev.x + e.movementX,
        y: prev.y + e.movementY,
      }));
    },
    [dragging],
  );

  const handleMouseUp = useCallback(() => setDragging(false), []);

  // Reset on unmount drag state if mouse leaves
  useEffect(() => {
    const handleGlobalUp = () => setDragging(false);
    window.addEventListener('mouseup', handleGlobalUp);
    return () => window.removeEventListener('mouseup', handleGlobalUp);
  }, []);

  const reset = useCallback(() => setZoom(DEFAULT_ZOOM), []);

  return (
    <div className="flex flex-1 flex-col min-w-0">
      {/* Label bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
        <span className="text-sm font-semibold">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <ZoomIn className="h-3 w-3" />
            {Math.round(zoom.scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={reset}
            title="Reset zoom"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Image area */}
      <div
        ref={containerRef}
        className={cn(
          'relative flex-1 overflow-hidden bg-muted/30',
          dragging ? 'cursor-grabbing' : 'cursor-grab',
        )}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <img
          src={src}
          alt={label}
          draggable={false}
          className="absolute inset-0 m-auto max-h-full max-w-full object-contain select-none"
          style={{
            transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`,
            transformOrigin: 'center center',
            transition: dragging ? 'none' : 'transform 0.1s ease-out',
          }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface BeforeAfterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  beforePath: string;
  afterPath: string;
  label?: string;
}

export function BeforeAfter({
  open,
  onOpenChange,
  beforePath,
  afterPath,
  label,
}: BeforeAfterProps) {
  const beforeSrc = attachmentFileUrl(beforePath);
  const afterSrc = attachmentFileUrl(afterPath);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="min-w-[80vw] w-[95vw] max-w-[95vw] min-h-[80vh] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b shrink-0">
          <DialogTitle>
            {label ? `Compare: ${label}` : 'Before / After'}
          </DialogTitle>
          <DialogDescription>
            Scroll to zoom, drag to pan. Each side zooms independently.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 min-h-0">
          <ZoomPanel src={beforeSrc} label="Before" />
          <div className="w-px bg-border shrink-0" />
          <ZoomPanel src={afterSrc} label="After" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
