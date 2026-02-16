'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatRelativeTime, getProfileIcon } from '@/lib/utils';
import { CheckCircle2, FileText, MessageSquare, Vote, ArrowRight } from 'lucide-react';

interface ActivityCardProps {
  type: 'opinion' | 'message' | 'vote' | 'document' | 'agent';
  title: string;
  content?: string;
  agentName?: string;
  agentRole?: string;
  targetAgentName?: string;
  verdict?: 'approve' | 'reject' | 'abstain';
  timestamp: string;
  onClick?: () => void;
  className?: string;
}

export function ActivityCard({
  type,
  title,
  content,
  agentName,
  agentRole,
  targetAgentName,
  verdict,
  timestamp,
  onClick,
  className,
}: ActivityCardProps) {
  const typeIcons = {
    opinion: <MessageSquare className="w-5 h-5 text-orange-600" />,
    message: <MessageSquare className="w-5 h-5 text-cyan-600" />,
    vote: <Vote className="w-5 h-5 text-pink-600" />,
    document: <FileText className="w-5 h-5 text-blue-600" />,
    agent: <CheckCircle2 className="w-5 h-5 text-green-600" />,
  };

  const verdictColors = {
    approve: 'bg-green-50 text-green-700 border-green-200',
    reject: 'bg-red-50 text-red-700 border-red-200',
    abstain: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  const isClickable = type === 'message' || type === 'vote';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={isClickable ? { scale: 1.01, y: -2 } : undefined}
      onClick={onClick}
      className={cn(
        'bg-card border border-border rounded-2xl p-5 transition-all duration-200',
        isClickable && 'cursor-pointer hover:border-foreground/20 hover:shadow-md',
        onClick && isClickable && 'active:scale-99',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {typeIcons[type]}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {agentRole && (
                <span className="text-xl">{getProfileIcon(agentRole)}</span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {title}
                </p>
                {agentName && targetAgentName ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {agentName} <ArrowRight className="w-3 h-3" /> {targetAgentName}
                  </p>
                ) : agentName ? (
                  <p className="text-xs text-muted-foreground">{agentName}</p>
                ) : null}
              </div>
            </div>

            {verdict && (
              <span className={cn(
                'px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0',
                verdictColors[verdict]
              )}>
                {verdict.toUpperCase()}
              </span>
            )}
          </div>

          {content && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {content}
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            {formatRelativeTime(timestamp)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
