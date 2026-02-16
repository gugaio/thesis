'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getProfileIcon } from '@/lib/utils';
import type { Agent } from '@/types';

interface AgentIdentityCardProps {
  agent: Agent;
  className?: string;
  stats?: {
    messages?: number;
    votes?: number;
    opinions?: number;
  };
}

export function AgentIdentityCard({ agent, className, stats }: AgentIdentityCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'bg-card border border-border rounded-2xl p-5 transition-all duration-200',
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="text-4xl">{getProfileIcon(agent.profile.role)}</span>
            <div className={cn(
              'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card',
              agent.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            )} />
          </div>
          <div>
            <h4 className="font-semibold text-lg">{agent.profile.name}</h4>
            <p className="text-sm text-muted-foreground capitalize">
              {agent.profile.role}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Budget</span>
          <span className="font-medium">
            {agent.budget.credits} / {agent.budget.maxCredits}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Weight</span>
          <span className="font-medium">{agent.profile.weight}</span>
        </div>
      </div>

      {stats && (stats.messages || stats.votes || stats.opinions) && (
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border">
          {stats.messages !== undefined && (
            <div className="text-center">
              <p className="text-lg font-bold">{stats.messages}</p>
              <p className="text-xs text-muted-foreground">Messages</p>
            </div>
          )}
          {stats.votes !== undefined && (
            <div className="text-center">
              <p className="text-lg font-bold">{stats.votes}</p>
              <p className="text-xs text-muted-foreground">Votes</p>
            </div>
          )}
          {stats.opinions !== undefined && (
            <div className="text-center">
              <p className="text-lg font-bold">{stats.opinions}</p>
              <p className="text-xs text-muted-foreground">Opinions</p>
            </div>
          )}
        </div>
      )}

      <p className="text-sm text-muted-foreground mt-4 line-clamp-2">
        {agent.profile.description}
      </p>
    </motion.div>
  );
}
