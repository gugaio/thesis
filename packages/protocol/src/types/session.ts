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
