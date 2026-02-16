'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Zap, DollarSign, Clock } from 'lucide-react';
import type { Agent } from '@/types';
import { getProfileIcon, formatDate } from '@/lib/utils';

interface AgentsPanelProps {
  agents: Agent[];
  className?: string;
}

export function AgentsPanel({ agents, className }: AgentsPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className={cn('space-y-6', className)}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Active Agents</h2>
          <p className="text-sm text-muted-foreground">{agents.length} agent{agents.length !== 1 ? 's' : ''} participating</p>
        </div>
      </div>

      <div className="space-y-4">
        {agents.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-border rounded-xl">
            <Zap className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No agents joined yet</p>
          </div>
        ) : (
          agents.map((agent, index) => {
            const budgetPercentage = (agent.budget.credits / agent.budget.maxCredits) * 100;
            const budgetColor = budgetPercentage > 60 ? 'bg-green-500' : budgetPercentage > 30 ? 'bg-yellow-500' : 'bg-red-500';

            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                className={cn(
                  'bg-card border-2 rounded-xl p-5 transition-all',
                  agent.isActive ? 'border-primary/30' : 'border-border opacity-70'
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <span className="text-3xl">{getProfileIcon(agent.profile.role)}</span>
                      <div className={cn(
                        'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card',
                        agent.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                      )} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{agent.profile.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize flex items-center gap-2">
                        {agent.profile.role}
                        {!agent.isActive && (
                          <span className="text-xs bg-muted px-2 py-0.5 rounded-full">Inactive</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Budget</span>
                      </div>
                      <span className="font-bold">
                        {agent.budget.credits} / {agent.budget.maxCredits}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${budgetPercentage}%` }}
                        transition={{ duration: 0.8, delay: 0.2 + index * 0.05 }}
                        className={cn('h-full rounded-full', budgetColor)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Weight:</span>
                    <span className="font-medium">{agent.profile.weight}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Joined:</span>
                    <span className="font-medium">{formatDate(agent.joinedAt)}</span>
                  </div>

                  <p className="text-sm text-muted-foreground pt-2 border-t border-border">
                    {agent.profile.description}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
