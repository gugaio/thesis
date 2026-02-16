'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Clock, Users, TrendingUp } from 'lucide-react';
import type { Session, Hypothesis, Vote } from '@/types';
import { formatDate } from '@/lib/utils';

interface SessionHeaderProps {
  session: Session;
  hypothesis: Hypothesis;
  votes: Vote[];
  className?: string;
}

export function SessionHeader({ session, hypothesis, votes, className }: SessionHeaderProps) {
  const voteCounts = votes.reduce(
    (acc, vote) => {
      acc[vote.verdict] = (acc[vote.verdict] || 0) + 1;
      return acc;
    },
    { approve: 0, reject: 0, abstain: 0 }
  );

  const totalVotes = votes.length;
  const approveRate = totalVotes > 0 ? (voteCounts.approve / totalVotes) * 100 : 0;
  const statusColors = {
    created: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    active: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    paused: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    closed: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
  };

  const verdictColors = {
    approve: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-300 dark:border-green-700',
    reject: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-red-300 dark:border-red-700',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn('space-y-6', className)}
    >
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">THESIS War Room</h1>
            <span className={cn('px-4 py-2 rounded-full text-sm font-semibold border', statusColors[session.status])}>
              {session.status.toUpperCase()}
            </span>
            {session.finalVerdict && (
              <span className={cn('px-4 py-2 rounded-full text-sm font-semibold border flex items-center gap-2', verdictColors[session.finalVerdict])}>
                {session.finalVerdict === 'approve' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    APPROVED
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    REJECTED
                  </>
                )}
              </span>
            )}
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="font-mono">{session.id.slice(0, 12)}...</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{totalVotes} votes</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>{approveRate.toFixed(0)}% approval</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 lg:text-right">
          <div className="bg-card border border-border rounded-xl p-4 min-w-[160px]">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Created</p>
            <p className="text-sm font-medium">{formatDate(session.createdAt)}</p>
          </div>
          {session.closedAt && (
            <div className="bg-card border border-border rounded-xl p-4 min-w-[160px]">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Closed</p>
              <p className="text-sm font-medium">{formatDate(session.closedAt)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-card to-surface-alt border border-border rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Confidence Score
            </h2>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold">{hypothesis.confidence.toFixed(1)}%</span>
              <span className="text-sm text-muted-foreground">based on {totalVotes} votes</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{voteCounts.approve}</p>
              <p className="text-xs text-muted-foreground uppercase">Approve</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{voteCounts.reject}</p>
              <p className="text-xs text-muted-foreground uppercase">Reject</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{voteCounts.abstain}</p>
              <p className="text-xs text-muted-foreground uppercase">Abstain</p>
            </div>
          </div>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${hypothesis.confidence}%` }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={cn(
              'h-full rounded-full',
              hypothesis.confidence >= 70 ? 'bg-green-500' : hypothesis.confidence >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            )}
          />
        </div>
      </div>
    </motion.div>
  );
}
