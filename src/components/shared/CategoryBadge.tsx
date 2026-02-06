import { cn } from '@/lib/utils';
import { getCategoryDef } from '@/lib/categories';
import type { CategoryId } from '@/types';

interface CategoryBadgeProps {
  category: CategoryId;
  className?: string;
  onClick?: () => void;
}

export function CategoryBadge({ category, className, onClick }: CategoryBadgeProps) {
  const def = getCategoryDef(category);

  return (
    <span
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick();
            }
          : undefined
      }
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border',
        def.bgClass,
        def.textClass,
        def.borderClass,
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', def.dotClass)} />
      {def.label}
    </span>
  );
}
