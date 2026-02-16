import type { Event } from '@/types';
import { formatRelativeTime } from '@/lib/utils';
import { FileText, User, MessageSquare, Vote, CheckCircle2, Clock } from 'lucide-react';

interface TimelineProps {
  events: Event[];
}

export function Timeline({ events }: TimelineProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5" />
        Timeline
      </h3>
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No events yet
          </p>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="flex gap-3 p-3 border rounded-lg bg-card"
            >
              <div className="flex-shrink-0 mt-0.5">
                {event.type === 'session.created' && (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                )}
                {event.type === 'doc.uploaded' && (
                  <FileText className="w-4 h-4 text-blue-600" />
                )}
                {event.type === 'agent.joined' && (
                  <User className="w-4 h-4 text-purple-600" />
                )}
                {event.type === 'opinion.posted' && (
                  <MessageSquare className="w-4 h-4 text-orange-600" />
                )}
                {event.type === 'message.sent' && (
                  <MessageSquare className="w-4 h-4 text-cyan-600" />
                )}
                {event.type === 'vote.cast' && (
                  <Vote className="w-4 h-4 text-pink-600" />
                )}
                {event.type === 'session.closed' && (
                  <CheckCircle2 className="w-4 h-4 text-red-600" />
                )}
                {event.type === 'budget.updated' && (
                  <Clock className="w-4 h-4 text-gray-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium capitalize">
                    {event.type.replace('.', ' ')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(event.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {event.type === 'session.created' && `Session started`}
                  {event.type === 'doc.uploaded' && `Document: ${event.documentName}`}
                  {event.type === 'agent.joined' && `Agent joined: ${event.agentRole}`}
                  {event.type === 'opinion.posted' && `Opinion posted`}
                  {event.type === 'message.sent' && `Message sent`}
                  {event.type === 'vote.cast' && `Vote: ${event.verdict}`}
                  {event.type === 'session.closed' && `Session closed: ${event.finalVerdict}`}
                  {event.type === 'budget.updated' && `Budget updated: ${event.reason}`}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
