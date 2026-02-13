export interface Ledger {
  sessionId: string;
  entries: LedgerEntry[];
  metadata: LedgerMetadata;
}

export type LedgerEntry =
  | OpinionEntry
  | VoteEntry
  | ActionEntry
  | SystemEntry;

export interface BaseLedgerEntry {
  id: string;
  timestamp: Date;
  type: LedgerEntryType;
  agentId?: string;
  metadata: Record<string, unknown>;
}

export enum LedgerEntryType {
  OPINION = 'opinion',
  VOTE = 'vote',
  ACTION = 'action',
  SYSTEM = 'system'
}

export interface OpinionEntry extends BaseLedgerEntry {
  type: LedgerEntryType.OPINION;
  agentId: string;
  content: string;
  confidence: number;
  references: string[];
}

export interface VoteEntry extends BaseLedgerEntry {
  type: LedgerEntryType.VOTE;
  agentId: string;
  verdict: Verdict;
  rationale: string;
}

export enum Verdict {
  APPROVE = 'approve',
  REJECT = 'reject',
  ABSTAIN = 'abstain'
}

export interface ActionEntry extends BaseLedgerEntry {
  type: LedgerEntryType.ACTION;
  agentId?: string;
  actionType: string;
  tool: string;
  input: Record<string, unknown>;
  output: unknown;
  duration: number;
  success: boolean;
}

export interface SystemEntry extends BaseLedgerEntry {
  type: LedgerEntryType.SYSTEM;
  level: LogLevel;
  message: string;
}

export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LedgerMetadata {
  totalOpinions: number;
  totalVotes: number;
  totalActions: number;
  createdAt: Date;
  updatedAt: Date;
}
