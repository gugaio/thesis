'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Lightbulb, FileText, Calendar } from 'lucide-react';
import type { Hypothesis, Session } from '@/types';
import { formatDate } from '@/lib/utils';

interface HypothesisPanelProps {
  hypothesis: Hypothesis;
  session: Session;
  className?: string;
}

export function HypothesisPanel({ hypothesis, session, className }: HypothesisPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className={cn('bg-card border-2 border-border rounded-2xl overflow-hidden', className)}
    >
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Lightbulb className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Hypothesis</h2>
            <p className="text-sm text-muted-foreground">Core proposition under analysis</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            <FileText className="w-4 h-4" />
            Statement
          </div>
          <p className="text-lg leading-relaxed font-medium text-foreground">
            {hypothesis.statement}
          </p>
        </div>

        {hypothesis.description && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              <FileText className="w-4 h-4" />
              Description
            </div>
            <p className="text-base leading-relaxed text-muted-foreground">
              {hypothesis.description}
            </p>
          </div>
        )}

        <div className="flex items-center gap-6 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Created:</span>
            <span className="font-medium">{formatDate(session.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Status:</span>
            <span className="font-medium capitalize">{session.status}</span>
          </div>
          {session.closedAt && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Closed:</span>
              <span className="font-medium">{formatDate(session.closedAt)}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
