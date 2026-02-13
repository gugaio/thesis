import type { Message, Agent } from '@/types';
import { formatRelativeTime, getProfileIcon } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface MessagesPanelProps {
  messages: Message[];
  agents: Agent[];
}

export function MessagesPanel({ messages, agents }: MessagesPanelProps) {
  const getAgentName = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    return agent?.profile.name || agentId;
  };

  const getAgentRole = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    return agent?.profile.role || 'unknown';
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold mb-4">Messages</h3>
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No messages yet
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className="border rounded-lg p-3 bg-card hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 flex items-center gap-2">
                  <span className="text-xl">{getProfileIcon(getAgentRole(message.fromAgentId))}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xl">{getProfileIcon(getAgentRole(message.toAgentId))}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">
                      {getAgentName(message.fromAgentId)} → {getAgentName(message.toAgentId)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(message.sentAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {message.content}
                  </p>
                  {message.readAt && (
                    <p className="text-xs text-green-600 mt-1">
                      Read at {formatRelativeTime(message.readAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
