export enum CommandType {
  INIT_SESSION = 'init_session',
  UPLOAD_DOC = 'upload_doc',
  JOIN_SESSION = 'join_session',
  POST_OPINION = 'post_opinion',
  CAST_VOTE = 'cast_vote',
  CLOSE_SESSION = 'close_session',
  SEND_MESSAGE = 'send_message',
  QUERY_STATUS = 'query_status'
}

export interface BaseCommand {
  id: string;
  type: CommandType;
  sessionId: string;
  issuedBy: string;
  issuedAt: Date;
}

export interface InitSessionCommand extends BaseCommand {
  type: CommandType.INIT_SESSION;
  hypothesisStatement: string;
  hypothesisDescription?: string;
}

export interface UploadDocCommand extends BaseCommand {
  type: CommandType.UPLOAD_DOC;
  documentName: string;
  documentType: string;
  documentSize: number;
  content: string;
}

export interface JoinSessionCommand extends BaseCommand {
  type: CommandType.JOIN_SESSION;
  agentProfileId: string;
  initialCredits?: number;
}

export interface PostOpinionCommand extends BaseCommand {
  type: CommandType.POST_OPINION;
  content: string;
  confidence: number;
  references?: string[];
}

export interface CastVoteCommand extends BaseCommand {
  type: CommandType.CAST_VOTE;
  verdict: string;
  rationale?: string;
}

export interface CloseSessionCommand extends BaseCommand {
  type: CommandType.CLOSE_SESSION;
  finalVerdict: string;
  notes?: string;
}

export interface SendMessageCommand extends BaseCommand {
  type: CommandType.SEND_MESSAGE;
  toAgentId: string;
  content: string;
}

export interface QueryStatusCommand extends BaseCommand {
  type: CommandType.QUERY_STATUS;
  agentId?: string;
}

export type Command =
  | InitSessionCommand
  | UploadDocCommand
  | JoinSessionCommand
  | PostOpinionCommand
  | CastVoteCommand
  | CloseSessionCommand
  | SendMessageCommand
  | QueryStatusCommand;
