'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ActivityHeatmapProps {
  data: {
    date: string;
    count: number;
  }[];
  className?: string;
}

export function ActivityHeatmap({ data, className }: ActivityHeatmapProps) {
  const maxCount = Math.max(...data.map(d => d.count), 1);

  const getColorClass = (count: number): string => {
    const intensity = count / maxCount;
    if (intensity === 0) return 'bg-muted';
    if (intensity < 0.25) return 'bg-foreground/10 dark:bg-foreground/5';
    if (intensity < 0.5) return 'bg-foreground/25 dark:bg-foreground/15';
    if (intensity < 0.75) return 'bg-foreground/50 dark:bg-foreground/30';
    return 'bg-foreground dark:bg-foreground/80';
  };

  const weeks: Date[][] = [];
  const startDate = new Date(data[0]?.date || new Date());
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const endDate = new Date(data[data.length - 1]?.date || new Date());
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 7)) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(d);
      day.setDate(day.getDate() + i);
      if (day <= endDate) {
        week.push(day);
      }
    }
    if (week.length > 0) {
      weeks.push(week);
    }
  }

  const getCountForDate = (date: Date): number => {
    const dateStr = date.toISOString().split('T')[0];
    const entry = data.find(d => d.date === dateStr);
    return entry?.count || 0;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn('w-full', className)}
    >
      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => {
                const count = getCountForDate(day);
                return (
                  <motion.div
                    key={dayIndex}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: (weekIndex * 7 + dayIndex) * 0.01 }}
                    className="group relative"
                  >
                    <div
                      className={cn(
                        'w-3 h-3 rounded-sm transition-all duration-200',
                        getColorClass(count)
                      )}
                      title={`${formatDate(day)}: ${count} activities`}
                    />
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-muted" />
          <div className="w-3 h-3 rounded-sm bg-foreground/10 dark:bg-foreground/5" />
          <div className="w-3 h-3 rounded-sm bg-foreground/25 dark:bg-foreground/15" />
          <div className="w-3 h-3 rounded-sm bg-foreground/50 dark:bg-foreground/30" />
          <div className="w-3 h-3 rounded-sm bg-foreground dark:bg-foreground/80" />
        </div>
        <span>More</span>
      </div>
    </motion.div>
  );
}
