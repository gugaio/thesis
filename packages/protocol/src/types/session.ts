export enum SessionStatus {
  CREATED = 'created',
  ACTIVE = 'active',
  PAUSED = 'paused',
  CLOSED = 'closed'
}

export interface Session {
  id: string;
  status: SessionStatus;
  hypothesis: Hypothesis;
  finalVerdict?: VerdictType;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  documents: Document[];
  agents: Agent[];
}

export interface Hypothesis {
  id: string;
  statement: string;
  description: string;
  confidence: number;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  contentHash: string;
}

export interface Agent {
  id: string;
  profile: AgentProfile;
  joinedAt: Date;
  isActive: boolean;
  budget: InteractionBudget;
}

export interface AgentProfile {
  id: string;
  name: string;
  role: string;
  description: string;
  weight: number;
  soul: string;
}

export interface InteractionBudget {
  credits: number;
  maxCredits: number;
  lastRefill: Date;
}

export enum VerdictType {
  APPROVE = 'approve',
  REJECT = 'reject',
  ABSTAIN = 'abstain'
}

export interface Vote {
  id: string;
  sessionId: string;
  agentId: string;
  verdict: VerdictType;
  rationale: string;
  votedAt: Date;
}

export interface AgentRanking {
  id: string;
  agentId: string;
  score: number;
  totalVotes: number;
  correctVotes: number;
  totalOpinions: number;
  avgConfidence: number;
  lastUpdated: Date;
}
