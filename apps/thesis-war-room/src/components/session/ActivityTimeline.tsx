'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MessageSquare, Vote, FileText, CheckCircle2, Clock } from 'lucide-react';
import { Event } from '@/types';
import { formatRelativeTime, getProfileIcon } from '@/lib/utils';

interface ActivityTimelineProps {
  events: Event[];
  className?: string;
}

export function ActivityTimeline({ events, className }: ActivityTimelineProps) {
  const getEventIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'session.created': <CheckCircle2 className="w-4 h-4 text-green-600" />,
      'doc.uploaded': <FileText className="w-4 h-4 text-blue-600" />,
      'agent.joined': <CheckCircle2 className="w-4 h-4 text-purple-600" />,
      'opinion.posted': <MessageSquare className="w-4 h-4 text-orange-600" />,
      'message.sent': <MessageSquare className="w-4 h-4 text-cyan-600" />,
      'vote.cast': <Vote className="w-4 h-4 text-pink-600" />,
      'session.closed': <CheckCircle2 className="w-4 h-4 text-red-600" />,
      'budget.updated': <Clock className="w-4 h-4 text-gray-600" />,
    };
    return iconMap[type] || <Clock className="w-4 h-4 text-gray-600" />;
  };

  const getEventTitle = (event: Event): string => {
    const titleMap: Record<string, string> = {
      'session.created': 'Session Started',
      'doc.uploaded': 'Document Uploaded',
      'agent.joined': 'Agent Joined',
      'opinion.posted': 'Opinion Posted',
      'message.sent': 'Message Sent',
      'vote.cast': 'Vote Cast',
      'session.closed': 'Session Closed',
      'budget.updated': 'Budget Updated',
    };
    return titleMap[event.type] || event.type.replace('.', ' ');
  };

  const getEventColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      'session.created': 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
      'doc.uploaded': 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
      'agent.joined': 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700',
      'opinion.posted': 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700',
      'message.sent': 'bg-cyan-100 dark:bg-cyan-900/30 border-cyan-300 dark:border-cyan-700',
      'vote.cast': 'bg-pink-100 dark:bg-pink-900/30 border-pink-300 dark:border-pink-700',
      'session.closed': 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700',
      'budget.updated': 'bg-gray-100 dark:bg-gray-900/30 border-gray-300 dark:border-gray-700',
    };
    return colorMap[type] || 'bg-muted border-border';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className={cn('space-y-6', className)}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Clock className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Activity Timeline</h2>
          <p className="text-sm text-muted-foreground">{events.length} event{events.length !== 1 ? 's' : ''} recorded</p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-4 pl-12">
          <AnimatePresence mode="popLayout">
            {events.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8 text-muted-foreground"
              >
                No activity yet
              </motion.div>
            ) : (
              events.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="relative"
                >
                  <div className="absolute -left-12 top-0 w-12 h-12 bg-background border-2 border-border rounded-full flex items-center justify-center z-10 shadow-sm">
                    {getEventIcon(event.type)}
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      'border-2 rounded-xl p-4 bg-card transition-all',
                      getEventColor(event.type)
                    )}
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {event.agentRole && (
                          <span className="text-xl">{getProfileIcon(event.agentRole)}</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-base">{getEventTitle(event)}</h4>
                          {event.agentName && (
                            <p className="text-sm text-muted-foreground">by {event.agentName}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatRelativeTime(event.timestamp)}
                      </span>
                    </div>

                    {event.content && (
                      <p className="text-sm text-foreground mt-2 line-clamp-2">
                        {event.content}
                      </p>
                    )}
                  </motion.div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
