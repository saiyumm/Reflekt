import { useState, useCallback } from 'react';
import { RotateCcw, ZoomIn, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ImagePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  alt?: string;
}

export function ImagePreview({ open, onOpenChange, src, alt }: ImagePreviewProps) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const reset = useCallback(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, []);

  // Reset state when dialog opens
  const handleOpenChange = useCallback(
    (v: boolean) => {
      if (v) reset();
      onOpenChange(v);
    },
    [onOpenChange, reset],
  );

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale((prev) => {
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      return Math.max(0.5, Math.min(6, prev + delta));
    });
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[90vw] w-[90vw] h-[85vh] flex flex-col p-0 gap-0">
        <DialogTitle className="sr-only">{alt || 'Image preview'}</DialogTitle>
        <DialogDescription className="sr-only">Full-size preview of the attached image. Scroll to zoom, drag to pan.</DialogDescription>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b shrink-0">
          <span className="text-sm font-medium truncate max-w-[60%]">
            {alt || 'Image preview'}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <ZoomIn className="h-3 w-3" />
              {Math.round(scale * 100)}%
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Image area */}
        <div
          className={cn(
            'flex-1 overflow-hidden bg-muted/30 relative',
            dragging ? 'cursor-grabbing' : 'cursor-grab',
          )}
          onWheel={handleWheel}
          onMouseDown={(e) => {
            if (e.button === 0) {
              e.preventDefault();
              setDragging(true);
            }
          }}
          onMouseMove={(e) => {
            if (!dragging) return;
            setPos((prev) => ({
              x: prev.x + e.movementX,
              y: prev.y + e.movementY,
            }));
          }}
          onMouseUp={() => setDragging(false)}
          onMouseLeave={() => setDragging(false)}
        >
          <img
            src={src}
            alt={alt}
            draggable={false}
            className="absolute inset-0 m-auto max-h-full max-w-full object-contain select-none"
            style={{
              transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
              transformOrigin: 'center center',
              transition: dragging ? 'none' : 'transform 0.1s ease-out',
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
