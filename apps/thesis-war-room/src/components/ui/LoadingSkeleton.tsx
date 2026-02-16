import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  count?: number;
  type?: 'card' | 'list' | 'text' | 'avatar';
}

export function LoadingSkeleton({ className, count = 1, type = 'card' }: LoadingSkeletonProps) {
  const baseClasses = 'animate-pulse bg-muted';

  const skeletons = {
    card: (
      <div className={cn(baseClasses, 'rounded-2xl p-6', className)}>
        <div className="h-4 bg-muted-foreground/20 rounded w-1/3 mb-4" />
        <div className="h-8 bg-muted-foreground/20 rounded w-1/2 mb-2" />
        <div className="h-4 bg-muted-foreground/20 rounded w-full" />
      </div>
    ),
    list: (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={cn(baseClasses, 'w-10 h-10 rounded-full')} />
            <div className="flex-1 space-y-2">
              <div className={cn(baseClasses, 'h-4 rounded w-1/3')} />
              <div className={cn(baseClasses, 'h-3 rounded w-1/2')} />
            </div>
          </div>
        ))}
      </div>
    ),
    text: (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={cn(
              baseClasses,
              'h-4 rounded',
              i === count - 1 ? 'w-2/3' : 'w-full'
            )}
          />
        ))}
      </div>
    ),
    avatar: (
      <div className={cn('flex items-center gap-3', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={cn(baseClasses, 'w-12 h-12 rounded-full')} />
        ))}
      </div>
    ),
  };

  return skeletons[type];
}
