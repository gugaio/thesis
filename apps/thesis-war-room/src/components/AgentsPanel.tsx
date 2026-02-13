import type { Agent } from '@/types';
import { formatDate, getProfileIcon } from '@/lib/utils';
import { Zap, DollarSign } from 'lucide-react';

interface AgentsPanelProps {
  agents: Agent[];
}

export function AgentsPanel({ agents }: AgentsPanelProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold mb-4">Agents</h3>
      <div className="grid gap-3">
        {agents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No agents yet
          </p>
        ) : (
          agents.map((agent) => (
            <div
              key={agent.id}
              className="border rounded-lg p-4 bg-card hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getProfileIcon(agent.profile.role)}</span>
                  <div>
                    <h4 className="font-semibold">{agent.profile.name}</h4>
                    <p className="text-xs text-muted-foreground capitalize">
                      {agent.profile.role}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    agent.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {agent.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Budget:</span>
                  <span className="font-medium">
                    {agent.budget.credits} / {agent.budget.maxCredits}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Weight:</span>
                  <span className="font-medium">{agent.profile.weight}</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-3">
                Joined: {formatDate(agent.joinedAt)}
              </p>

              <p className="text-sm mt-2 line-clamp-2">{agent.profile.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
