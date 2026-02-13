export enum EventType {
  SESSION_CREATED = 'session.created',
  DOC_UPLOADED = 'doc.uploaded',
  AGENT_JOINED = 'agent.joined',
  OPINION_POSTED = 'opinion.posted',
  VOTE_CAST = 'vote.cast',
  SESSION_CLOSED = 'session.closed',
  BUPDATED = 'budget.updated',
  MESSAGE_SENT = 'message.sent'
}

export interface BaseEvent {
  id: string;
  type: EventType;
  sessionId: string;
  timestamp: Date;
  version: number;
}

export interface SessionCreatedEvent extends BaseEvent {
  type: EventType.SESSION_CREATED;
  hypothesisId: string;
  hypothesisStatement: string;
  createdBy: string;
}

export interface DocUploadedEvent extends BaseEvent {
  type: EventType.DOC_UPLOADED;
  documentId: string;
  documentName: string;
  documentType: string;
  uploadedBy: string;
}

export interface AgentJoinedEvent extends BaseEvent {
  type: EventType.AGENT_JOINED;
  agentId: string;
  agentProfileId: string;
  agentRole: string;
  budgetCredits: number;
}

export interface OpinionPostedEvent extends BaseEvent {
  type: EventType.OPINION_POSTED;
  agentId: string;
  opinionId: string;
  content: string;
  confidence: number;
}

export interface VoteCastEvent extends BaseEvent {
  type: EventType.VOTE_CAST;
  agentId: string;
  verdict: string;
  rationale: string;
}

export interface SessionClosedEvent extends BaseEvent {
  type: EventType.SESSION_CLOSED;
  closedBy: string;
  finalVerdict: string;
}

export interface BudgetUpdatedEvent extends BaseEvent {
  type: EventType.BUPDATED;
  agentId: string;
  oldCredits: number;
  newCredits: number;
  reason: string;
}

export interface MessageSentEvent extends BaseEvent {
  type: EventType.MESSAGE_SENT;
  fromAgentId: string;
  toAgentId: string;
  content: string;
}

export type Event =
  | SessionCreatedEvent
  | DocUploadedEvent
  | AgentJoinedEvent
  | OpinionPostedEvent
  | VoteCastEvent
  | SessionClosedEvent
  | BudgetUpdatedEvent
  | MessageSentEvent;
