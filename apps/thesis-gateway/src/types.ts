import type { GatewayCommandType } from '@thesis/protocol';
import type { AgentRole } from '@thesis/skills';

export interface SessionData {
  id: string;
  status: string;
  hypothesis: {
    statement: string;
    description?: string;
  };
  finalVerdict?: string;
}

export interface AgentInfo {
  agentId: string;
  profile: {
    role: string;
    name: string;
  };
}

export interface SessionVote {
  agentId: string;
  verdict: 'approve' | 'reject' | 'abstain';
}

export interface WebSocketEnvelope {
  type: string;
  data?: {
    type?: string;
    [key: string]: unknown;
  };
}

export interface GatewayCommandEvent {
  type: 'orchestrator.command_issued';
  sessionId: string;
  commandType: GatewayCommandType;
  issuedBy: string;
  targetAgentRole?: AgentRole;
  content?: string;
}

export type RunnerState = 'running' | 'idle' | 'stopped';

export interface GatewayRunnerConfig {
  apiUrl: string;
  wsUrl: string;
  maxIterations: number;
  iterationTimeout: number;
  iterationDelay: number;
  piProvider: string;
  piModel: string;
}
