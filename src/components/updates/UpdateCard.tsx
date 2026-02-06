import { useState } from 'react';
import { format } from 'date-fns';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Calendar,
  Paperclip,
  Link2,
  GitCompareArrows,
} from 'lucide-react';
import type { Update, Attachment } from '@/types';
import { CategoryBadge } from '@/components/shared/CategoryBadge';
import { TagBadge } from '@/components/shared/TagBadge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BeforeAfter } from '@/components/media/BeforeAfter';
import { ImagePreview } from '@/components/media/ImagePreview';
import { AddAttachmentDialog } from '@/components/media/AddAttachmentDialog';
import { attachmentFileUrl } from '@/lib/api';

interface UpdateCardProps {
  update: Update;
  onClick?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRefresh: () => void;
}

export function UpdateCard({ update, onClick, onEdit, onDelete, onRefresh }: UpdateCardProps) {
  const dateObj = new Date(update.date + 'T00:00:00');
  const formattedDate = format(dateObj, 'MMM d');

  const [addAttOpen, setAddAttOpen] = useState(false);
  const [previewImg, setPreviewImg] = useState<{ src: string; alt: string } | null>(null);
  const [compareAtt, setCompareAtt] = useState<Attachment | null>(null);

  const attachments = update.attachments ?? [];
  const images = attachments.filter((a) => a.type === 'image');
  const links = attachments.filter((a) => a.type === 'link');
  const comparisons = attachments.filter((a) => a.type === 'before_after');

  return (
    <>
      <div
        className="group relative rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow cursor-pointer"
        onClick={(e) => {
          // Only open detail if user clicked the card body, not an interactive element
          const target = e.target as HTMLElement;
          if (target.closest('button, a, [role="button"], [data-stop-click]')) return;
          onClick?.();
        }}
      >
        {/* Actions menu — visible on hover */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setAddAttOpen(true)}>
                <Paperclip className="mr-2 h-4 w-4" />
                Add Attachment
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        <div className="flex items-start justify-between gap-3 pr-8">
          <div className="space-y-1 min-w-0">
            <p className="font-medium leading-snug">{update.title}</p>
            {update.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {update.description}
              </p>
            )}
          </div>
          <CategoryBadge category={update.category} className="shrink-0" />
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formattedDate}
          </span>

          {update.status !== 'completed' && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {update.status === 'in_progress' ? 'In Progress' : 'Planned'}
            </span>
          )}

          {attachments.length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Paperclip className="h-3 w-3" />
              {attachments.length}
            </span>
          )}

          {update.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {update.tags.map((tag) => (
                <TagBadge key={tag} tag={tag} />
              ))}
            </div>
          )}
        </div>

        {/* Attachments section */}
        {attachments.length > 0 && (
          <div className="mt-3 space-y-2">
            {/* Image thumbnails */}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {images.map((att) => (
                  <button
                    key={att.id}
                    onClick={() =>
                      setPreviewImg({
                        src: attachmentFileUrl(att.filepath!),
                        alt: att.label || att.filename || 'Image',
                      })
                    }
                    className="block h-16 w-16 rounded-md border overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all"
                  >
                    <img
                      src={attachmentFileUrl(att.filepath!)}
                      alt={att.label || att.filename || ''}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Before/After comparisons */}
            {comparisons.map((att) => (
              <div
                key={att.id}
                className="group/ba flex items-center gap-2"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => setCompareAtt(att)}
                >
                  <GitCompareArrows className="h-3.5 w-3.5" />
                  Compare{att.label ? `: ${att.label}` : ''}
                </Button>
                {/* Tiny thumbnails preview */}
                <div className="flex gap-1">
                  {att.beforePath && (
                    <div className="h-8 w-8 rounded border overflow-hidden">
                      <img
                        src={attachmentFileUrl(att.beforePath)}
                        alt="Before"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  {att.afterPath && (
                    <div className="h-8 w-8 rounded border overflow-hidden">
                      <img
                        src={attachmentFileUrl(att.afterPath)}
                        alt="After"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Links */}
            {links.map((att) => (
              <a
                key={att.id}
                href={att.url!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <Link2 className="h-3 w-3" />
                {att.label || att.url}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <AddAttachmentDialog
        open={addAttOpen}
        onOpenChange={setAddAttOpen}
        updateId={update.id}
        onAdded={onRefresh}
      />

      {previewImg && (
        <ImagePreview
          open
          onOpenChange={() => setPreviewImg(null)}
          src={previewImg.src}
          alt={previewImg.alt}
        />
      )}

      {compareAtt && (
        <BeforeAfter
          open
          onOpenChange={() => setCompareAtt(null)}
          beforePath={compareAtt.beforePath!}
          afterPath={compareAtt.afterPath!}
          label={compareAtt.label ?? undefined}
        />
      )}
    </>
  );
}
