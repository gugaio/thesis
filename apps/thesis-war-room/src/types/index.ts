export interface Session {
  id: string;
  status: 'created' | 'active' | 'paused' | 'closed';
  finalVerdict?: 'approve' | 'reject';
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
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
  uploadedAt: string;
}

export interface AgentProfile {
  id: string;
  name: string;
  role: string;
  description: string;
  weight: number;
  soul: string;
}

export interface Agent {
  id: string;
  profile: AgentProfile;
  joinedAt: string;
  isActive: boolean;
  budget: {
    credits: number;
    maxCredits: number;
    lastRefill: string;
  };
}

export interface Opinion {
  id: string;
  agentId: string;
  content: string;
  confidence: number;
  timestamp: string;
}

export interface Message {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  content: string;
  sentAt: string;
  readAt?: string;
}

export interface Vote {
  id: string;
  agentId: string;
  verdict: 'approve' | 'reject' | 'abstain';
  rationale: string;
  votedAt: string;
}

export interface Event {
  id: string;
  type: string;
  sessionId: string;
  timestamp: string;
  version: number;
  [key: string]: any;
}

export interface SessionData {
  session: Session;
  hypothesis: Hypothesis;
  documents: Document[];
  agents: Agent[];
  votes: Vote[];
  opinions: Opinion[];
  messages: Message[];
  ledger: Event[];
  connectionCount: number;
  clientId: string;
}

export interface WebSocketMessage {
  type: 'initial' | 'event' | 'subscribed' | 'pong' | 'error';
  sessionId?: string;
  session?: Session;
  hypothesis?: Hypothesis;
  documents?: Document[];
  agents?: Agent[];
  votes?: Vote[];
  opinions?: Opinion[];
  messages?: Message[];
  ledger?: Event[];
  data?: Event;
  connectionCount?: number;
  clientId?: string;
  message?: string;
  timestamp?: string;
}
