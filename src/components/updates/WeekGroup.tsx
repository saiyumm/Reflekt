import type { ReactNode } from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCategoryDef } from '@/lib/categories';
import type { WeekGroup as WeekGroupType, CategoryId } from '@/types';

interface WeekGroupProps {
  group: WeekGroupType;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function WeekGroup({
  group,
  defaultOpen = true,
  children,
}: WeekGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const totalUpdates = group.updates.length;

  return (
    <div>
      {/* Header */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-muted/50 transition-colors"
      >
        <ChevronRight
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-90',
          )}
        />
        <span className="text-sm font-semibold">{group.label}</span>
        <span className="text-xs text-muted-foreground">
          {totalUpdates} update{totalUpdates !== 1 ? 's' : ''}
        </span>

        {/* Category mini-bar */}
        <div className="ml-auto flex h-1.5 w-16 overflow-hidden rounded-full bg-muted">
          {Object.entries(group.categoryCounts).map(([cat, count]) => (
            <div
              key={cat}
              className={cn(getCategoryDef(cat as CategoryId).dotClass)}
              style={{ width: `${(count / totalUpdates) * 100}%` }}
            />
          ))}
        </div>
      </button>

      {/* Body */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pl-9 pr-2 pb-2 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
