import { useState, useRef } from 'react';
import { ImagePlus, Link2, GitCompareArrows, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

type Tab = 'image' | 'link' | 'before_after';

interface AddAttachmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  updateId: string;
  onAdded: () => void;
}

export function AddAttachmentDialog({
  open,
  onOpenChange,
  updateId,
  onAdded,
}: AddAttachmentDialogProps) {
  const [tab, setTab] = useState<Tab>('image');
  const [uploading, setUploading] = useState(false);

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Link state
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');

  // Before/After state
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [baLabel, setBaLabel] = useState('');
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setImageFile(null);
    setLinkUrl('');
    setLinkLabel('');
    setBeforeFile(null);
    setAfterFile(null);
    setBaLabel('');
  };

  const handleSubmit = async () => {
    setUploading(true);
    try {
      if (tab === 'image' && imageFile) {
        await api.attachments.uploadImage(updateId, imageFile);
      } else if (tab === 'link' && linkUrl) {
        await api.attachments.addLink(updateId, linkUrl, linkLabel || undefined);
      } else if (tab === 'before_after' && beforeFile && afterFile) {
        await api.attachments.uploadBeforeAfter(
          updateId,
          beforeFile,
          afterFile,
          baLabel || undefined,
        );
      } else {
        return;
      }
      resetForm();
      onAdded();
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to add attachment:', err);
    } finally {
      setUploading(false);
    }
  };

  const canSubmit =
    (tab === 'image' && imageFile) ||
    (tab === 'link' && linkUrl.trim()) ||
    (tab === 'before_after' && beforeFile && afterFile);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'image', label: 'Image', icon: <ImagePlus className="h-4 w-4" /> },
    { id: 'link', label: 'Link', icon: <Link2 className="h-4 w-4" /> },
    {
      id: 'before_after',
      label: 'Before / After',
      icon: <GitCompareArrows className="h-4 w-4" />,
    },
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add Attachment</DialogTitle>
          <DialogDescription>
            Attach an image, link, or before/after comparison.
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                tab === t.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Image tab */}
        {tab === 'image' && (
          <div className="space-y-3">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className={cn(
                'w-full rounded-lg border-2 border-dashed p-8 text-center transition-colors',
                imageFile
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50',
              )}
            >
              {imageFile ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium">{imageFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(imageFile.size / 1024).toFixed(0)} KB — click to change
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to select an image
                  </p>
                </div>
              )}
            </button>
          </div>
        )}

        {/* Link tab */}
        {tab === 'link' && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="att-url">URL</Label>
              <Input
                id="att-url"
                type="url"
                placeholder="https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="att-label">
                Label <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="att-label"
                placeholder="e.g. Deployed page"
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Before/After tab */}
        {tab === 'before_after' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Before */}
              <div>
                <input
                  ref={beforeInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setBeforeFile(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  onClick={() => beforeInputRef.current?.click()}
                  className={cn(
                    'w-full rounded-lg border-2 border-dashed p-6 text-center transition-colors',
                    beforeFile
                      ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30'
                      : 'border-muted-foreground/25 hover:border-muted-foreground/50',
                  )}
                >
                  {beforeFile ? (
                    <p className="text-xs font-medium truncate">
                      {beforeFile.name}
                    </p>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="mx-auto h-5 w-5 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Before</p>
                    </div>
                  )}
                </button>
              </div>

              {/* After */}
              <div>
                <input
                  ref={afterInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setAfterFile(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  onClick={() => afterInputRef.current?.click()}
                  className={cn(
                    'w-full rounded-lg border-2 border-dashed p-6 text-center transition-colors',
                    afterFile
                      ? 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30'
                      : 'border-muted-foreground/25 hover:border-muted-foreground/50',
                  )}
                >
                  {afterFile ? (
                    <p className="text-xs font-medium truncate">
                      {afterFile.name}
                    </p>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="mx-auto h-5 w-5 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">After</p>
                    </div>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ba-label">
                Label <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="ba-label"
                placeholder="e.g. Homepage redesign"
                value={baLabel}
                onChange={(e) => setBaLabel(e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || uploading}>
            {uploading ? 'Uploading...' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
