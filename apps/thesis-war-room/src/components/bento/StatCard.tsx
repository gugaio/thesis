import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number | ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  className?: string;
  colSpan?: '1' | '2' | '3' | '4';
}

export function StatCard({
  label,
  value,
  trend,
  trendValue,
  icon,
  className,
  colSpan = '1',
}: StatCardProps) {
  const colSpanClasses = {
    '1': 'col-span-1',
    '2': 'col-span-1 md:col-span-2',
    '3': 'col-span-1 md:col-span-2 lg:col-span-3',
    '4': 'col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4',
  };

  const trendIcons = {
    up: <TrendingUp className="w-4 h-4" />,
    down: <TrendingDown className="w-4 h-4" />,
    neutral: <Minus className="w-4 h-4" />,
  };

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-muted-foreground',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'bg-card border border-border rounded-2xl p-6 shadow-sm',
        colSpanClasses[colSpan],
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon && <span className="text-2xl">{icon}</span>}
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
        </div>
        {trend && (
          <div className={cn('flex items-center gap-1 text-xs font-medium', trendColors[trend])}>
            {trendIcons[trend]}
            {trendValue && <span>{trendValue}</span>}
          </div>
        )}
      </div>
      <div className="text-3xl font-bold tracking-tight">{value}</div>
    </motion.div>
  );
}
