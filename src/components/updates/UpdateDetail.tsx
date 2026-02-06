import { useState } from 'react';
import { format } from 'date-fns';
import {
  Calendar,
  Pencil,
  Trash2,
  Paperclip,
  Link2,
  GitCompareArrows,
  ExternalLink,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import type { Update, Attachment } from '@/types';
import { CategoryBadge } from '@/components/shared/CategoryBadge';
import { TagBadge } from '@/components/shared/TagBadge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BeforeAfter } from '@/components/media/BeforeAfter';
import { ImagePreview } from '@/components/media/ImagePreview';
import { AddAttachmentDialog } from '@/components/media/AddAttachmentDialog';
import { attachmentFileUrl, api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface UpdateDetailProps {
  update: Update | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (update: Update) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export function UpdateDetail({
  update,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onRefresh,
}: UpdateDetailProps) {
  const [addAttOpen, setAddAttOpen] = useState(false);
  const [previewImg, setPreviewImg] = useState<{ src: string; alt: string } | null>(null);
  const [compareAtt, setCompareAtt] = useState<Attachment | null>(null);

  if (!update) return null;

  const dateObj = new Date(update.date + 'T00:00:00');
  const attachments = update.attachments ?? [];
  const images = attachments.filter((a) => a.type === 'image');
  const links = attachments.filter((a) => a.type === 'link');
  const comparisons = attachments.filter((a) => a.type === 'before_after');

  const handleDeleteAttachment = async (attId: string) => {
    try {
      await api.attachments.delete(attId);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete attachment:', err);
    }
  };

  const statusLabel =
    update.status === 'completed'
      ? 'Completed'
      : update.status === 'in_progress'
        ? 'In Progress'
        : 'Planned';

  const statusDot =
    update.status === 'completed'
      ? 'bg-green-500'
      : update.status === 'in_progress'
        ? 'bg-amber-500'
        : 'bg-blue-500';

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-[480px] p-0 flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-4 shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0 flex-1">
                <SheetTitle className="text-xl leading-tight">
                  {update.title}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Details for update: {update.title}
                </SheetDescription>
              </div>
              <CategoryBadge category={update.category} />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => {
                  onOpenChange(false);
                  // Small delay so sheet closes before dialog opens
                  setTimeout(() => onEdit(update), 150);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => setAddAttOpen(true)}
              >
                <Paperclip className="h-3.5 w-3.5" />
                Attach
              </Button>
              <div className="flex-1" />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  onOpenChange(false);
                  setTimeout(() => onDelete(update.id), 150);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          </SheetHeader>

          <Separator />

          <ScrollArea className="flex-1">
            <div className="px-6 py-5 space-y-6">
              {/* Meta info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Date
                  </p>
                  <p className="text-sm flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {format(dateObj, 'EEEE, MMM d, yyyy')}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </p>
                  <p className="text-sm flex items-center gap-1.5">
                    <span className={cn('h-2 w-2 rounded-full', statusDot)} />
                    {statusLabel}
                  </p>
                </div>
              </div>

              {/* Description */}
              {update.description && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Description
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {update.description}
                  </p>
                </div>
              )}

              {/* Tags */}
              {update.tags.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {update.tags.map((tag) => (
                      <TagBadge key={tag} tag={tag} />
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {attachments.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Attachments
                    <span className="ml-1.5 text-foreground">
                      ({attachments.length})
                    </span>
                  </p>

                  {/* Image gallery */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {images.map((att) => (
                        <div key={att.id} className="group/img relative">
                          <button
                            onClick={() =>
                              setPreviewImg({
                                src: attachmentFileUrl(att.filepath!),
                                alt: att.label || att.filename || 'Image',
                              })
                            }
                            className="block w-full aspect-video rounded-lg border overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all"
                          >
                            <img
                              src={attachmentFileUrl(att.filepath!)}
                              alt={att.label || att.filename || ''}
                              className="h-full w-full object-cover"
                            />
                          </button>
                          {att.label && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {att.label}
                            </p>
                          )}
                          <button
                            onClick={() => handleDeleteAttachment(att.id)}
                            className="absolute top-1.5 right-1.5 hidden group-hover/img:flex h-5 w-5 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Before/After comparisons */}
                  {comparisons.map((att) => (
                    <div
                      key={att.id}
                      className="group/ba rounded-lg border p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium flex items-center gap-1.5">
                          <GitCompareArrows className="h-4 w-4 text-muted-foreground" />
                          {att.label || 'Before / After'}
                        </p>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => setCompareAtt(att)}
                          >
                            Compare
                          </Button>
                          <button
                            onClick={() => handleDeleteAttachment(att.id)}
                            className="hidden group-hover/ba:flex h-6 w-6 items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {att.beforePath && (
                          <div className="space-y-1">
                            <div className="aspect-video rounded-md border overflow-hidden">
                              <img
                                src={attachmentFileUrl(att.beforePath)}
                                alt="Before"
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-wider">
                              Before
                            </p>
                          </div>
                        )}
                        {att.afterPath && (
                          <div className="space-y-1">
                            <div className="aspect-video rounded-md border overflow-hidden">
                              <img
                                src={attachmentFileUrl(att.afterPath)}
                                alt="After"
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-wider">
                              After
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Links */}
                  {links.length > 0 && (
                    <div className="space-y-1.5">
                      {links.map((att) => (
                        <div
                          key={att.id}
                          className="group/link flex items-center gap-2 rounded-md border px-3 py-2"
                        >
                          <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0 flex-1">
                            {att.label && (
                              <p className="text-sm font-medium truncate">
                                {att.label}
                              </p>
                            )}
                            <a
                              href={att.url!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1 truncate"
                            >
                              {att.url}
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                          </div>
                          <button
                            onClick={() => handleDeleteAttachment(att.id)}
                            className="hidden group-hover/link:flex h-6 w-6 items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Empty attachments state */}
              {attachments.length === 0 && (
                <div className="text-center py-4">
                  <Paperclip className="mx-auto h-6 w-6 text-muted-foreground/50 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    No attachments yet
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-7 text-xs"
                    onClick={() => setAddAttOpen(true)}
                  >
                    Add one
                  </Button>
                </div>
              )}

              {/* Auto-categorized indicator */}
              {update.isAutoCategorized && (
                <p className="text-[11px] text-muted-foreground/60 text-center">
                  Category was auto-detected from keywords
                </p>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Sub-dialogs */}
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
