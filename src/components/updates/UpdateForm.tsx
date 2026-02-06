import { useState, useEffect, useRef, useCallback } from 'react';
import type { FormEvent } from 'react';
import {
  CalendarIcon,
  ImagePlus,
  Link2,
  GitCompareArrows,
  Upload,
  X,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Update, Attachment, CategoryId, UpdateStatus } from '@/types';
import { categoryList, getCategoryDef } from '@/lib/categories';
import { categorize } from '@/lib/categorize';
import { api, attachmentFileUrl } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ── Pending attachment types ──────────────────────────────────────────────

type PendingImage = { kind: 'image'; file: File; preview: string };
type PendingLink = { kind: 'link'; url: string; label: string };
type PendingBA = {
  kind: 'before_after';
  before: File;
  after: File;
  beforePreview: string;
  afterPreview: string;
  label: string;
};
type PendingAttachment = PendingImage | PendingLink | PendingBA;

// ── Props ─────────────────────────────────────────────────────────────────

interface UpdateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Update | null;
  onSubmit: (data: Partial<Update>) => Promise<Update>;
  onRefresh?: () => void;
}

export function UpdateForm({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  onRefresh,
}: UpdateFormProps) {
  const isEditing = Boolean(initialData);

  // ── Form fields ───────────────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [category, setCategory] = useState<CategoryId>('other');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<UpdateStatus>('completed');
  const [submitting, setSubmitting] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Track whether the user has manually chosen a category
  const [manualCategory, setManualCategory] = useState(false);
  const [autoConfidence, setAutoConfidence] = useState(0);

  // ── Pending attachments (for new items before save) ──────────────────
  const [pending, setPending] = useState<PendingAttachment[]>([]);
  // Existing attachments to delete (when editing)
  const [toDelete, setToDelete] = useState<string[]>([]);

  // Refs for file inputs
  const imgInputRef = useRef<HTMLInputElement>(null);
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  // Temp state for before/after pair building
  const [baBefore, setBaBefore] = useState<File | null>(null);
  const [baAfter, setBaAfter] = useState<File | null>(null);
  const [baLabel, setBaLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [attTab, setAttTab] = useState<'image' | 'link' | 'ba'>('image');

  // ── Reset form when dialog opens ─────────────────────────────────────
  useEffect(() => {
    if (open) {
      if (initialData) {
        setTitle(initialData.title);
        setDescription(initialData.description || '');
        setDate(new Date(initialData.date + 'T00:00:00'));
        setCategory(initialData.category);
        setTags(initialData.tags.join(', '));
        setStatus(initialData.status);
        setManualCategory(true); // preserve existing category
        setAutoConfidence(0);
      } else {
        setTitle('');
        setDescription('');
        setDate(new Date());
        setCategory('other');
        setTags('');
        setStatus('completed');
        setManualCategory(false);
        setAutoConfidence(0);
      }
      setPending([]);
      setToDelete([]);
      setBaBefore(null);
      setBaAfter(null);
      setBaLabel('');
      setLinkUrl('');
      setLinkLabel('');
    }
  }, [open, initialData]);

  // ── Auto-categorize as user types ────────────────────────────────────
  useEffect(() => {
    if (manualCategory) return;
    const result = categorize(title, description);
    setCategory(result.category);
    setAutoConfidence(result.confidence);
  }, [title, description, manualCategory]);

  const handleManualCategoryChange = (val: string) => {
    setCategory(val as CategoryId);
    setManualCategory(true);
    setAutoConfidence(0);
  };

  // ── Pending attachment helpers ───────────────────────────────────────
  const addImage = (file: File) => {
    const preview = URL.createObjectURL(file);
    setPending((prev) => [...prev, { kind: 'image', file, preview }]);
  };

  const addLink = () => {
    if (!linkUrl.trim()) return;
    setPending((prev) => [
      ...prev,
      { kind: 'link', url: linkUrl.trim(), label: linkLabel.trim() },
    ]);
    setLinkUrl('');
    setLinkLabel('');
  };

  const addBeforeAfter = () => {
    if (!baBefore || !baAfter) return;
    setPending((prev) => [
      ...prev,
      {
        kind: 'before_after',
        before: baBefore,
        after: baAfter,
        beforePreview: URL.createObjectURL(baBefore),
        afterPreview: URL.createObjectURL(baAfter),
        label: baLabel.trim(),
      },
    ]);
    setBaBefore(null);
    setBaAfter(null);
    setBaLabel('');
  };

  const removePending = (index: number) => {
    setPending((prev) => {
      const item = prev[index];
      // Revoke object URLs
      if (item.kind === 'image') URL.revokeObjectURL(item.preview);
      if (item.kind === 'before_after') {
        URL.revokeObjectURL(item.beforePreview);
        URL.revokeObjectURL(item.afterPreview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const markExistingForDelete = (attId: string) => {
    setToDelete((prev) => [...prev, attId]);
  };

  // ── Submit ───────────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      const update = await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        date: format(date, 'yyyy-MM-dd'),
        category,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        status,
      });

      // Upload pending attachments
      for (const att of pending) {
        try {
          if (att.kind === 'image') {
            await api.attachments.uploadImage(update.id, att.file);
          } else if (att.kind === 'link') {
            await api.attachments.addLink(update.id, att.url, att.label || undefined);
          } else if (att.kind === 'before_after') {
            await api.attachments.uploadBeforeAfter(
              update.id,
              att.before,
              att.after,
              att.label || undefined,
            );
          }
        } catch (err) {
          console.error('Failed to upload attachment:', err);
        }
      }

      // Delete removed existing attachments
      for (const attId of toDelete) {
        try {
          await api.attachments.delete(attId);
        } catch (err) {
          console.error('Failed to delete attachment:', err);
        }
      }

      if ((pending.length > 0 || toDelete.length > 0) && onRefresh) {
        onRefresh();
      }

      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Existing attachments (when editing) minus ones marked for deletion
  const existingAttachments = (initialData?.attachments ?? []).filter(
    (a) => !toDelete.includes(a.id),
  );

  const catDef = getCategoryDef(category);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Update' : 'New Update'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modify the details of this update.'
              : 'Log what you worked on today.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="update-title">Title</Label>
            <Input
              id="update-title"
              placeholder="What did you work on?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="update-desc">Description</Label>
            <Textarea
              id="update-desc"
              placeholder="Add details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Date + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(date, 'MMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                      if (d) setDate(d);
                      setDatePickerOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label>Category</Label>
                {!manualCategory && autoConfidence > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Auto-detected from your text</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <Select
                value={category}
                onValueChange={handleManualCategoryChange}
              >
                <SelectTrigger
                  className={cn(
                    'w-full transition-colors',
                    !manualCategory &&
                      autoConfidence > 0 &&
                      'ring-1 ring-primary/30',
                  )}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryList.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'h-2 w-2 rounded-full',
                            cat.dotClass,
                          )}
                        />
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status + Tags */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as UpdateStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="update-tags">Tags</Label>
              <Input
                id="update-tags"
                placeholder="tag1, tag2, ..."
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>

          {/* ── Attachments section ──────────────────────────────────────── */}
          <div className="space-y-3 rounded-lg border p-3">
            <p className="text-sm font-medium">Attachments</p>

            {/* Tab buttons */}
            <div className="flex gap-1 rounded-md bg-muted p-0.5">
              {(
                [
                  { id: 'image', label: 'Image', icon: ImagePlus },
                  { id: 'link', label: 'Link', icon: Link2 },
                  { id: 'ba', label: 'Before/After', icon: GitCompareArrows },
                ] as const
              ).map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setAttTab(t.id)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors',
                    attTab === t.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Image picker */}
            {attTab === 'image' && (
              <div>
                <input
                  ref={imgInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) addImage(f);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => imgInputRef.current?.click()}
                  className="w-full rounded-md border-2 border-dashed p-4 text-center text-xs text-muted-foreground hover:border-muted-foreground/50 transition-colors"
                >
                  <Upload className="mx-auto h-5 w-5 mb-1" />
                  Click to select an image
                </button>
              </div>
            )}

            {/* Link input */}
            {attTab === 'link' && (
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <Input
                    placeholder="https://..."
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Input
                    placeholder="Label (optional)"
                    value={linkLabel}
                    onChange={(e) => setLinkLabel(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-8"
                  disabled={!linkUrl.trim()}
                  onClick={addLink}
                >
                  Add
                </Button>
              </div>
            )}

            {/* Before/After picker */}
            {attTab === 'ba' && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      ref={beforeInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        setBaBefore(e.target.files?.[0] ?? null);
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => beforeInputRef.current?.click()}
                      className={cn(
                        'w-full rounded-md border-2 border-dashed p-3 text-center text-xs transition-colors',
                        baBefore
                          ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400'
                          : 'text-muted-foreground hover:border-muted-foreground/50',
                      )}
                    >
                      {baBefore ? baBefore.name : 'Before'}
                    </button>
                  </div>
                  <div>
                    <input
                      ref={afterInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        setBaAfter(e.target.files?.[0] ?? null);
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => afterInputRef.current?.click()}
                      className={cn(
                        'w-full rounded-md border-2 border-dashed p-3 text-center text-xs transition-colors',
                        baAfter
                          ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400'
                          : 'text-muted-foreground hover:border-muted-foreground/50',
                      )}
                    >
                      {baAfter ? baAfter.name : 'After'}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 items-end">
                  <Input
                    placeholder="Label (optional)"
                    value={baLabel}
                    onChange={(e) => setBaLabel(e.target.value)}
                    className="h-8 text-xs flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-8"
                    disabled={!baBefore || !baAfter}
                    onClick={addBeforeAfter}
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}

            {/* Existing attachments (editing mode) */}
            {existingAttachments.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">
                  Current
                </p>
                {existingAttachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-2 text-xs rounded-md bg-muted/50 px-2 py-1"
                  >
                    {att.type === 'image' && (
                      <>
                        <img
                          src={attachmentFileUrl(att.filepath!)}
                          alt=""
                          className="h-6 w-6 rounded object-cover"
                        />
                        <span className="truncate flex-1">
                          {att.label || att.filename}
                        </span>
                      </>
                    )}
                    {att.type === 'link' && (
                      <>
                        <Link2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate flex-1">
                          {att.label || att.url}
                        </span>
                      </>
                    )}
                    {att.type === 'before_after' && (
                      <>
                        <GitCompareArrows className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate flex-1">
                          {att.label || 'Before/After'}
                        </span>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => markExistingForDelete(att.id)}
                      className="shrink-0 hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Pending attachments */}
            {pending.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">
                  To upload
                </p>
                {pending.map((att, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs rounded-md bg-primary/5 px-2 py-1"
                  >
                    {att.kind === 'image' && (
                      <>
                        <img
                          src={att.preview}
                          alt=""
                          className="h-6 w-6 rounded object-cover"
                        />
                        <span className="truncate flex-1">{att.file.name}</span>
                      </>
                    )}
                    {att.kind === 'link' && (
                      <>
                        <Link2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate flex-1">
                          {att.label || att.url}
                        </span>
                      </>
                    )}
                    {att.kind === 'before_after' && (
                      <>
                        <GitCompareArrows className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate flex-1">
                          {att.label || `${att.before.name} → ${att.after.name}`}
                        </span>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => removePending(i)}
                      className="shrink-0 hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || submitting}>
              {submitting
                ? 'Saving...'
                : isEditing
                  ? 'Save Changes'
                  : 'Create Update'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
