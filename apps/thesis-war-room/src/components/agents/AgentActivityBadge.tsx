'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AgentActivityBadgeProps {
  count: number;
  maxCount?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AgentActivityBadge({ count, maxCount = 10, className, size = 'md' }: AgentActivityBadgeProps) {
  const intensity = Math.min(count / maxCount, 1);

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const getColorClass = () => {
    if (count === 0) return 'bg-muted';
    if (intensity < 0.25) return 'bg-foreground/20';
    if (intensity < 0.5) return 'bg-foreground/40';
    if (intensity < 0.75) return 'bg-foreground/60';
    return 'bg-foreground';
  };

  const pulseClass = intensity > 0.5 ? 'animate-pulse' : '';

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn('flex items-center gap-1.5', className)}
    >
      <div className={cn(sizeClasses[size], getColorClass(), pulseClass, 'rounded-full')} />
      {size !== 'sm' && (
        <span className="text-xs text-muted-foreground">{count}</span>
      )}
    </motion.div>
  );
}
