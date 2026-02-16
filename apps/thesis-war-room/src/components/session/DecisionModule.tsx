'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertCircle, Vote as VoteIcon } from 'lucide-react';
import type { Vote } from '@/types';
import { formatRelativeTime } from '@/lib/utils';
import { VoteDialog } from '@/components/ui/VoteDialog';
import { useState } from 'react';

interface DecisionModuleProps {
  votes: Vote[];
  className?: string;
}

export function DecisionModule({ votes, className }: DecisionModuleProps) {
  const [selectedVote, setSelectedVote] = useState<Vote | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleVoteClick = (vote: Vote) => {
    setSelectedVote(vote);
    setIsDialogOpen(true);
  };

  const voteCounts = votes.reduce(
    (acc, vote) => {
      acc[vote.verdict] = (acc[vote.verdict] || 0) + 1;
      return acc;
    },
    { approve: 0, reject: 0, abstain: 0 }
  );

  const totalVotes = votes.length;
  const getBarWidth = (count: number) => (totalVotes > 0 ? (count / totalVotes) * 100 : 0);

  const verdictConfig = {
    approve: {
      icon: CheckCircle2,
      color: 'bg-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-700 dark:text-green-400',
      borderColor: 'border-green-300 dark:border-green-700',
    },
    reject: {
      icon: XCircle,
      color: 'bg-red-500',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-700 dark:text-red-400',
      borderColor: 'border-red-300 dark:border-red-700',
    },
    abstain: {
      icon: AlertCircle,
      color: 'bg-gray-500',
      bgColor: 'bg-gray-100 dark:bg-gray-900/30',
      textColor: 'text-gray-700 dark:text-gray-400',
      borderColor: 'border-gray-300 dark:border-gray-700',
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className={cn('space-y-6', className)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <VoteIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Decision Summary</h2>
            <p className="text-sm text-muted-foreground">{totalVotes} votes cast</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {(Object.keys(verdictConfig) as Array<keyof typeof verdictConfig>).map((verdict, index) => {
          const config = verdictConfig[verdict];
          const Icon = config.icon;
          const count = voteCounts[verdict];
          const width = getBarWidth(count);

          return (
            <motion.div
              key={verdict}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Icon className={cn('w-4 h-4', config.textColor)} />
                  <span className={cn('font-semibold uppercase tracking-wide', config.textColor)}>
                    {verdict}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg">{count}</span>
                  <span className="text-muted-foreground text-sm">({width.toFixed(0)}%)</span>
                </div>
              </div>
              <div className="h-8 bg-muted/50 rounded-lg overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${width}%` }}
                  transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                  className={cn('h-full rounded-lg', config.color, 'absolute inset-y-0 left-0')}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-semibold text-foreground drop-shadow-sm">{width.toFixed(0)}%</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="space-y-3 pt-4 border-t border-border">
        <h3 className="text-lg font-semibold">Recent Votes</h3>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {votes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No votes yet
            </div>
          ) : (
            votes.slice(0, 10).map((vote) => {
              const config = verdictConfig[vote.verdict as keyof typeof verdictConfig];
              const Icon = config.icon;

              return (
                <motion.div
                  key={vote.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md',
                    config.borderColor
                  )}
                  onClick={() => handleVoteClick(vote)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={cn('w-4 h-4', config.textColor)} />
                        <span className="text-sm font-medium">Agent: {vote.agentId}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{vote.rationale}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(vote.votedAt)}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      <VoteDialog vote={selectedVote} isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
    </motion.div>
  );
}
