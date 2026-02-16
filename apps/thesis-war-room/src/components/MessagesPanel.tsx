import { useState } from 'react';
import type { Message, Agent } from '@/types';
import { formatRelativeTime, getProfileIcon } from '@/lib/utils';
import { ArrowRight, ChevronDown, ChevronUp, Check } from 'lucide-react';

interface MessagesPanelProps {
  messages: Message[];
  agents: Agent[];
}

export function MessagesPanel({ messages, agents }: MessagesPanelProps) {
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

  const getAgentName = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    return agent?.profile.name || agentId;
  };

  const getAgentRole = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    return agent?.profile.role || 'unknown';
  };

  const getAgentColor = (role: string): string => {
    switch (role.toLowerCase()) {
      case 'debt':
        return 'border-green-400';
      case 'tech':
        return 'border-yellow-400';
      case 'market':
        return 'border-blue-400';
      case 'branding':
        return 'border-purple-400';
      default:
        return 'border-gray-400';
    }
  };

  const toggleExpand = (messageId: string) => {
    setExpandedMessages((prev) => {
      const next = new Set(prev);
      next.has(messageId) ? next.delete(messageId) : next.add(messageId);
      return next;
    });
  };

  const needsExpand = (content: string): boolean => {
    const lines = content.split('\n').length;
    const words = content.length;
    return lines > 2 || words > 200;
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold mb-4">Messages</h3>
      <div className="space-y-4 max-h-[500px] overflow-y-auto scroll-smooth">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No messages yet</p>
        ) : (
          messages.map((message) => {
            const isExpanded = expandedMessages.has(message.id);
            const shouldShowExpandButton = needsExpand(message.content);
            const roleColor = getAgentColor(getAgentRole(message.fromAgentId));

            return (
              <div
                key={message.id}
                className={`border rounded-lg p-4 bg-card hover:bg-accent/5 border-l-4 ${roleColor}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <span className="text-xl">{getProfileIcon(getAgentRole(message.fromAgentId))}</span>
                    <ArrowRight className="w-5 h-4 text-muted-foreground" />
                    <span className="text-xl">{getProfileIcon(getAgentRole(message.toAgentId))}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-base font-semibold">
                        {getAgentName(message.fromAgentId)} → {getAgentName(message.toAgentId)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(message.sentAt)}
                      </span>
                    </div>
                    <div className="relative">
                      <p
                        className={`text-base leading-relaxed text-foreground ${
                          isExpanded ? '' : 'line-clamp-2'
                        }`}
                      >
                        {message.content}
                      </p>
                      {shouldShowExpandButton && (
                        <button
                          onClick={() => toggleExpand(message.id)}
                          className="mt-2 text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                        >
                          {isExpanded ? (
                            <>
                              Show less
                              <ChevronUp className="w-3 h-3" />
                            </>
                          ) : (
                            <>
                              Show more
                              <ChevronDown className="w-3 h-3" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    {message.readAt && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                        <Check className="w-3 h-3" />
                        <span>Read at {formatRelativeTime(message.readAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
