'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatRelativeTime, getProfileIcon } from '@/lib/utils';
import { Event } from '@/types';
import { FileText, MessageSquare, Vote, CheckCircle2, Clock } from 'lucide-react';

interface SocialTimelineFeedProps {
  events: Event[];
  className?: string;
}

export function SocialTimelineFeed({ events, className }: SocialTimelineFeedProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Activity Feed</h3>
        <span className="text-sm text-muted-foreground">
          {events.length} events
        </span>
      </div>

      <div className="relative space-y-4">
        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border-subtle" />

        <AnimatePresence mode="popLayout">
          {events.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pl-10"
            >
              <p className="text-sm text-muted-foreground text-center py-8">
                No activity yet
              </p>
            </motion.div>
          ) : (
            events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="relative pl-10"
              >
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-background border border-border rounded-full flex items-center justify-center z-10">
                  {getEventIcon(event.type)}
                </div>

                <div className="bg-card border border-border rounded-2xl p-4 transition-all duration-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {event.agentRole && (
                        <span className="text-lg">{getProfileIcon(event.agentRole)}</span>
                      )}
                      <span className="text-sm font-medium capitalize text-foreground">
                        {getEventTitle(event)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(event.timestamp)}
                    </span>
                  </div>

                  {getEventContent(event)}

                  {event.agentName && (
                    <p className="text-xs text-muted-foreground mt-2">
                      by {event.agentName}
                    </p>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function getEventIcon(type: string) {
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
}

function getEventTitle(event: Event): string {
  if (event.type === 'session.created') return 'Session Started';
  if (event.type === 'doc.uploaded') return 'Document Uploaded';
  if (event.type === 'agent.joined') return 'Agent Joined';
  if (event.type === 'opinion.posted') return 'Opinion Posted';
  if (event.type === 'message.sent') return 'Message Sent';
  if (event.type === 'vote.cast') return 'Vote Cast';
  if (event.type === 'session.closed') return 'Session Closed';
  if (event.type === 'budget.updated') return 'Budget Updated';
  
  return event.type.replace('.', ' ');
}

function getEventContent(event: Event): React.ReactNode {
  if (event.type === 'doc.uploaded' && event.documentName) {
    return <p className="text-sm text-muted-foreground">{event.documentName}</p>;
  }

  if (event.type === 'agent.joined' && event.agentRole) {
    return <p className="text-sm text-muted-foreground capitalize">{event.agentRole} Agent</p>;
  }

  if (event.type === 'opinion.posted' && event.content) {
    return (
      <p className="text-sm text-foreground line-clamp-2 mt-2">
        {event.content}
      </p>
    );
  }

  if (event.type === 'message.sent' && event.content) {
    return (
      <p className="text-sm text-foreground line-clamp-2 mt-2">
        {event.content}
      </p>
    );
  }

  if (event.type === 'vote.cast' && event.verdict) {
    const colors = {
      approve: 'text-green-600 bg-green-50',
      reject: 'text-red-600 bg-red-50',
      abstain: 'text-gray-600 bg-gray-50',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[event.verdict as keyof typeof colors]}`}>
        {event.verdict.toUpperCase()}
      </span>
    );
  }

  if (event.type === 'session.closed' && event.finalVerdict) {
    const colors = {
      approve: 'text-green-600 bg-green-50',
      reject: 'text-red-600 bg-red-50',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[event.finalVerdict as keyof typeof colors]}`}>
        {event.finalVerdict.toUpperCase()}
      </span>
    );
  }

  if (event.type === 'budget.updated' && event.reason) {
    return <p className="text-sm text-muted-foreground">{event.reason}</p>;
  }

  return null;
}
