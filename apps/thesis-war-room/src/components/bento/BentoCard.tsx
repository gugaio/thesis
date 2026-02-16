import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface BentoCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  colSpan?: '1' | '2' | '3' | '4' | 'full';
  variant?: 'default' | 'highlight' | 'subtle';
  hover?: boolean;
}

export function BentoCard({
  children,
  className,
  colSpan = '1',
  variant = 'default',
  hover = false,
  ...props
}: BentoCardProps) {
  const colSpanClasses = {
    '1': 'col-span-1',
    '2': 'col-span-1 md:col-span-2',
    '3': 'col-span-1 md:col-span-2 lg:col-span-3',
    '4': 'col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4',
    'full': 'col-span-full',
  };

  const variantClasses = {
    default: 'bg-card border border-border shadow-sm',
    highlight: 'bg-card border-2 border-foreground shadow-lg',
    subtle: 'bg-surface-alt border border-border-subtle',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={hover ? { scale: 1.01, y: -4 } : {}}
      className={cn(
        'rounded-2xl p-6',
        colSpanClasses[colSpan],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
